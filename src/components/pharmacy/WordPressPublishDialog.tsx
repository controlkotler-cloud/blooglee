import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarIcon, Send, FileText, Clock, ExternalLink, Globe } from "lucide-react";
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

export function WordPressPublishDialog({
  open,
  onClose,
  article,
  farmaciaId,
  pharmacyName,
  hasWordPress,
}: WordPressPublishDialogProps) {
  const [status, setStatus] = useState<PublishStatus>('publish');
  const [language, setLanguage] = useState<Language>('spanish');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);

  const publishMutation = usePublishToWordPress();
  const hasCatalan = !!article.content_catalan;

  const getContent = (): ArticleContent | null => {
    return language === 'catalan' && article.content_catalan
      ? article.content_catalan
      : article.content_spanish;
  };

  const handlePublish = async () => {
    const content = getContent();
    if (!content) return;

    let publishDate: string | undefined;
    if (status === 'future' && scheduleDate) {
      publishDate = scheduleDate.toISOString();
    }

    try {
      const result = await publishMutation.mutateAsync({
        farmacia_id: farmaciaId,
        title: content.title,
        content: content.content,
        slug: content.slug,
        status: status === 'future' ? 'publish' : status,
        date: publishDate,
        image_url: article.image_url || undefined,
        image_alt: content.title,
      });

      setPublishResult(result);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setPublishResult(null);
    setStatus('publish');
    setScheduleDate(undefined);
    onClose();
  };

  const content = getContent();

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
  if (publishResult?.success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <Send className="w-5 h-5" />
              ¡Publicación exitosa!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              El artículo ha sido {publishResult.status === 'draft' ? 'guardado como borrador' : publishResult.status === 'future' ? 'programado' : 'publicado'} correctamente.
            </p>
            {publishResult.post_url && (
              <a
                href={publishResult.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Ver artículo en WordPress
              </a>
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
          {/* Language selector */}
          {hasCatalan && (
            <div className="space-y-2">
              <Label>Idioma del artículo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={language === 'spanish' ? 'default' : 'outline'}
                  onClick={() => setLanguage('spanish')}
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Español
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={language === 'catalan' ? 'default' : 'outline'}
                  onClick={() => setLanguage('catalan')}
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Catalán
                </Button>
              </div>
            </div>
          )}

          {/* Article preview */}
          {content && (
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p className="font-medium text-sm">{content.title}</p>
              <Badge variant="outline" className="text-xs">/{content.slug}</Badge>
            </div>
          )}

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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending || (status === 'future' && !scheduleDate)}
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {status === 'draft' ? 'Guardar borrador' : status === 'future' ? 'Programar' : 'Publicar'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
