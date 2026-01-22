import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CalendarIcon, Send, FileText, Clock, ExternalLink, Globe, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Articulo, ArticleContent } from "@/hooks/useArticulos";
import { usePublishToWordPress, type PublishResult } from "@/hooks/useWordPressSites";

interface WordPressPublishDialogProps {
  open: boolean;
  onClose: () => void;
  article: Articulo;
  farmaciaId: string;
  pharmacyName: string;
  hasWordPress: boolean;
}

type PublishStatus = 'publish' | 'draft' | 'future';
type Language = 'spanish' | 'catalan';

interface MultiPublishResult {
  spanish?: PublishResult;
  catalan?: PublishResult;
}

export function WordPressPublishDialog({
  open,
  onClose,
  article,
  farmaciaId,
  pharmacyName,
  hasWordPress,
}: WordPressPublishDialogProps) {
  const [status, setStatus] = useState<PublishStatus>('publish');
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(['spanish']);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [publishResults, setPublishResults] = useState<MultiPublishResult | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingLanguage, setPublishingLanguage] = useState<Language | null>(null);

  const publishMutation = usePublishToWordPress();
  const hasCatalan = !!article.content_catalan;

  const getContent = (lang: Language): ArticleContent | null => {
    return lang === 'catalan' && article.content_catalan
      ? article.content_catalan
      : article.content_spanish;
  };

  const toggleLanguage = (lang: Language) => {
    setSelectedLanguages(prev => {
      if (prev.includes(lang)) {
        // Don't allow deselecting if it's the only one selected
        if (prev.length === 1) return prev;
        return prev.filter(l => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const handlePublish = async () => {
    if (selectedLanguages.length === 0) return;

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
          farmacia_id: farmaciaId,
          title: content.title,
          content: content.content,
          slug: content.slug,
          status: status === 'future' ? 'publish' : status,
          date: publishDate,
          image_url: article.image_url || undefined,
          image_alt: content.title,
          meta_description: content.meta_description,
          lang: lang === 'catalan' ? 'ca' : 'es',
        });

        results[lang] = result;
      }

      setPublishResults(results);
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
    onClose();
  };

  const spanishContent = getContent('spanish');
  const catalanContent = getContent('catalan');

  if (!hasWordPress) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>WordPress no configurado</DialogTitle>
            <DialogDescription>
              Para publicar en WordPress, primero debes configurar las credenciales de WordPress para {pharmacyName} en la pestaña "Farmacias".
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
      <Dialog open={open} onOpenChange={handleClose}>
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Publicar en WordPress
          </DialogTitle>
          <DialogDescription>
            Publicar artículo de {pharmacyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Language selector - checkboxes for multi-select */}
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
