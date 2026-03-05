import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Users, FileText, Ban } from "lucide-react";
import {
  getAngleToAvoidPlaceholder,
  getAudienceExample,
  getAudiencePlaceholder,
  getAvoidTopicsPlaceholder,
  getBusinessTypeWarning,
  getContentGoalExample,
  getContentGoalPlaceholder,
  getPreferredSourcesPlaceholder,
  getPriorityTopicsPlaceholder,
  getSeasonalWarning,
} from "@/lib/site-profile";

const TONE_OPTIONS = [
  { value: "formal", label: "Formal y profesional", description: "Lenguaje institucional y serio" },
  { value: "casual", label: "Cercano pero experto", description: "Accesible sin perder autoridad" },
  { value: "technical", label: "Técnico y especializado", description: "Para audiencia experta" },
  { value: "educational", label: "Divulgativo y accesible", description: "Explica conceptos complejos" },
];

const PILLAR_OPTIONS = [
  { value: "educational", label: "Educativo", description: "Guías, tutoriales, how-to" },
  { value: "trends", label: "Tendencias", description: "Novedades, innovación del sector" },
  { value: "cases", label: "Casos prácticos", description: "Ejemplos reales, testimonios" },
  { value: "seasonal", label: "Estacional", description: "Adaptado a la época del año" },
  { value: "opinion", label: "Opinión/Análisis", description: "Perspectivas del sector" },
];

const LENGTH_OPTIONS = [
  { value: "short", label: "Corto (~800 palabras)", description: "Lectura rápida, ideal para móvil" },
  { value: "medium", label: "Medio (~1500 palabras)", description: "Equilibrado para SEO" },
  { value: "long", label: "Largo (~2500 palabras)", description: "SEO intensivo, guías completas" },
];

interface ContentProfileCardProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  register: any;
  plan: "free" | "starter" | "pro" | "agency";
}

export function ContentProfileCard({ watch, setValue, register, plan }: ContentProfileCardProps) {
  const watchedTone = watch("tone") || "casual";
  const watchedPillars = watch("content_pillars") || ["educational", "trends", "seasonal"];
  const watchedLength = watch("preferred_length") || "medium";
  const watchedSector = watch("sector") || "";
  const watchedBusinessType = watch("business_type") || "";
  const watchedAudience = watch("target_audience") || "";
  const audienceWarning = getBusinessTypeWarning(watchedBusinessType, watchedAudience);
  const seasonalWarning = getSeasonalWarning(watchedBusinessType, watchedPillars);

  const isLengthAllowed = (value: string) => {
    if (plan === "free") return value === "short";
    if (plan === "starter") return value === "short" || value === "medium";
    return value === "short" || value === "medium" || value === "long";
  };

  const togglePillar = (pillar: string) => {
    const current = watchedPillars || [];
    if (current.includes(pillar)) {
      if (current.length > 1) {
        setValue(
          "content_pillars",
          current.filter((p: string) => p !== pillar),
          { shouldDirty: true },
        );
      }
    } else {
      if (current.length < 4) {
        setValue("content_pillars", [...current, pillar], { shouldDirty: true });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          Perfil de contenido
        </CardTitle>
        <CardDescription>Personaliza cómo se generan los artículos para tu sitio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Tono de voz
          </Label>
          <RadioGroup
            value={watchedTone}
            onValueChange={(v) => setValue("tone", v, { shouldDirty: true })}
            className="grid gap-2"
          >
            {TONE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem value={option.value} id={`tone-${option.value}`} className="mt-1" />
                <div className="grid gap-0.5">
                  <Label htmlFor={`tone-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_audience" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Audiencia objetivo
          </Label>
          <Textarea
            id="target_audience"
            placeholder={getAudiencePlaceholder(watchedSector)}
            {...register("target_audience")}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Describe al decisor que quieres atraer: perfil, objetivo, problema y qué valora al decidir.
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Ejemplo:</span> {getAudienceExample(watchedSector)}
          </p>
        </div>

        {audienceWarning && (
          <Alert>
            <AlertDescription>{audienceWarning}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="content_goal">Objetivo de negocio del blog</Label>
          <Textarea
            id="content_goal"
            placeholder={getContentGoalPlaceholder(watchedSector)}
            {...register("content_goal")}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Explica qué debe conseguir el contenido para tu negocio. Piensa en atraer tráfico cualificado, reforzar
            autoridad, captar contactos o apoyar ventas.
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Ejemplo:</span> {getContentGoalExample(watchedSector)}
          </p>
        </div>

        <div className="space-y-3">
          <Label>Pilares de contenido (selecciona 2-4)</Label>
          <div className="grid gap-3">
            {PILLAR_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <Checkbox
                  id={`pillar-${option.value}`}
                  checked={watchedPillars.includes(option.value)}
                  onCheckedChange={() => togglePillar(option.value)}
                  disabled={watchedPillars.includes(option.value) && watchedPillars.length <= 1}
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
          <p className="text-xs text-muted-foreground">
            Los pilares rotan automáticamente para dar variedad a tu contenido
          </p>
          {seasonalWarning && (
            <Alert>
              <AlertDescription>{seasonalWarning}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority_topics" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Temas prioritarios
          </Label>
          <Textarea
            id="priority_topics"
            placeholder={getPriorityTopicsPlaceholder(watchedSector)}
            {...register("priority_topics")}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Separa con comas las líneas de contenido que quieres priorizar.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avoid_topics" className="flex items-center gap-2">
            <Ban className="w-4 h-4" />
            Temas a evitar
          </Label>
          <Textarea
            id="avoid_topics"
            placeholder={getAvoidTopicsPlaceholder(watchedSector)}
            {...register("avoid_topics")}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Separa los temas con comas. El sistema evitará estos temas en la generación.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="angle_to_avoid" className="flex items-center gap-2">
            <Ban className="w-4 h-4" />
            Enfoque a evitar
          </Label>
          <Textarea
            id="angle_to_avoid"
            placeholder={getAngleToAvoidPlaceholder(watchedSector)}
            {...register("angle_to_avoid")}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Útil cuando el tema puede ser válido, pero no quieres cierto ángulo o tipo de redacción.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferred_source_domains" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Fuentes de confianza
          </Label>
          <Textarea
            id="preferred_source_domains"
            placeholder={getPreferredSourcesPlaceholder(watchedSector)}
            {...register("preferred_source_domains")}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Opcional. Añade dominios que quieras priorizar como enlaces externos, separados por comas.
          </p>
        </div>

        <div className="space-y-3">
          <Label>Longitud preferida</Label>
          <RadioGroup
            value={watchedLength}
            onValueChange={(v) => setValue("preferred_length", v, { shouldDirty: true })}
            className="grid gap-2"
          >
            {LENGTH_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem
                  value={option.value}
                  id={`length-${option.value}`}
                  className="mt-1"
                  disabled={!isLengthAllowed(option.value)}
                />
                <div className="grid gap-0.5">
                  <Label
                    htmlFor={`length-${option.value}`}
                    className={`font-normal ${isLengthAllowed(option.value) ? "cursor-pointer" : "cursor-not-allowed text-muted-foreground"}`}
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                  {!isLengthAllowed(option.value) && (
                    <p className="text-xs text-amber-600">Disponible en un plan superior</p>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
          {plan === "free" && (
            <p className="text-xs text-amber-600">
              Free permite hasta 800 palabras. Si quieres más longitud, te ayudamos a ampliar el plan desde Facturación.
            </p>
          )}
          {plan === "starter" && (
            <p className="text-xs text-amber-600">
              Starter permite hasta 1.500 palabras. Para 2.500 palabras necesitas Pro o Agency.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
