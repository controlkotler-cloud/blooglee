import { useState, useRef, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Globe, Link2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useColorPalette } from "@/hooks/useColorPalette";
import { OnboardingNavButtons } from "../OnboardingNavButtons";
import type { OnboardingStepData } from "@/hooks/useOnboarding";
import { BUSINESS_TYPES, getDefaultBusinessType, getStructuredDescriptionPlaceholder } from "@/lib/site-profile";

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
}

export function BusinessStep({ onNext, saveStepData, createProgress, initialData }: BusinessStepProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerExtraction } = useColorPalette();

  const [businessName, setBusinessName] = useState(initialData?.business_name ?? "");
  const [businessType, setBusinessType] = useState(
    initialData?.business_type ?? getDefaultBusinessType(initialData?.sector),
  );
  const [sector, setSector] = useState(initialData?.sector ?? "");
  const [customSector, setCustomSector] = useState("");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [scope, setScope] = useState(initialData?.scope ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url ?? "");
  const [businessDescription, setBusinessDescription] = useState(initialData?.business_description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const submittingRef = useRef(false);

  const finalSector = sector === "otro" ? customSector.trim() : sector;
  const descriptionPlaceholder = useMemo(() => getStructuredDescriptionPlaceholder(finalSector), [finalSector]);

  const urlAnalysis = useMemo(() => analyzeUrl(websiteUrl), [websiteUrl]);

  useEffect(() => {
    if (!sector) return;
    if (!businessType || businessType === "other") {
      setBusinessType(getDefaultBusinessType(sector));
    }
  }, [sector, businessType]);

  const isUrlAcceptable = urlAnalysis.status === "valid" || urlAnalysis.status === "http_only";

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

  const handleNext = async () => {
    if (!canProceed || !user?.id || submittingRef.current) return;

    let finalUrl = websiteUrl.trim();
    if (urlAnalysis.status === "missing_protocol") {
      finalUrl = `https://${finalUrl.replace(/^www\./, "")}`;
      setWebsiteUrl(finalUrl);
      toast.info("Hemos añadido https:// a tu URL. Verifica que es correcta.");
    }

    submittingRef.current = true;
    setIsSaving(true);

    try {
      if (finalUrl) {
        const normalizedUrl = finalUrl
          .toLowerCase()
          .replace(/\/+$/, "")
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "");
        const { data: existingSites } = await supabase
          .from("sites")
          .select("id, name, blog_url")
          .eq("user_id", user.id);

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
          blog_url: finalUrl || null,
        })
        .select()
        .single();

      if (siteError) throw siteError;

      await createProgress(site.id);

      const stepData = {
        business_name: businessName.trim(),
        business_type: businessType,
        sector: finalSector,
        location: location.trim(),
        scope,
        website_url: finalUrl || "",
        business_description: businessDescription.trim(),
      };
      await saveStepData("step1", stepData);

      if (finalUrl) {
        triggerExtraction(finalUrl, site.id);
      }

      await queryClient.refetchQueries({ queryKey: ["sites", user.id] });
      onNext();
    } catch (err: any) {
      console.error("Error in BusinessStep:", err);
      toast.error("Error al guardar los datos. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Cuéntanos sobre tu negocio
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Cuanto mejor definas tu negocio, mejor saldrán los temas, enlaces y enfoque de tus artículos.
        </p>
      </div>

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
          autoFocus
          autoComplete="off"
          data-1p-ignore
        />
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <span className="text-lg">🧩</span>
          ¿Qué tipo de negocio tienes? <span className="text-destructive">*</span>
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
        <p className="text-[13px] text-muted-foreground">
          Esto ayuda a Blooglee a elegir mejor el ángulo del contenido y las fuentes externas.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <span className="text-lg">🏷️</span>
          ¿A qué se dedica tu negocio? <span className="text-destructive">*</span>
        </Label>
        <Select value={sector} onValueChange={setSector}>
          <SelectTrigger className="h-12 sm:h-11 text-base rounded-lg">
            <SelectValue placeholder="Selecciona tu sector..." />
          </SelectTrigger>
          <SelectContent>
            {SECTORS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <span className="flex items-center gap-2">
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <p className="text-[13px] text-muted-foreground">
          Sé concreto: qué vendes, a quién, qué problema resuelves y qué te diferencia.
        </p>
      </div>

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
          ¿Dónde están tus clientes? <span className="text-destructive">*</span>
        </Label>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="h-12 sm:h-11 text-base rounded-lg">
            <SelectValue placeholder="Selecciona tu alcance..." />
          </SelectTrigger>
          <SelectContent>
            {SCOPES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <span className="flex items-center gap-2">
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="website-url" className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="w-4 h-4 text-primary" />
          URL de tu web o blog <span className="text-destructive">*</span>
        </Label>
        <Input
          id="website-url"
          placeholder="https://tusitio.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="h-12 sm:h-11 text-base rounded-lg"
          autoComplete="off"
          data-1p-ignore
        />

        {urlAnalysis.status === "valid" && (
          <div className="flex items-start gap-2 text-emerald-600 text-sm">
            <CheckCircle className="w-4 h-4 mt-0.5" />
            <span>La URL parece correcta.</span>
          </div>
        )}

        {urlAnalysis.status === "http_only" && (
          <div className="flex items-start gap-2 text-amber-600 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <span>La URL usa `http://`. Si tu web ya usa HTTPS, actualízala para evitar problemas.</span>
          </div>
        )}

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

        {!isUrlAcceptable &&
          websiteUrl.trim().length > 0 &&
          urlAnalysis.status !== "missing_protocol" &&
          urlAnalysis.status !== "invalid" && (
            <p className="text-xs text-muted-foreground">
              Introduce una URL completa para que Blooglee pueda conectar WordPress y analizar el estilo del blog.
            </p>
          )}
      </div>

      <OnboardingNavButtons
        onNext={handleNext}
        nextDisabled={!canProceed || urlAnalysis.status === "invalid"}
        isSaving={isSaving}
      />
    </div>
  );
}
