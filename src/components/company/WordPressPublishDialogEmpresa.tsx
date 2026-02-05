import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArticuloEmpresa, ArticleContent } from "@/hooks/useArticulosEmpresas";
import { usePublishToWordPressEmpresa, PublishResult } from "@/hooks/usePublishToWordPressEmpresa";
import { useWordPressSiteByEmpresa } from "@/hooks/useWordPressSitesEmpresas";
import { TaxonomySelector } from "@/components/shared/TaxonomySelector";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface WordPressPublishDialogEmpresaProps {
  open: boolean;
  onClose: () => void;
  article: ArticuloEmpresa;
  empresaId: string;
  companyName: string;
  hasWordPress: boolean;
}

type PublishStatus = "publish" | "draft" | "future";
type Language = "spanish" | "catalan";

interface MultiPublishResult {
  spanish?: PublishResult;
  catalan?: PublishResult;
}

export function WordPressPublishDialogEmpresa({
  open,
  onClose,
  article,
  empresaId,
  companyName,
  hasWordPress,
}: WordPressPublishDialogEmpresaProps) {
  const [status, setStatus] = useState<PublishStatus>("publish");
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(["spanish"]);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [publishResults, setPublishResults] = useState<MultiPublishResult | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingLanguage, setPublishingLanguage] = useState<Language | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const queryClient = useQueryClient();
  const publishMutation = usePublishToWordPressEmpresa();
  const { data: wpSite } = useWordPressSiteByEmpresa(empresaId);

  const getContent = (lang: Language): ArticleContent | null => {
    return lang === "catalan" ? article.content_catalan : article.content_spanish;
  };

  const toggleLanguage = (lang: Language) => {
    if (lang === "spanish") return; // Spanish always required
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const results: MultiPublishResult = {};

    for (const lang of selectedLanguages) {
      const content = getContent(lang);
      if (!content) continue;

      setPublishingLanguage(lang);

      try {
        const result = await publishMutation.mutateAsync({
          empresa_id: empresaId,
          title: content.title,
          content: content.content,
          slug: lang === "catalan" ? `${content.slug}-ca` : content.slug,
          status: status === "future" && scheduleDate ? "future" : status,
          date: status === "future" && scheduleDate ? scheduleDate.toISOString() : undefined,
          image_url: article.image_url || undefined,
          image_alt: content.focus_keyword || content.title,
          meta_description: content.meta_description,
          seo_title: content.seo_title,
          focus_keyword: content.focus_keyword,
          excerpt: content.excerpt || content.meta_description,
          lang: lang === "catalan" ? "ca" : "es",
          category_ids: selectedCategoryIds,
          tag_ids: selectedTagIds,
        });

        results[lang] = result;
      } catch (error) {
        results[lang] = {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        };
      }
    }

    setPublishResults(results);

    // Save wp_post_url to database if published successfully
    if (results.spanish?.success && results.spanish.post_url) {
      const { error: updateError } = await supabase
        .from("articulos_empresas")
        .update({ wp_post_url: results.spanish.post_url })
        .eq("id", article.id);

      if (updateError) {
        console.error("Error updating wp_post_url:", updateError);
      }

      // Invalidate cache so cards update immediately
      queryClient.invalidateQueries({ queryKey: ["articulos_empresas"] });
    }

    setIsPublishing(false);
    setPublishingLanguage(null);
  };

  const handleClose = () => {
    setPublishResults(null);
    setStatus("publish");
    setSelectedLanguages(["spanish"]);
    setScheduleDate(undefined);
    setSelectedCategoryIds([]);
    setSelectedTagIds([]);
    onClose();
  };

  // Not configured dialog
  if (!hasWordPress) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              WordPress no configurado
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Esta empresa no tiene WordPress configurado. Puedes añadir la configuración
            editando la empresa.
          </p>
          <DialogFooter>
            <Button onClick={handleClose}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Results dialog
  if (publishResults) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resultados de publicación</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {publishResults.spanish && (
              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Español</span>
                  {publishResults.spanish.success ? (
                    <span className="text-green-600 text-sm">✓ Publicado</span>
                  ) : (
                    <span className="text-red-600 text-sm">✗ Error</span>
                  )}
                </div>
                {publishResults.spanish.post_url && (
                  <a
                    href={publishResults.spanish.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1 mt-1"
                  >
                    Ver post <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {publishResults.spanish.error && (
                  <p className="text-sm text-red-600 mt-1">
                    {publishResults.spanish.error}
                  </p>
                )}
              </div>
            )}

            {publishResults.catalan && (
              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Catalán</span>
                  {publishResults.catalan.success ? (
                    <span className="text-green-600 text-sm">✓ Publicado</span>
                  ) : (
                    <span className="text-red-600 text-sm">✗ Error</span>
                  )}
                </div>
                {publishResults.catalan.post_url && (
                  <a
                    href={publishResults.catalan.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1 mt-1"
                  >
                    Ver post <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {publishResults.catalan.error && (
                  <p className="text-sm text-red-600 mt-1">
                    {publishResults.catalan.error}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Main publish dialog
  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar en WordPress</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Publicando artículo de <strong>{companyName}</strong>
          </p>

          {/* Language selection */}
          <div className="space-y-2">
            <Label>Idiomas a publicar</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="lang-es" checked disabled />
                <Label htmlFor="lang-es" className="cursor-not-allowed opacity-70">
                  Español
                </Label>
              </div>
              {article.content_catalan && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="lang-ca"
                    checked={selectedLanguages.includes("catalan")}
                    onCheckedChange={() => toggleLanguage("catalan")}
                  />
                  <Label htmlFor="lang-ca" className="cursor-pointer">
                    Catalán
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Status selection */}
          <div className="space-y-2">
            <Label>Estado de publicación</Label>
            <RadioGroup value={status} onValueChange={(v) => setStatus(v as PublishStatus)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="publish" id="status-publish" />
                <Label htmlFor="status-publish" className="cursor-pointer">
                  Publicar ahora
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="draft" id="status-draft" />
                <Label htmlFor="status-draft" className="cursor-pointer">
                  Guardar como borrador
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="future" id="status-future" />
                <Label htmlFor="status-future" className="cursor-pointer">
                  Programar publicación
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Schedule date */}
          {status === "future" && (
            <div className="space-y-2">
              <Label>Fecha de publicación</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduleDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate
                      ? format(scheduleDate, "PPP", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Taxonomy Selector */}
          {wpSite && (
            <div className="space-y-2 border-t pt-4">
              <Label>Categorías y Tags (opcional)</Label>
              <TaxonomySelector
                wordpressSiteId={wpSite.id}
                selectedCategoryIds={selectedCategoryIds}
                selectedTagIds={selectedTagIds}
                onCategoriesChange={setSelectedCategoryIds}
                onTagsChange={setSelectedTagIds}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPublishing}>
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || (status === "future" && !scheduleDate)}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publicando {publishingLanguage === "catalan" ? "catalán" : "español"}...
              </>
            ) : (
              "Publicar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
