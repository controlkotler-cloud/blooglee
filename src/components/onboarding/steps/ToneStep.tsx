import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { useProfile } from "@/hooks/useProfile";
import { OnboardingNavButtons } from "../OnboardingNavButtons";
import type { OnboardingStepData } from "@/hooks/useOnboarding";
import {
  getAudienceExample,
  getAudiencePlaceholder,
  getBusinessTypeWarning,
  getContentGoalExample,
  getContentGoalPlaceholder,
  getEditorialFocusExample,
  getSeasonalWarning,
} from "@/lib/site-profile";

const TONES = [
  {
    value: "casual",
    icon: "🤝",
    label: "Cercano y amigable",
    desc: "Como hablar con un cliente con confianza. Claro, humano y práctico.",
  },
  {
    value: "formal",
    icon: "👔",
    label: "Formal y profesional",
    desc: "Lenguaje institucional, ordenado y serio, sin sonar frío.",
  },
  {
    value: "technical",
    icon: "🎓",
    label: "Técnico y especializado",
    desc: "Para audiencias expertas que valoran precisión y profundidad.",
  },
  {
    value: "educational",
    icon: "💬",
    label: "Divulgativo y accesible",
    desc: "Explica temas complejos de forma sencilla y útil.",
  },
];

const PILLAR_OPTIONS = [
  { value: "educational", label: "Educativo", description: "Guías, how-to y explicaciones prácticas." },
  { value: "trends", label: "Tendencias", description: "Novedades, cambios y oportunidades del sector." },
  { value: "cases", label: "Casos prácticos", description: "Ejemplos, situaciones reales y aprendizajes aplicables." },
  { value: "seasonal", label: "Estacional", description: "Campañas, momentos del año y oportunidades temporales." },
  { value: "opinion", label: "Opinión/Análisis", description: "Reflexiones, criterio experto y lectura estratégica." },
];

const LENGTH_OPTIONS = [
  { value: "short", label: "Corto (~800 palabras)", description: "Más ágil y directo." },
  { value: "medium", label: "Medio (~1500 palabras)", description: "Equilibrio entre profundidad y lectura." },
  { value: "long", label: "Largo (~2500 palabras)", description: "Guías completas y fuerte ambición SEO." },
];

const SECTOR_TONE_MAP: Record<string, string> = {
  farmacia: "casual",
  peluqueria: "casual",
  restaurante: "casual",
  clinica_dental: "formal",
  asesoria: "formal",
  inmobiliaria: "formal",
  gimnasio: "casual",
  ecommerce: "casual",
  marketing: "casual",
  veterinaria: "educational",
};

function getDefaultLengthForPlan(plan: string | undefined): "short" | "medium" | "long" {
  if (plan === "free") return "short";
  if (plan === "starter") return "medium";
  return "long";
}

function isLengthAllowed(plan: string | undefined, value: string): boolean {
  if (plan === "free") return value === "short";
  if (plan === "starter") return value === "short" || value === "medium";
  return value === "short" || value === "medium" || value === "long";
}

interface ToneStepProps {
  onNext: () => void;
  onBack: () => void;
  saveStepData: (key: string, data: object) => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

export function ToneStep({ onNext, onBack, saveStepData, stepData, siteId }: ToneStepProps) {
  const { data: profile } = useProfile();
  const userPlan = profile?.plan ?? "free";
  const sector = stepData?.step1?.sector ?? "";
  const businessType = stepData?.step1?.business_type ?? "";
  const recommendedTone = SECTOR_TONE_MAP[sector] ?? "";

  const suggestedAudience = (stepData?.step1?.audience_suggestion ?? "").trim();
  const suggestedContentGoal = (stepData?.step1?.content_goal_suggestion ?? "").trim();
  const suggestedEditorialFocus = (stepData?.step1?.editorial_focus_suggestion ?? "").trim();

  const [tone, setTone] = useState(stepData?.step2?.tone ?? recommendedTone);
  const [audience, setAudience] = useState(stepData?.step2?.audience ?? suggestedAudience);
  const [customTopic, setCustomTopic] = useState(stepData?.step2?.custom_topic ?? suggestedEditorialFocus);
  const [contentGoal, setContentGoal] = useState(stepData?.step2?.content_goal ?? suggestedContentGoal);
  const [contentPillars, setContentPillars] = useState<string[]>(
    stepData?.step2?.content_pillars ?? ["educational", "trends"],
  );
  const [preferredLength, setPreferredLength] = useState<string>(
    stepData?.step2?.preferred_length ?? getDefaultLengthForPlan(userPlan),
  );
  const [isSaving, setIsSaving] = useState(false);

  const audiencePlaceholder = useMemo(() => getAudiencePlaceholder(sector), [sector]);
  const audienceExample = useMemo(() => getAudienceExample(sector), [sector]);
  const editorialFocusExample = useMemo(() => getEditorialFocusExample(sector), [sector]);
  const contentGoalPlaceholder = useMemo(() => getContentGoalPlaceholder(sector), [sector]);
  const contentGoalExample = useMemo(() => getContentGoalExample(sector), [sector]);
  const businessTypeWarning = useMemo(() => getBusinessTypeWarning(businessType, audience), [businessType, audience]);
  const seasonalWarning = useMemo(
    () => getSeasonalWarning(businessType, contentPillars),
    [businessType, contentPillars],
  );

  const canProceed =
    tone.length > 0 &&
    audience.trim().length > 0 &&
    customTopic.trim().length > 0 &&
    contentGoal.trim().length > 0 &&
    contentPillars.length >= 2;

  const togglePillar = (pillar: string) => {
    setContentPillars((current) => {
      if (current.includes(pillar)) {
        if (current.length <= 2) return current;
        return current.filter((item) => item !== pillar);
      }
      if (current.length >= 4) return current;
      return [...current, pillar];
    });
  };

  const handlePreferredLengthChange = (value: string) => {
    if (!isLengthAllowed(userPlan, value)) return;
    setPreferredLength(value);
  };

  const handleNext = async () => {
    if (!canProceed) return;
    setIsSaving(true);

    try {
      const data = {
        tone,
        audience: audience.trim(),
        custom_topic: customTopic.trim(),
        content_goal: contentGoal.trim(),
        content_pillars: contentPillars,
        preferred_length: preferredLength,
      };

      await saveStepData("step2", data);

      track("onboarding_editorial_profile_completed", {
        tone,
        pillars_count: contentPillars.length,
        preferred_length: preferredLength,
      });

      if (siteId) {
        await supabase
          .from("sites")
          .update({
            tone,
            target_audience: audience.trim() || null,
            custom_topic: customTopic.trim() || null,
            content_goal: contentGoal.trim() || null,
            content_pillars: contentPillars,
            preferred_length: preferredLength,
          })
          .eq("id", siteId);
      }

      onNext();
    } catch (err) {
      console.error("Error in ToneStep:", err);
      toast.error("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Define el perfil editorial de tu blog
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Solo tres decisiones clave: para quién escribes, sobre qué temas y qué objetivo de negocio quieres conseguir.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Tono de voz <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TONES.map((t) => {
            const isSelected = tone === t.value;
            const isRecommended = recommendedTone === t.value;

            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={`relative flex flex-row sm:flex-col items-start gap-3 sm:gap-1.5 p-3 sm:p-4 rounded-xl border-2 text-left transition-all duration-200 min-h-[60px] sm:min-h-[130px] ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                {isRecommended && (
                  <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 sm:px-2.5 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    Recomendado
                  </span>
                )}
                {isSelected && !isRecommended && (
                  <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-checkmark-pop">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </span>
                )}
                <span className="text-[28px] shrink-0 mt-3 sm:mt-1 sm:mb-1">{t.icon}</span>
                <div className="flex-1 min-w-0 mt-1 sm:mt-0">
                  <span className="text-sm font-semibold text-foreground block">{t.label}</span>
                  <span className="text-xs text-muted-foreground leading-snug block">{t.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="audience" className="text-sm font-medium">
          Audiencia objetivo <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="audience"
          rows={3}
          placeholder={audiencePlaceholder}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="text-base resize-none rounded-lg min-h-[48px]"
          maxLength={500}
        />
        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium">Ejemplo:</span> {audienceExample}
        </p>
        {suggestedAudience && audience.trim() !== suggestedAudience && (
          <button
            type="button"
            onClick={() => setAudience(suggestedAudience)}
            className="text-xs text-primary underline underline-offset-2"
          >
            Usar sugerencia detectada: {suggestedAudience}
          </button>
        )}
      </div>

      {businessTypeWarning && (
        <Alert>
          <AlertDescription>{businessTypeWarning}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="custom_topic" className="text-sm font-medium">
          Temas y enfoque editorial <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="custom_topic"
          rows={3}
          placeholder="Define las lineas tematicas y el angulo general del contenido."
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          className="text-base resize-none rounded-lg min-h-[48px]"
          maxLength={500}
        />
        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium">Ejemplo:</span> {editorialFocusExample}
        </p>
        {suggestedEditorialFocus && customTopic.trim() !== suggestedEditorialFocus && (
          <button
            type="button"
            onClick={() => setCustomTopic(suggestedEditorialFocus)}
            className="text-xs text-primary underline underline-offset-2"
          >
            Usar sugerencia detectada: {suggestedEditorialFocus}
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content_goal" className="text-sm font-medium">
          Objetivo de negocio del blog <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="content_goal"
          rows={3}
          placeholder={contentGoalPlaceholder}
          value={contentGoal}
          onChange={(e) => setContentGoal(e.target.value)}
          className="text-base resize-none rounded-lg min-h-[48px]"
          maxLength={500}
        />
        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium">Ejemplo:</span> {contentGoalExample}
        </p>
        {suggestedContentGoal && contentGoal.trim() !== suggestedContentGoal && (
          <button
            type="button"
            onClick={() => setContentGoal(suggestedContentGoal)}
            className="text-xs text-primary underline underline-offset-2"
          >
            Usar sugerencia detectada: {suggestedContentGoal}
          </button>
        )}
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="space-y-1">
          <Label className="text-sm font-semibold">Pilares de contenido</Label>
          <p className="text-xs text-muted-foreground">
            Selecciona entre 2 y 4 lineas de contenido para dar variedad sin perder foco.
          </p>
        </div>
        <div className="space-y-3">
          {PILLAR_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-start space-x-3">
              <Checkbox
                id={`pillar-${option.value}`}
                checked={contentPillars.includes(option.value)}
                onCheckedChange={() => togglePillar(option.value)}
              />
              <div className="grid gap-0.5">
                <Label htmlFor={`pillar-${option.value}`} className="font-normal cursor-pointer">
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
        {seasonalWarning && (
          <Alert>
            <AlertDescription>{seasonalWarning}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="space-y-1">
          <Label className="text-sm font-semibold">Longitud preferida</Label>
          <p className="text-xs text-muted-foreground">
            La longitud condiciona profundidad, SEO y tiempo de lectura. Puedes cambiarla después.
          </p>
        </div>
        <div className="space-y-3">
          {LENGTH_OPTIONS.map((option) => {
            const allowed = isLengthAllowed(userPlan, option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePreferredLengthChange(option.value)}
                disabled={!allowed}
                className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                  preferredLength === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                } ${!allowed ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
                {!allowed && <p className="mt-1 text-xs text-amber-600">Disponible en un plan superior</p>}
              </button>
            );
          })}
        </div>
      </div>

      <OnboardingNavButtons onNext={handleNext} onBack={onBack} nextDisabled={!canProceed} isSaving={isSaving} />
    </div>
  );
}
