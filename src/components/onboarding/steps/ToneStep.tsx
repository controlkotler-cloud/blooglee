import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { OnboardingNavButtons } from "../OnboardingNavButtons";
import type { OnboardingStepData } from "@/hooks/useOnboarding";
import { getAudiencePlaceholder, getBusinessTypeWarning, getContentGoalPlaceholder } from "@/lib/site-profile";

const TONES = [
  {
    value: "casual",
    icon: "🤝",
    label: "Cercano y amigable",
    desc: "Como hablar con un vecino. Tuteo, lenguaje sencillo.",
  },
  {
    value: "formal",
    icon: "👔",
    label: "Formal y profesional",
    desc: "Lenguaje institucional y serio. Usted, sin jerga excesiva.",
  },
  {
    value: "technical",
    icon: "🎓",
    label: "Técnico y especializado",
    desc: "Para audiencia experta. Posiciónate como autoridad en tu sector.",
  },
  {
    value: "educational",
    icon: "💬",
    label: "Divulgativo y accesible",
    desc: "Explica temas complejos de forma sencilla. Ideal para salud, legal, finanzas.",
  },
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

interface ToneStepProps {
  onNext: () => void;
  onBack: () => void;
  saveStepData: (key: string, data: object) => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

export function ToneStep({ onNext, onBack, saveStepData, stepData, siteId }: ToneStepProps) {
  const sector = stepData?.step1?.sector ?? "";
  const businessType = stepData?.step1?.business_type ?? "";
  const recommendedTone = SECTOR_TONE_MAP[sector] ?? "";

  const [tone, setTone] = useState(stepData?.step2?.tone ?? recommendedTone);
  const [audience, setAudience] = useState(stepData?.step2?.audience ?? "");
  const [contentGoal, setContentGoal] = useState(stepData?.step2?.content_goal ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const audiencePlaceholder = useMemo(() => getAudiencePlaceholder(sector), [sector]);
  const contentGoalPlaceholder = useMemo(() => getContentGoalPlaceholder(sector), [sector]);
  const businessTypeWarning = useMemo(() => getBusinessTypeWarning(businessType, audience), [businessType, audience]);

  const canProceed = tone.length > 0;

  const handleNext = async () => {
    if (!canProceed) return;
    setIsSaving(true);

    try {
      const data = { tone, audience: audience.trim(), content_goal: contentGoal.trim() };
      await saveStepData("step2", data);

      if (!audience.trim()) {
        track("onboarding_step_skipped", { step: 2, field: "audience" });
      }

      if (siteId) {
        await supabase
          .from("sites")
          .update({
            tone,
            target_audience: audience.trim() || null,
            content_goal: contentGoal.trim() || null,
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
          ¿Cómo quieres que suene tu blog?
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Elige el estilo que mejor represente a tu negocio. Podrás cambiarlo cuando quieras.
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
                <span className="text-[28px] sm:text-[28px] shrink-0 mt-3 sm:mt-1 sm:mb-1">{t.icon}</span>
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
          Tu audiencia ideal
        </Label>
        <Textarea
          id="audience"
          rows={4}
          placeholder={audiencePlaceholder}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="text-base resize-none rounded-lg min-h-[48px]"
          maxLength={400}
        />
        <p className="text-[13px] text-muted-foreground">
          Describe al decisor que te compra: perfil, objetivo, problema y qué valora al decidir.
        </p>
      </div>

      {businessTypeWarning && (
        <Alert>
          <AlertDescription>{businessTypeWarning}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="content_goal" className="text-sm font-medium">
          ¿Qué debe conseguir el contenido?
        </Label>
        <Textarea
          id="content_goal"
          rows={3}
          placeholder={contentGoalPlaceholder}
          value={contentGoal}
          onChange={(e) => setContentGoal(e.target.value)}
          className="text-base resize-none rounded-lg min-h-[48px]"
          maxLength={400}
        />
        <p className="text-[13px] text-muted-foreground">
          No pongas un título concreto. Define el objetivo editorial y comercial que debe cumplir el blog.
        </p>
      </div>

      <OnboardingNavButtons onNext={handleNext} onBack={onBack} nextDisabled={!canProceed} isSaving={isSaving} />
    </div>
  );
}
