import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CalendarIcon, Send, FileText, Clock, ExternalLink, Globe, CheckCircle2, Settings, RefreshCw, Tag, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Article, ArticleContent } from "@/hooks/useArticlesSaas";
import { usePublishToWordPressSaas, type PublishResultSaas } from "@/hooks/useArticlesSaas";
import { useWordPressConfig } from "@/hooks/useWordPressConfigSaas";
import { useTaxonomiesSaas, useSyncTaxonomiesSaas } from "@/hooks/useWordPressTaxonomiesSaas";

interface WordPressPublishDialogSaasProps {
  open: boolean;
  onClose: () => void;
  article: Article | null;
  siteId: string;
  siteName?: string;
}

type PublishStatus = 'publish' | 'draft' | 'future';
type Language = 'spanish' | 'catalan';

interface MultiPublishResult {
  spanish?: PublishResultSaas;
  catalan?: PublishResultSaas;
}

export function WordPressPublishDialogSaas({
  open,
  onClose,
  article,
  siteId,
  siteName,
}: WordPressPublishDialogSaasProps) {
  const [status, setStatus] = useState<PublishStatus>('publish');
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(['spanish']);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [publishResults, setPublishResults] = useState<MultiPublishResult | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingLanguage, setPublishingLanguage] = useState<Language | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const queryClient = useQueryClient();
  const { data: wpConfig, isLoading: isLoadingConfig } = useWordPressConfig(siteId);
  const { data: taxonomies, isLoading: isLoadingTaxonomies } = useTaxonomiesSaas(wpConfig?.id);
  const syncMutation = useSyncTaxonomiesSaas();
  const publishMutation = usePublishToWordPressSaas();
  
  const hasCatalan = !!article?.content_catalan;
  const hasWordPress = !!wpConfig;
  const categories = taxonomies?.categories || [];
  const tags = taxonomies?.tags || [];

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCategoryIds([]);
      setSelectedTagIds([]);
    }
  }, [open]);

  const getContent = (lang: Language): ArticleContent | null => {
    if (!article) return null;
    return lang === 'catalan' && article.content_catalan
      ? article.content_catalan
      : article.content_spanish;
  };

  const toggleLanguage = (lang: Language) => {
    setSelectedLanguages(prev => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev;
        return prev.filter(l => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const toggleCategory = (wpId: number) => {
    setSelectedCategoryIds(prev => 
      prev.includes(wpId) ? prev.filter(id => id !== wpId) : [...prev, wpId]
    );
  };

  const toggleTag = (wpId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(wpId) ? prev.filter(id => id !== wpId) : [...prev, wpId]
    );
  };

  const handleSync = () => {
    if (wpConfig?.id) {
      syncMutation.mutate(wpConfig.id);
    }
  };

  const handlePublish = async () => {
    if (!article || selectedLanguages.length === 0) return;

    let publishDate: string | undefined;
    if (status === 'future' && scheduleDate) {
      publishDate = scheduleDate.toISOString();
    }

    setIsPublishing(true);
    const results: MultiPublishResult = {};

    try {
      for (const lang of selectedLanguages) {
        const content = getContent(lang);
        if (!content) continue;

        setPublishingLanguage(lang);

        const result = await publishMutation.mutateAsync({
          site_id: siteId,
          title: content.title,
          seo_title: content.seo_title,
          content: content.content,
          slug: content.slug,
          status: status === 'future' ? 'future' : status,
          date: publishDate,
          image_url: article.image_url || undefined,
          image_alt: content.title,
          meta_description: content.meta_description,
          excerpt: content.excerpt || content.meta_description,
          focus_keyword: content.focus_keyword,
          lang: lang === 'catalan' ? 'ca' : 'es',
          category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
          tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        });

        results[lang] = result;
      }

      setPublishResults(results);

      // Save wp_post_url to database if published successfully
      if (article && results.spanish?.success && results.spanish?.post_url) {
        try {
          await supabase
            .from('articles')
            .update({ wp_post_url: results.spanish.post_url })
            .eq('id', article.id);
          
          queryClient.invalidateQueries({ queryKey: ['articles'] });
        } catch (err) {
          console.error('Error saving wp_post_url:', err);
        }
      }
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setIsPublishing(false);
      setPublishingLanguage(null);
    }
  };

  const handleClose = () => {
    setPublishResults(null);
    setStatus('publish');
    setSelectedLanguages(['spanish']);
    setScheduleDate(undefined);
    setSelectedCategoryIds([]);
    setSelectedTagIds([]);
    onClose();
  };

  if (!article) return null;

  const spanishContent = getContent('spanish');
  const catalanContent = getContent('catalan');

  // Loading state
  if (isLoadingConfig) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No WordPress configured
  if (!hasWordPress) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              WordPress no configurado
            </DialogTitle>
            <DialogDescription>
              Para publicar en WordPress, primero debes configurar las credenciales en la pestaña "Configuración" de {siteName || 'este sitio'}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={handleClose}>Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success state
  const hasResults = publishResults && (publishResults.spanish?.success || publishResults.catalan?.success);
  if (hasResults) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              ¡Publicación exitosa!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {publishResults.spanish?.success && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Español</Badge>
                  <span className="text-sm text-muted-foreground">
                    {publishResults.spanish.status === 'draft' ? 'Borrador' : publishResults.spanish.status === 'future' ? 'Programado' : 'Publicado'}
                  </span>
                </div>
                {publishResults.spanish.post_url && (
                  <a
                    href={publishResults.spanish.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver artículo
                  </a>
                )}
              </div>
            )}
            {publishResults.catalan?.success && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Català</Badge>
                  <span className="text-sm text-muted-foreground">
                    {publishResults.catalan.status === 'draft' ? 'Esborrany' : publishResults.catalan.status === 'future' ? 'Programat' : 'Publicat'}
                  </span>
                </div>
                {publishResults.catalan.post_url && (
                  <a
                    href={publishResults.catalan.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Veure article
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleClose}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Publicar en WordPress
          </DialogTitle>
          <DialogDescription>
            {siteName ? `Publicar artículo de ${siteName}` : 'Publicar artículo'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Language selector */}
          <div className="space-y-3">
            <Label>Idiomas a publicar</Label>
            <div className="space-y-3">
              {/* Spanish option */}
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  id="lang-spanish"
                  checked={selectedLanguages.includes('spanish')}
                  onCheckedChange={() => toggleLanguage('spanish')}
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="lang-spanish" className="cursor-pointer flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Español
                  </Label>
                  {spanishContent && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{spanishContent.title}</p>
                  )}
                </div>
              </div>
              
              {/* Catalan option */}
              {hasCatalan && catalanContent && (
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <Checkbox
                    id="lang-catalan"
                    checked={selectedLanguages.includes('catalan')}
                    onCheckedChange={() => toggleLanguage('catalan')}
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="lang-catalan" className="cursor-pointer flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Català
                    </Label>
                    <p className="text-xs text-muted-foreground line-clamp-1">{catalanContent.title}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Taxonomies section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Categorías y Tags</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="h-7 text-xs"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Sincronizar
              </Button>
            </div>

            {isLoadingTaxonomies ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando taxonomías...
              </div>
            ) : categories.length === 0 && tags.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hay categorías ni tags sincronizados. Pulsa "Sincronizar" para obtenerlos de WordPress.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Categories */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" />
                      Categorías
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <label
                          key={cat.id}
                          className={cn(
                            "flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1 rounded-md border transition-colors",
                            selectedCategoryIds.includes(cat.wp_id) 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-muted/50 border-transparent hover:bg-muted"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(cat.wp_id)}
                            onChange={() => toggleCategory(cat.wp_id)}
                            className="sr-only"
                          />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <label
                          key={tag.id}
                          className={cn(
                            "flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1 rounded-md border transition-colors",
                            selectedTagIds.includes(tag.wp_id) 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-muted/50 border-transparent hover:bg-muted"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTagIds.includes(tag.wp_id)}
                            onChange={() => toggleTag(tag.wp_id)}
                            className="sr-only"
                          />
                          <span>{tag.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Publish options */}
          <div className="space-y-3">
            <Label>Opciones de publicación</Label>
            <RadioGroup value={status} onValueChange={(v) => setStatus(v as PublishStatus)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="publish" id="publish" />
                <Label htmlFor="publish" className="cursor-pointer flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Publicar ahora
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="draft" id="draft" />
                <Label htmlFor="draft" className="cursor-pointer flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Guardar como borrador
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="future" id="future" />
                <Label htmlFor="future" className="cursor-pointer flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Programar publicación
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date picker for scheduled posts */}
          {status === 'future' && (
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
                    {scheduleDate ? format(scheduleDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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

          {/* Action buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPublishing}>
              Cancelar
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || selectedLanguages.length === 0 || (status === 'future' && !scheduleDate)}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publicando {publishingLanguage === 'catalan' ? 'català' : 'español'}...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {status === 'draft' ? 'Guardar' : status === 'future' ? 'Programar' : 'Publicar'}
                  {selectedLanguages.length > 1 && ` (${selectedLanguages.length} idiomas)`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
