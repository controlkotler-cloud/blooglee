import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, Languages, Image, Ban, BookOpen, Link2, ChevronDown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { OnboardingNavButtons } from "../OnboardingNavButtons";
import { PolylangSetupGuide } from "@/components/saas/PolylangSetupGuide";
import type { OnboardingStepData } from "@/hooks/useOnboarding";
import {
  getAngleToAvoidPlaceholder,
  getAvoidTopicsPlaceholder,
  getPreferredSourcesPlaceholder,
  getPriorityTopicsPlaceholder,
} from "@/lib/site-profile";

interface ContentPrefsStepProps {
  onNext: () => void;
  onBack: () => void;
  saveStepData: (key: string, data: object) => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

export function ContentPrefsStep({ onNext, onBack, saveStepData, stepData, siteId }: ContentPrefsStepProps) {
  const sector = stepData?.step1?.sector ?? "";
  const websiteUrl = (stepData?.step1?.website_url as string) ?? "";
  const savedPrefs = stepData?.step_content_prefs as Record<string, unknown> | undefined;

  const [catalan, setCatalan] = useState<boolean>((savedPrefs?.catalan as boolean) ?? false);
  const [includeFeaturedImage, setIncludeFeaturedImage] = useState<boolean>(
    (savedPrefs?.include_featured_image as boolean) ?? true,
  );
  const [instagramUrl, setInstagramUrl] = useState<string>((savedPrefs?.instagram_url as string) ?? "");
  const [avoidTopics, setAvoidTopics] = useState<string>((savedPrefs?.avoid_topics as string) ?? "");
  const [priorityTopics, setPriorityTopics] = useState<string>((savedPrefs?.priority_topics as string) ?? "");
  const [angleToAvoid, setAngleToAvoid] = useState<string>((savedPrefs?.angle_to_avoid as string) ?? "");
  const [preferredSourceDomains, setPreferredSourceDomains] = useState<string>(
    (savedPrefs?.preferred_source_domains as string) ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [polylangGuideOpen, setPolylangGuideOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(priorityTopics.trim() || angleToAvoid.trim() || preferredSourceDomains.trim()),
  );

  const siteOrigin = websiteUrl
    ? (() => {
        try {
          return new URL(websiteUrl).origin;
        } catch {
          return undefined;
        }
      })()
    : undefined;

  const avoidPlaceholder = getAvoidTopicsPlaceholder(sector);
  const priorityTopicsPlaceholder = getPriorityTopicsPlaceholder(sector);
  const angleToAvoidPlaceholder = getAngleToAvoidPlaceholder(sector);
  const preferredSourcesPlaceholder = getPreferredSourcesPlaceholder(sector);

  const handleNext = async () => {
    setIsSaving(true);
    try {
      const languages = catalan ? ["spanish", "catalan"] : ["spanish"];
      const avoidArray = avoidTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const priorityArray = priorityTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const sourceDomainsArray = preferredSourceDomains
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await saveStepData("step_content_prefs", {
        catalan,
        include_featured_image: includeFeaturedImage,
        instagram_url: instagramUrl,
        avoid_topics: avoidTopics,
        priority_topics: priorityTopics,
        angle_to_avoid: angleToAvoid,
        preferred_source_domains: preferredSourceDomains,
      });

      track("onboarding_content_prefs", {
        catalan,
        include_featured_image: includeFeaturedImage,
        avoid_topics_count: avoidArray.length,
        priority_topics_count: priorityArray.length,
        has_social_url: Boolean(instagramUrl.trim()),
      });

      if (siteId) {
        await supabase
          .from("sites")
          .update({
            languages,
            include_featured_image: includeFeaturedImage,
            instagram_url: instagramUrl.trim() || null,
            avoid_topics: avoidArray,
            priority_topics: priorityArray,
            angle_to_avoid: angleToAvoid.trim() || null,
            preferred_source_domains: sourceDomainsArray,
          })
          .eq("id", siteId);
      }

      onNext();
    } catch (err) {
      console.error("Error in ContentPrefsStep:", err);
      toast.error("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Ajusta la calidad del contenido
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Cierra idioma, imagen y limites editoriales para que el primer post salga limpio y alineado con tu marca.
        </p>
      </div>

      <div className="space-y-3 p-3 sm:p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Idiomas del blog</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          El español está siempre incluido. Activa catalán si también quieres publicar en ese idioma.
        </p>
        <div className="flex items-center gap-2">
          <Checkbox id="catalan" checked={catalan} onCheckedChange={(checked) => setCatalan(checked === true)} />
          <label htmlFor="catalan" className="text-sm cursor-pointer">
            Generar también en catalán
          </label>
        </div>
        {catalan && (
          <>
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <p>
                  Para publicar en dos idiomas necesitas configurar <strong>Polylang</strong> en WordPress y habilitar
                  el soporte API.
                </p>
                <button
                  type="button"
                  onClick={() => setPolylangGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 underline font-semibold text-amber-900 dark:text-amber-200 hover:text-amber-700 dark:hover:text-amber-100"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Ver guía de configuración paso a paso
                </button>
              </AlertDescription>
            </Alert>
            <PolylangSetupGuide
              open={polylangGuideOpen}
              onOpenChange={setPolylangGuideOpen}
              siteUrl={siteOrigin}
              onVerify={() => {}}
              isVerifying={false}
              verifyResult={null}
              verifyMessage=""
              hideVerifyButton
            />
          </>
        )}
      </div>

      <div className="space-y-3 p-3 sm:p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Imagen destacada</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          La imagen destacada mejora la presentación del post y cómo se comparte en WordPress y redes.
        </p>
        <div className="flex items-center justify-between">
          <label htmlFor="featured-image" className="text-sm cursor-pointer">
            Incluir imagen destacada generada por IA
          </label>
          <Switch id="featured-image" checked={includeFeaturedImage} onCheckedChange={setIncludeFeaturedImage} />
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <Label htmlFor="instagram_url" className="text-sm font-semibold">
            Red social principal
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Si la indicas, Blooglee podrá cerrar mejor los artículos con una llamada a seguir conectado contigo.
        </p>
        <Input
          id="instagram_url"
          type="url"
          placeholder="Ejemplo: https://instagram.com/tumarca"
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          className="h-12 sm:h-11 text-base rounded-lg"
        />
      </div>

      <div className="space-y-3 p-3 sm:p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2">
          <Ban className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Temas a evitar</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Indica temas o expresiones que no quieres ver para evitar publicaciones que choquen con tu posicionamiento.
        </p>
        <Textarea
          rows={2}
          placeholder={avoidPlaceholder}
          value={avoidTopics}
          onChange={(e) => setAvoidTopics(e.target.value)}
          className="text-base sm:text-sm resize-none rounded-lg min-h-[48px]"
          maxLength={500}
        />
        <p className="text-[13px] text-muted-foreground">Opcional · separados por comas</p>
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="rounded-xl border bg-card p-3 sm:p-4">
        <CollapsibleTrigger asChild>
          <button type="button" className="w-full flex items-center justify-between text-left">
            <div>
              <p className="text-sm font-semibold">Ajustes avanzados de calidad</p>
              <p className="text-xs text-muted-foreground">
                Prioridades editoriales, enfoque a evitar y fuentes externas de referencia.
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">Temas prioritarios</Label>
            </div>
            <Textarea
              rows={2}
              placeholder={priorityTopicsPlaceholder}
              value={priorityTopics}
              onChange={(e) => setPriorityTopics(e.target.value)}
              className="text-base sm:text-sm resize-none rounded-lg min-h-[48px]"
              maxLength={500}
            />
            <p className="text-[13px] text-muted-foreground">Opcional · separados por comas</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">Enfoque a evitar</Label>
            </div>
            <Textarea
              rows={3}
              placeholder={angleToAvoidPlaceholder}
              value={angleToAvoid}
              onChange={(e) => setAngleToAvoid(e.target.value)}
              className="text-base sm:text-sm resize-none rounded-lg min-h-[48px]"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">Fuentes de confianza</Label>
            </div>
            <Textarea
              rows={2}
              placeholder={preferredSourcesPlaceholder}
              value={preferredSourceDomains}
              onChange={(e) => setPreferredSourceDomains(e.target.value)}
              className="text-base sm:text-sm resize-none rounded-lg min-h-[48px]"
              maxLength={400}
            />
            <p className="text-[13px] text-muted-foreground">Opcional · separados por comas</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <OnboardingNavButtons onNext={handleNext} onBack={onBack} isSaving={isSaving} />
    </div>
  );
}
