import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Save, Trash2, Clock, Calendar } from "lucide-react";
import { ContentProfileCard } from "./ContentProfileCard";
import { PaletteSelector } from "./PaletteSelector";
import { useUpdateSite, useDeleteSite, type Site } from "@/hooks/useSites";
import { useProfile } from "@/hooks/useProfile";
import {
  BUSINESS_TYPES,
  getAngleToAvoidPlaceholder,
  getAudiencePlaceholder,
  getAvoidTopicsPlaceholder,
  getBusinessTypeWarning,
  getContentGoalPlaceholder,
  getDefaultBusinessType,
  getPreferredSourcesPlaceholder,
  getPriorityTopicsPlaceholder,
  getSeasonalWarning,
  getStructuredDescriptionPlaceholder,
} from "@/lib/site-profile";

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const WEEKS_OF_MONTH = [
  { value: 1, label: "1ª semana" },
  { value: 2, label: "2ª semana" },
  { value: 3, label: "3ª semana" },
  { value: 4, label: "4ª semana" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

// Get user's timezone offset in hours
function getUserTimezoneOffset(): number {
  return -new Date().getTimezoneOffset() / 60;
}

// Convert local hour to UTC
function localToUtc(localHour: number): number {
  const offset = getUserTimezoneOffset();
  let utc = localHour - offset;
  if (utc < 0) utc += 24;
  if (utc >= 24) utc -= 24;
  return Math.floor(utc);
}

// Convert UTC hour to local
function utcToLocal(utcHour: number): number {
  const offset = getUserTimezoneOffset();
  let local = utcHour + offset;
  if (local < 0) local += 24;
  if (local >= 24) local -= 24;
  return Math.floor(local);
}

const MOOD_OPTIONS = [
  { value: "warm_and_welcoming", label: "Cercano y cálido", icon: "🌅" },
  { value: "clean_and_clinical", label: "Profesional y limpio", icon: "🏢" },
  { value: "energetic", label: "Dinámico y activo", icon: "⚡" },
  { value: "calm_and_trustworthy", label: "Natural y tranquilo", icon: "🌿" },
];

const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  sector: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  geographic_scope: z.enum(["local", "regional", "national", "international"]),
  business_type: z.string().optional(),
  content_goal: z.string().optional(),
  priority_topics: z.string().optional(),
  angle_to_avoid: z.string().optional(),
  preferred_source_domains: z.string().optional(),
  languages: z.array(z.string()).min(1, "Selecciona al menos un idioma"),
  publish_frequency: z.string(),
  publish_day_of_week: z.number().nullable(),
  publish_day_of_month: z.number().nullable(),
  publish_week_of_month: z.number().nullable(),
  publish_hour_local: z.number(),
  monthly_mode: z.enum(["fixed_day", "weekday"]),
  custom_topic: z.string().optional(),
  auto_generate: z.boolean(),
  include_featured_image: z.boolean(),
  blog_url: z.string().url().optional().or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
  // Content profile fields
  tone: z.string(),
  target_audience: z.string().optional(),
  content_pillars: z.array(z.string()).min(1),
  avoid_topics: z.string().optional(),
  preferred_length: z.enum(["short", "medium", "long"]),
  // Image style fields
  color_palette: z.string(),
  mood: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface SiteSettingsProps {
  site: Site;
}

export function SiteSettings({ site }: SiteSettingsProps) {
  const navigate = useNavigate();
  const updateMutation = useUpdateSite();
  const deleteMutation = useDeleteSite();
  const { data: profile } = useProfile();
  const userPlan = profile?.plan ?? "free";
  const canUseAutoGenerate = userPlan !== "free";
  const canUseDailyFrequency = userPlan === "pro" || userPlan === "agency";
  const maxPreferredLength = userPlan === "free" ? "short" : userPlan === "starter" ? "medium" : "long";

  const clampPreferredLengthByPlan = (value: string): "short" | "medium" | "long" => {
    const normalized = value === "short" || value === "medium" || value === "long" ? value : "medium";
    if (maxPreferredLength === "short") return "short";
    if (maxPreferredLength === "medium") return normalized === "long" ? "medium" : normalized;
    return normalized;
  };

  // Determine initial monthly mode
  const initialMonthlyMode = site.publish_day_of_month ? "fixed_day" : "weekday";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: site.name,
      sector: site.sector || "",
      description: site.description || "",
      location: site.location || "",
      geographic_scope: site.geographic_scope,
      business_type: site.business_type || getDefaultBusinessType(site.sector),
      content_goal: site.content_goal || "",
      priority_topics: (site.priority_topics || []).join(", "),
      angle_to_avoid: site.angle_to_avoid || "",
      preferred_source_domains: (site.preferred_source_domains || []).join(", "),
      languages: site.languages,
      publish_frequency: site.publish_frequency,
      publish_day_of_week: site.publish_day_of_week,
      publish_day_of_month: site.publish_day_of_month,
      publish_week_of_month: site.publish_week_of_month,
      publish_hour_local: utcToLocal(site.publish_hour_utc ?? 9),
      monthly_mode: initialMonthlyMode,
      custom_topic: site.custom_topic || "",
      auto_generate: site.auto_generate,
      include_featured_image: site.include_featured_image,
      blog_url: site.blog_url || "",
      instagram_url: site.instagram_url || "",
      // Content profile fields
      tone: site.tone || "casual",
      target_audience: site.target_audience || "",
      content_pillars: site.content_pillars || ["educational", "trends", "seasonal"],
      avoid_topics: (site.avoid_topics || []).join(", "),
      preferred_length: clampPreferredLengthByPlan(site.preferred_length || "medium"),
      color_palette: site.color_palette || "",
      mood: site.mood || "warm_and_welcoming",
    },
  });

  const watchedLanguages = watch("languages");
  const watchedAutoGenerate = watch("auto_generate");
  const watchedIncludeImage = watch("include_featured_image");
  const watchedSector = watch("sector");
  const watchedBusinessType = watch("business_type");
  const watchedAudience = watch("target_audience");
  const watchedPillars = watch("content_pillars");
  const audienceWarning = getBusinessTypeWarning(watchedBusinessType, watchedAudience);
  const seasonalWarning = getSeasonalWarning(watchedBusinessType, watchedPillars);
  const watchedFrequency = watch("publish_frequency");
  const watchedMonthlyMode = watch("monthly_mode");
  const watchedHourLocal = watch("publish_hour_local");
  const watchedPreferredLength = watch("preferred_length");

  useEffect(() => {
    if (!canUseAutoGenerate && watchedAutoGenerate) {
      setValue("auto_generate", false, { shouldDirty: true });
    }
  }, [canUseAutoGenerate, watchedAutoGenerate, setValue]);

  useEffect(() => {
    if (!canUseDailyFrequency && (watchedFrequency === "daily" || watchedFrequency === "daily_weekdays")) {
      setValue("publish_frequency", "weekly", { shouldDirty: true });
    }
  }, [canUseDailyFrequency, watchedFrequency, setValue]);

  useEffect(() => {
    if (!watchedPreferredLength) return;
    const clamped = clampPreferredLengthByPlan(watchedPreferredLength);
    if (clamped !== watchedPreferredLength) {
      setValue("preferred_length", clamped, { shouldDirty: false });
    }
  }, [userPlan, watchedPreferredLength, setValue]);

  // Get user's timezone name for display
  const timezoneName = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  const onSubmit = (data: FormData) => {
    const effectiveAutoGenerate = canUseAutoGenerate ? data.auto_generate : false;
    const effectiveFrequency =
      !canUseDailyFrequency && (data.publish_frequency === "daily" || data.publish_frequency === "daily_weekdays")
        ? "weekly"
        : data.publish_frequency;
    const effectivePreferredLength = clampPreferredLengthByPlan(data.preferred_length);

    // Convert local hour to UTC
    const publishHourUtc = localToUtc(data.publish_hour_local);

    // Prepare scheduling fields based on frequency
    let publishDayOfWeek: number | null = null;
    let publishDayOfMonth: number | null = null;
    let publishWeekOfMonth: number | null = null;

    if (effectiveFrequency === "weekly" || effectiveFrequency === "biweekly") {
      publishDayOfWeek = data.publish_day_of_week ?? 1;
    } else if (effectiveFrequency === "monthly") {
      if (data.monthly_mode === "fixed_day") {
        publishDayOfMonth = data.publish_day_of_month ?? 1;
        publishDayOfWeek = null;
        publishWeekOfMonth = null;
      } else {
        publishDayOfWeek = data.publish_day_of_week ?? 1;
        publishWeekOfMonth = data.publish_week_of_month ?? 1;
        publishDayOfMonth = null;
      }
    }

    // Parse avoid_topics from comma-separated string to array
    const avoidTopicsArray = data.avoid_topics
      ? data.avoid_topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const priorityTopicsArray = data.priority_topics
      ? data.priority_topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const preferredSourceDomainsArray = data.preferred_source_domains
      ? data.preferred_source_domains
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    updateMutation.mutate({
      id: site.id,
      name: data.name,
      sector: data.sector || null,
      description: data.description || null,
      location: data.location || null,
      geographic_scope: data.geographic_scope,
      business_type: data.business_type || null,
      content_goal: data.content_goal || null,
      priority_topics: priorityTopicsArray,
      angle_to_avoid: data.angle_to_avoid || null,
      preferred_source_domains: preferredSourceDomainsArray,
      languages: data.languages,
      publish_frequency: effectiveFrequency,
      publish_day_of_week: publishDayOfWeek,
      publish_day_of_month: publishDayOfMonth,
      publish_week_of_month: publishWeekOfMonth,
      publish_hour_utc: publishHourUtc,
      custom_topic: data.custom_topic || null,
      auto_generate: effectiveAutoGenerate,
      include_featured_image: data.include_featured_image,
      blog_url: data.blog_url || null,
      instagram_url: data.instagram_url || null,
      // Content profile fields
      tone: data.tone || null,
      target_audience: data.target_audience || null,
      content_pillars: data.content_pillars,
      avoid_topics: avoidTopicsArray,
      preferred_length: effectivePreferredLength,
      // Image style fields
      color_palette: data.color_palette || null,
      mood: data.mood || null,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(site.id, {
      onSuccess: () => navigate("/dashboard"),
    });
  };

  const toggleLanguage = (lang: string) => {
    const current = watchedLanguages || [];
    if (current.includes(lang)) {
      if (current.length > 1) {
        setValue(
          "languages",
          current.filter((l) => l !== lang),
          { shouldDirty: true },
        );
      }
    } else {
      setValue("languages", [...current, lang], { shouldDirty: true });
    }
  };

  // Determine which scheduling options to show
  const showDayOfWeek =
    watchedFrequency === "weekly" ||
    watchedFrequency === "biweekly" ||
    (watchedFrequency === "monthly" && watchedMonthlyMode === "weekday");
  const showMonthlyOptions = watchedFrequency === "monthly";
  const showWeekOfMonth = watchedFrequency === "monthly" && watchedMonthlyMode === "weekday";

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del sitio *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="business_type">Tipo de negocio</Label>
                <Select
                  value={watch("business_type")}
                  onValueChange={(v) => setValue("business_type", v, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de negocio" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input id="sector" placeholder="Ej: Tecnología, Salud, Moda..." {...register("sector")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción del negocio</Label>
              <Textarea
                id="description"
                placeholder={getStructuredDescriptionPlaceholder(watchedSector)}
                {...register("description")}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Escribe qué vendes, a quién, qué problema resuelves y qué te diferencia.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Alcance geográfico</Label>
              <Select
                value={watch("geographic_scope")}
                onValueChange={(v) => setValue("geographic_scope", v as any, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="national">Nacional</SelectItem>
                  <SelectItem value="international">Internacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración de contenido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Idiomas de contenido</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchedLanguages?.includes("spanish") ?? true}
                    onChange={() => toggleLanguage("spanish")}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Español</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchedLanguages?.includes("catalan") ?? false}
                    onChange={() => toggleLanguage("catalan")}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Català</span>
                </label>
              </div>
              {errors.languages && <p className="text-sm text-destructive">{errors.languages.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_topic">Temas y enfoque editorial</Label>
              <Textarea
                id="custom_topic"
                placeholder="Ejemplo: Prioriza contenidos sobre SEO local, captación, fidelización, campañas estacionales y diferenciación de marca, siempre con un enfoque práctico y orientado a negocio."
                {...register("custom_topic")}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Define sobre qué tipo de temas quieres que escriba el blog y desde qué enfoque general. No pongas un
                título concreto.
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Generación automática</Label>
                <p className="text-sm text-muted-foreground">Generar artículos automáticamente según la programación</p>
              </div>
              <Switch
                checked={watchedAutoGenerate}
                onCheckedChange={(checked) => setValue("auto_generate", checked, { shouldDirty: true })}
                disabled={!canUseAutoGenerate}
              />
            </div>
            {!canUseAutoGenerate && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                El plan Free no incluye publicación automática. Actualiza tu plan para activarla.
              </p>
            )}

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Imagen destacada</Label>
                <p className="text-sm text-muted-foreground">Incluir imagen destacada generada por IA</p>
              </div>
              <Switch
                checked={watchedIncludeImage}
                onCheckedChange={(checked) => setValue("include_featured_image", checked, { shouldDirty: true })}
              />
            </div>

            {watchedIncludeImage && (
              <div className="space-y-4 pt-2 border-t">
                <PaletteSelector
                  value={watch("color_palette")}
                  onChange={(v) => setValue("color_palette", v, { shouldDirty: true })}
                  mood={watch("mood")}
                />

                {/* Mood — visual select */}
                <div className="space-y-2">
                  <Label>Estilo visual de tus imágenes</Label>
                  <Select value={watch("mood")} onValueChange={(v) => setValue("mood", v, { shouldDirty: true })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduling settings - NEW CARD */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Programación de publicación
            </CardTitle>
            <CardDescription>Configura cuándo se generarán automáticamente los artículos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Frequency */}
            <div className="space-y-2">
              <Label>Frecuencia de publicación</Label>
              <Select
                value={watch("publish_frequency")}
                onValueChange={(v) => setValue("publish_frequency", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily" disabled={!canUseDailyFrequency}>
                    Diario (todos los días)
                  </SelectItem>
                  <SelectItem value="daily_weekdays" disabled={!canUseDailyFrequency}>
                    Diario (L-V)
                  </SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quincenal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
              {!canUseDailyFrequency && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  La frecuencia diaria está disponible desde el plan Pro.
                </p>
              )}
            </div>

            {/* Monthly mode selection */}
            {showMonthlyOptions && (
              <div className="space-y-3">
                <Label>Tipo de programación mensual</Label>
                <RadioGroup
                  value={watchedMonthlyMode}
                  onValueChange={(v) => setValue("monthly_mode", v as "fixed_day" | "weekday", { shouldDirty: true })}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed_day" id="fixed_day" />
                    <Label htmlFor="fixed_day" className="font-normal cursor-pointer">
                      Día fijo del mes (ej: día 15)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekday" id="weekday" />
                    <Label htmlFor="weekday" className="font-normal cursor-pointer">
                      Día de la semana específico (ej: 1er lunes)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Fixed day of month */}
            {showMonthlyOptions && watchedMonthlyMode === "fixed_day" && (
              <div className="space-y-2">
                <Label>Día del mes</Label>
                <Select
                  value={String(watch("publish_day_of_month") ?? 1)}
                  onValueChange={(v) => setValue("publish_day_of_month", parseInt(v), { shouldDirty: true })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        Día {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Recomendamos días 1-28 para evitar problemas con meses cortos
                </p>
              </div>
            )}

            {/* Day of week selector */}
            {showDayOfWeek && (
              <div className="space-y-2">
                <Label>Día de la semana</Label>
                <Select
                  value={String(watch("publish_day_of_week") ?? 1)}
                  onValueChange={(v) => setValue("publish_day_of_week", parseInt(v), { shouldDirty: true })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={String(day.value)}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Week of month selector */}
            {showWeekOfMonth && (
              <div className="space-y-2">
                <Label>Semana del mes</Label>
                <Select
                  value={String(watch("publish_week_of_month") ?? 1)}
                  onValueChange={(v) => setValue("publish_week_of_month", parseInt(v), { shouldDirty: true })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKS_OF_MONTH.map((week) => (
                      <SelectItem key={week.value} value={String(week.value)}>
                        {week.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Hour selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hora de publicación
              </Label>
              <div className="flex items-center gap-3">
                <Select
                  value={String(watchedHourLocal)}
                  onValueChange={(v) => setValue("publish_hour_local", parseInt(v), { shouldDirty: true })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour.value} value={String(hour.value)}>
                        {hour.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">({timezoneName})</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Se guardará como {localToUtc(watchedHourLocal).toString().padStart(2, "0")}:00 UTC
              </p>
            </div>
          </CardContent>
        </Card>

        {/* URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enlaces</CardTitle>
            <CardDescription>URLs para incluir en el contenido generado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blog_url">URL del blog</Label>
              <Input id="blog_url" type="url" placeholder="https://..." {...register("blog_url")} />
              <p className="text-xs text-muted-foreground">
                Usa la URL exacta que quieras enlazar al final de los artículos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">Enlace a tu mejor red social</Label>
              <Input
                id="instagram_url"
                type="url"
                placeholder="https://instagram.com/tusitio o tu red social preferida"
                {...register("instagram_url")}
              />
              <p className="text-xs text-muted-foreground">
                Blooglee usará esta URL como cierre social cuando el artículo incluya llamada a redes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Content Profile Card */}
        {(audienceWarning || seasonalWarning) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas de calidad</CardTitle>
              <CardDescription>Ajusta estos campos para que los artículos salgan mejor enfocados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {audienceWarning && <p className="text-sm text-amber-700 dark:text-amber-300">{audienceWarning}</p>}
              {seasonalWarning && <p className="text-sm text-amber-700 dark:text-amber-300">{seasonalWarning}</p>}
            </CardContent>
          </Card>
        )}
        <ContentProfileCard watch={watch} setValue={setValue} register={register} plan={userPlan} />

        {/* Save button */}
        <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar cambios
        </Button>
      </form>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Zona de peligro</CardTitle>
          <CardDescription>Acciones irreversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar sitio
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar "{site.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminarán todos los artículos y configuración asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar definitivamente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
