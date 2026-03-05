import { useState, useRef, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Globe, Link2, AlertTriangle, XCircle, Loader2, WandSparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OnboardingNavButtons } from "../OnboardingNavButtons";
import type { OnboardingStepData } from "@/hooks/useOnboarding";
import type { ExtractedSiteProfile, ExtractionStatus } from "@/hooks/useColorPalette";
import {
  BUSINESS_TYPES,
  getDefaultBusinessType,
  getDescriptionExample,
  getStructuredDescriptionPlaceholder,
} from "@/lib/site-profile";

const SECTORS = [
  { value: "farmacia", label: "Farmacia", icon: "💊" },
  { value: "clinica_dental", label: "Clínica dental", icon: "🦷" },
  { value: "restaurante", label: "Restaurante", icon: "🍽️" },
  { value: "peluqueria", label: "Peluquería", icon: "💇" },
  { value: "veterinaria", label: "Clínica veterinaria", icon: "🐾" },
  { value: "ecommerce", label: "Tienda online", icon: "🛒" },
  { value: "marketing", label: "Agencia de marketing", icon: "📈" },
  { value: "gimnasio", label: "Gimnasio / Centro deportivo", icon: "💪" },
  { value: "asesoria", label: "Asesoría / Gestoría", icon: "📋" },
  { value: "inmobiliaria", label: "Inmobiliaria", icon: "🏠" },
  { value: "otro", label: "Otro", icon: "🏢" },
];

const SCOPES = [
  { value: "local", label: "A clientes de mi zona", icon: "📍" },
  { value: "national", label: "A clientes de toda España", icon: "🇪🇸" },
  { value: "international", label: "A clientes internacionales", icon: "🌍" },
];

const KNOWN_SECTOR_VALUES = new Set(SECTORS.map((item) => item.value));

type UrlStatus = "empty" | "valid" | "missing_protocol" | "http_only" | "invalid";

function analyzeUrl(raw: string): { status: UrlStatus; suggestions?: string[] } {
  const trimmed = raw.trim();
  if (!trimmed) return { status: "empty" };

  if (/^https:\/\/.*?\..+/.test(trimmed)) return { status: "valid" };
  if (/^http:\/\/.*?\..+/.test(trimmed)) return { status: "http_only" };

  if (/^(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/.test(trimmed)) {
    const withoutWww = trimmed.replace(/^www\./, "");
    const withWww = trimmed.startsWith("www.") ? trimmed : `www.${trimmed}`;
    return {
      status: "missing_protocol",
      suggestions: [`https://${withoutWww}`, `https://${withWww}`],
    };
  }

  if (trimmed.includes(".")) return { status: "invalid" };

  return { status: "invalid" };
}

interface BusinessStepProps {
  onNext: () => void;
  saveStepData: (key: string, data: object) => void;
  createProgress: (siteId: string) => Promise<unknown>;
  initialData?: OnboardingStepData["step1"];
  extractionStatus: ExtractionStatus;
  extractedProfile: ExtractedSiteProfile | null;
  triggerExtraction: (url: string, siteId?: string) => Promise<ExtractedSiteProfile | null>;
  resetExtraction: () => void;
}

export function BusinessStep({
  onNext,
  saveStepData,
  createProgress,
  initialData,
  extractionStatus,
  extractedProfile,
  triggerExtraction,
  resetExtraction,
}: BusinessStepProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url ?? "");
  const [businessName, setBusinessName] = useState(initialData?.business_name ?? "");
  const [businessType, setBusinessType] = useState(
    initialData?.business_type ?? getDefaultBusinessType(initialData?.sector),
  );
  const [sector, setSector] = useState(initialData?.sector ?? "");
  const [customSector, setCustomSector] = useState("");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [scope, setScope] = useState(initialData?.scope ?? "local");
  const [businessDescription, setBusinessDescription] = useState(initialData?.business_description ?? "");
  const [detectedBlogUrl, setDetectedBlogUrl] = useState(initialData?.detected_blog_url ?? "");
  const [detectedSocialUrl, setDetectedSocialUrl] = useState(initialData?.detected_social_url ?? "");
  const [detectedLanguages, setDetectedLanguages] = useState<string[]>(initialData?.detected_languages ?? []);
  const [detectedColors, setDetectedColors] = useState<string[]>(initialData?.detected_colors ?? []);
  const [toneSuggestion, setToneSuggestion] = useState(initialData?.tone_suggestion ?? "");
  const [audienceSuggestion, setAudienceSuggestion] = useState(initialData?.audience_suggestion ?? "");
  const [contentGoalSuggestion, setContentGoalSuggestion] = useState(initialData?.content_goal_suggestion ?? "");
  const [editorialFocusSuggestion, setEditorialFocusSuggestion] = useState(
    initialData?.editorial_focus_suggestion ?? "",
  );
  const [keywordsSuggestion, setKeywordsSuggestion] = useState(initialData?.keywords_suggestion ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingDetection, setIsApplyingDetection] = useState(false);
  const submittingRef = useRef(false);
  const lastAppliedUrlRef = useRef<string | null>(null);

  const finalSector = sector === "otro" ? customSector.trim() : sector;
  const descriptionPlaceholder = useMemo(() => getStructuredDescriptionPlaceholder(finalSector), [finalSector]);
  const descriptionExample = useMemo(() => getDescriptionExample(finalSector), [finalSector]);
  const urlAnalysis = useMemo(() => analyzeUrl(websiteUrl), [websiteUrl]);

  const detectedInfoExists = Boolean(
    detectedBlogUrl ||
    detectedSocialUrl ||
    detectedLanguages.length > 0 ||
    detectedColors.length > 0 ||
    toneSuggestion ||
    audienceSuggestion ||
    contentGoalSuggestion ||
    editorialFocusSuggestion ||
    keywordsSuggestion,
  );

  useEffect(() => {
    if (!sector) return;
    if (!businessType || businessType === "other") {
      setBusinessType(getDefaultBusinessType(sector));
    }
  }, [sector, businessType]);

  useEffect(() => {
    if (!extractedProfile) return;
    const identityKey = `${websiteUrl.trim()}::${extractedProfile.source}::${extractedProfile.business_name || ""}`;
    if (lastAppliedUrlRef.current === identityKey) return;

    setIsApplyingDetection(true);
    setBusinessName((prev) => prev || extractedProfile.business_name || "");
    setBusinessType(
      (prev) => prev || extractedProfile.business_type || getDefaultBusinessType(extractedProfile.sector),
    );
    const extractedSector = extractedProfile.sector || "";
    if (!sector && extractedSector) {
      if (KNOWN_SECTOR_VALUES.has(extractedSector)) {
        setSector(extractedSector);
      } else {
        setSector("otro");
        setCustomSector((prev) => prev || extractedSector);
      }
    }
    setLocation((prev) => prev || extractedProfile.location || "");
    setBusinessDescription((prev) => prev || extractedProfile.description || "");
    setDetectedBlogUrl(extractedProfile.blog_url || "");
    setDetectedSocialUrl(extractedProfile.social_link || "");
    setDetectedLanguages(extractedProfile.languages || []);
    setDetectedColors(extractedProfile.colors || []);
    setToneSuggestion(extractedProfile.tone_suggestion || "");
    setAudienceSuggestion(extractedProfile.audience_suggestion || "");
    setContentGoalSuggestion(extractedProfile.content_goal_suggestion || "");
    setEditorialFocusSuggestion(extractedProfile.editorial_focus_suggestion || "");
    setKeywordsSuggestion(extractedProfile.keywords || "");
    lastAppliedUrlRef.current = identityKey;
    setIsApplyingDetection(false);
  }, [extractedProfile, sector, websiteUrl]);

  const canAnalyze =
    websiteUrl.trim().length > 0 && urlAnalysis.status !== "invalid" && extractionStatus !== "extracting";
  const canProceed =
    businessName.trim().length > 0 &&
    businessType.length > 0 &&
    finalSector.length > 0 &&
    location.trim().length > 0 &&
    scope.length > 0 &&
    websiteUrl.trim().length > 0;

  const applySuggestion = (suggestion: string) => {
    setWebsiteUrl(suggestion);
  };

  const normalizeFinalUrl = () => {
    let finalUrl = websiteUrl.trim();
    if (urlAnalysis.status === "missing_protocol") {
      finalUrl = `https://${finalUrl.replace(/^www\./, "")}`;
      setWebsiteUrl(finalUrl);
    }
    return finalUrl;
  };

  const handleAnalyzeWebsite = async () => {
    const finalUrl = normalizeFinalUrl();
    if (!finalUrl) return;

    const profile = await triggerExtraction(finalUrl);
    if (profile) {
      toast.success("Hemos detectado información de tu web. Revísala y ajusta lo que haga falta.");
    } else {
      toast.error("No hemos podido analizar la web. Puedes completar los datos manualmente.");
    }
  };

  const handleNext = async () => {
    if (!canProceed || !user?.id || submittingRef.current) return;

    const finalUrl = normalizeFinalUrl();
    submittingRef.current = true;
    setIsSaving(true);

    try {
      const primaryBlogUrl = detectedBlogUrl || finalUrl;
      const normalizedUrl = primaryBlogUrl
        .toLowerCase()
        .replace(/\/+$/, "")
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "");

      const { data: existingSites } = await supabase.from("sites").select("id, name, blog_url").eq("user_id", user.id);

      const duplicate = existingSites?.find((s) => {
        if (!s.blog_url) return false;
        const existing = s.blog_url
          .toLowerCase()
          .replace(/\/+$/, "")
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "");
        return existing === normalizedUrl;
      });

      if (duplicate) {
        toast.error(`Ya tienes un sitio con esta URL: "${duplicate.name}". Ve al dashboard para gestionarlo.`);
        setIsSaving(false);
        submittingRef.current = false;
        return;
      }

      const { data: site, error: siteError } = await supabase
        .from("sites")
        .insert({
          user_id: user.id,
          name: businessName.trim(),
          business_type: businessType,
          sector: finalSector,
          description: businessDescription.trim() || null,
          location: location.trim(),
          geographic_scope: scope,
          blog_url: primaryBlogUrl || null,
          instagram_url: detectedSocialUrl || null,
          languages: detectedLanguages.length > 0 ? detectedLanguages : ["spanish"],
          color_palette: detectedColors.length > 0 ? detectedColors.join(",") : null,
        })
        .select()
        .single();

      if (siteError) throw siteError;

      await createProgress(site.id);

      await saveStepData("step1", {
        business_name: businessName.trim(),
        business_type: businessType,
        sector: finalSector,
        location: location.trim(),
        scope,
        website_url: finalUrl || "",
        business_description: businessDescription.trim(),
        detected_blog_url: detectedBlogUrl || "",
        detected_social_url: detectedSocialUrl || "",
        detected_languages: detectedLanguages,
        detected_colors: detectedColors,
        tone_suggestion: toneSuggestion,
        audience_suggestion: audienceSuggestion,
        content_goal_suggestion: contentGoalSuggestion,
        editorial_focus_suggestion: editorialFocusSuggestion,
        keywords_suggestion: keywordsSuggestion,
        extracted_from_website: Boolean(extractedProfile),
      });

      await queryClient.refetchQueries({ queryKey: ["sites", user.id] });
      onNext();
    } catch (err) {
      console.error("Error in BusinessStep:", err);
      toast.error("Error al guardar los datos. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Conecta tu web y empezamos por ti
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Analizamos tu web para proponerte una base de configuración. Después solo revisas, ajustas y generas tu primer
          post.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="website-url" className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="w-4 h-4 text-primary" />
            URL de tu web o blog <span className="text-destructive">*</span>
          </Label>
          <Input
            id="website-url"
            placeholder="https://tusitio.com"
            value={websiteUrl}
            onChange={(e) => {
              if (extractionStatus !== "idle") resetExtraction();
              setWebsiteUrl(e.target.value);
            }}
            className="h-12 sm:h-11 text-base rounded-lg"
            autoFocus
            autoComplete="off"
            data-1p-ignore
          />
        </div>

        {urlAnalysis.status === "missing_protocol" && (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <div className="flex items-start gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span>Falta `https://`. Puedes usar una de estas opciones:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {urlAnalysis.suggestions?.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="rounded-md border bg-white px-2 py-1 text-xs hover:bg-muted"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {urlAnalysis.status === "invalid" && (
          <div className="flex items-start gap-2 text-destructive text-sm">
            <XCircle className="w-4 h-4 mt-0.5" />
            <span>La URL no parece válida. Revísala antes de continuar.</span>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Detectamos nombre, sector, ubicación, blog, redes, idiomas y colores para rellenar lo posible por ti.
          </p>
          <Button type="button" onClick={handleAnalyzeWebsite} disabled={!canAnalyze} className="gap-2 self-start">
            {extractionStatus === "extracting" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <WandSparkles className="w-4 h-4" />
            )}
            {extractionStatus === "extracting" ? "Analizando web..." : "Analizar mi web"}
          </Button>
        </div>
      </div>

      {(extractedProfile || initialData?.extracted_from_website || isApplyingDetection) && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Hemos detectado esta información a partir de tu web. Revísala y modifícala si algo no encaja del todo con tu
          negocio.
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="business-name" className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="w-4 h-4 text-primary" />
          Nombre de tu negocio <span className="text-destructive">*</span>
        </Label>
        <Input
          id="business-name"
          placeholder="Ej: Farmacia López"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="h-12 sm:h-11 text-base rounded-lg"
          maxLength={100}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <span className="text-lg">🧩</span>
            Tipo de negocio <span className="text-destructive">*</span>
          </Label>
          <Select value={businessType} onValueChange={setBusinessType}>
            <SelectTrigger className="h-12 sm:h-11 text-base rounded-lg">
              <SelectValue placeholder="Selecciona el tipo de negocio..." />
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

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <span className="text-lg">🏷️</span>
            Sector <span className="text-destructive">*</span>
          </Label>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="h-12 sm:h-11 text-base rounded-lg">
              <SelectValue placeholder="Selecciona tu sector..." />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="mr-2">{s.icon}</span>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {sector === "otro" && (
        <div className="space-y-1.5">
          <Label htmlFor="custom-sector" className="text-sm font-medium">
            Especifica tu sector
          </Label>
          <Input
            id="custom-sector"
            placeholder="Ej: Clínica estética"
            value={customSector}
            onChange={(e) => setCustomSector(e.target.value)}
            className="h-12 sm:h-11 text-base rounded-lg"
            maxLength={80}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="business-description" className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="w-4 h-4 text-primary" />
          Describe tu negocio
        </Label>
        <Textarea
          id="business-description"
          placeholder={descriptionPlaceholder}
          value={businessDescription}
          onChange={(e) => setBusinessDescription(e.target.value)}
          className="min-h-[120px] rounded-lg text-base"
          maxLength={600}
        />
        <p className="text-[13px] text-muted-foreground">Describe tu negocio en 2-4 líneas.</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Ejemplo:</span> {descriptionExample}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            Ubicación principal <span className="text-destructive">*</span>
          </Label>
          <Input
            id="location"
            placeholder="Ej: Barcelona"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-12 sm:h-11 text-base rounded-lg"
            maxLength={80}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Globe className="w-4 h-4 text-primary" />
            Alcance <span className="text-destructive">*</span>
          </Label>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-12 sm:h-11 text-base rounded-lg">
              <SelectValue placeholder="Selecciona el alcance..." />
            </SelectTrigger>
            <SelectContent>
              {SCOPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="mr-2">{s.icon}</span>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {detectedInfoExists && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Lo que hemos detectado</p>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {detectedBlogUrl && (
              <p>
                <span className="font-medium text-foreground">Blog:</span> {detectedBlogUrl}
              </p>
            )}
            {detectedSocialUrl && (
              <p>
                <span className="font-medium text-foreground">Red social:</span> {detectedSocialUrl}
              </p>
            )}
            {detectedLanguages.length > 0 && (
              <p>
                <span className="font-medium text-foreground">Idiomas:</span> {detectedLanguages.join(", ")}
              </p>
            )}
            {detectedColors.length > 0 && (
              <p>
                <span className="font-medium text-foreground">Colores:</span> {detectedColors.join(", ")}
              </p>
            )}
            {toneSuggestion && (
              <p>
                <span className="font-medium text-foreground">Tono sugerido:</span> {toneSuggestion}
              </p>
            )}
            {audienceSuggestion && (
              <p>
                <span className="font-medium text-foreground">Audiencia sugerida:</span> {audienceSuggestion}
              </p>
            )}
            {contentGoalSuggestion && (
              <p>
                <span className="font-medium text-foreground">Objetivo sugerido:</span> {contentGoalSuggestion}
              </p>
            )}
            {editorialFocusSuggestion && (
              <p>
                <span className="font-medium text-foreground">Enfoque sugerido:</span> {editorialFocusSuggestion}
              </p>
            )}
            {keywordsSuggestion && (
              <p>
                <span className="font-medium text-foreground">Keywords detectadas:</span> {keywordsSuggestion}
              </p>
            )}
          </div>
        </div>
      )}

      <OnboardingNavButtons
        onNext={handleNext}
        nextDisabled={!canProceed || urlAnalysis.status === "invalid"}
        isSaving={isSaving}
      />
    </div>
  );
}
