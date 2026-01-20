import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Globe, RefreshCw, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import type { Articulo, ArticleContent } from "@/hooks/useArticulos";

interface ArticlePreviewProps {
  article: Articulo | null;
  pharmacyName: string;
  onClose: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onRegenerateImage?: () => void;
  isRegeneratingImage?: boolean;
}

export function ArticlePreview({ 
  article, 
  pharmacyName, 
  onClose, 
  onRegenerate, 
  isRegenerating,
  onRegenerateImage,
  isRegeneratingImage 
}: ArticlePreviewProps) {
  const [language, setLanguage] = useState<"spanish" | "catalan">("spanish");

  if (!article) return null;

  const content: ArticleContent | null = language === "catalan" && article.content_catalan 
    ? article.content_catalan 
    : article.content_spanish;

  if (!content) return null;

  const copyToClipboard = () => {
    const htmlContent = `
<h1>${content.title}</h1>
${article.image_url ? `<img src="${article.image_url}" alt="${content.title}" />
<p><em>Foto: <a href="${article.image_photographer_url}">${article.image_photographer}</a> en Pexels</em></p>` : ""}
${content.content}
    `.trim();

    navigator.clipboard.writeText(htmlContent);
    toast.success("Contenido copiado al portapapeles");
  };

  const downloadHtml = () => {
    const htmlDoc = `<!DOCTYPE html>
<html lang="${language === "catalan" ? "ca" : "es"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${content.meta_description}">
  <title>${content.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    h1, h2 { color: #1a1a1a; }
    p { color: #333; }
  </style>
</head>
<body>
  <article>
    <h1>${content.title}</h1>
    ${article.image_url ? `<img src="${article.image_url}" alt="${content.title}" />
    <p><em>Foto: <a href="${article.image_photographer_url}">${article.image_photographer}</a> en Pexels</em></p>` : ""}
    ${content.content}
  </article>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${content.slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Archivo HTML descargado");
  };

  return (
    <Dialog open={!!article} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{pharmacyName}</DialogTitle>
            <div className="flex items-center gap-2">
              {article.content_catalan && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={language === "spanish" ? "default" : "outline"}
                    onClick={() => setLanguage("spanish")}
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    ES
                  </Button>
                  <Button
                    size="sm"
                    variant={language === "catalan" ? "default" : "outline"}
                    onClick={() => setLanguage("catalan")}
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    CA
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{article.topic}</Badge>
            <Badge variant="outline">/{content.slug}</Badge>
          </div>

          {/* Meta description */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Meta descripción:</strong> {content.meta_description}
            </p>
          </div>

          {/* Image with regenerate button */}
          {article.image_url && (
            <div className="space-y-2">
              <div className="relative group">
                <img
                  src={article.image_url}
                  alt={content.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {onRegenerateImage && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <Button 
                      onClick={onRegenerateImage} 
                      disabled={isRegeneratingImage}
                      variant="secondary"
                      size="sm"
                    >
                      {isRegeneratingImage ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ImagePlus className="w-4 h-4 mr-2" />
                      )}
                      Cambiar imagen
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Foto: <a href={article.image_photographer_url || "#"} target="_blank" rel="noopener noreferrer" className="underline">{article.image_photographer}</a> en Pexels
                </p>
                {onRegenerateImage && (
                  <Button 
                    onClick={onRegenerateImage} 
                    disabled={isRegeneratingImage}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    {isRegeneratingImage ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <ImagePlus className="w-3 h-3 mr-1" />
                    )}
                    Cambiar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold">{content.title}</h1>

          {/* Content */}
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button onClick={copyToClipboard} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copiar HTML
            </Button>
            <Button onClick={downloadHtml} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Descargar HTML
            </Button>
            {onRegenerate && (
              <Button 
                onClick={onRegenerate} 
                disabled={isRegenerating}
                variant="secondary"
              >
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Regenerar artículo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
