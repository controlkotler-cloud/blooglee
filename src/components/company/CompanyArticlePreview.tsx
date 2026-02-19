import { useState } from "react";
import DOMPurify from "dompurify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticuloEmpresa, ArticleContent } from "@/hooks/useArticulosEmpresas";
import { WordPressPublishDialogEmpresa } from "./WordPressPublishDialogEmpresa";
import {
  Copy,
  Download,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface CompanyArticlePreviewProps {
  article: ArticuloEmpresa | null;
  companyName: string;
  empresaId: string;
  hasWordPress: boolean;
  onClose: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onRegenerateImage?: () => void;
  isRegeneratingImage?: boolean;
}

export function CompanyArticlePreview({
  article,
  companyName,
  empresaId,
  hasWordPress,
  onClose,
  onRegenerate,
  isRegenerating,
  onRegenerateImage,
  isRegeneratingImage,
}: CompanyArticlePreviewProps) {
  const [language, setLanguage] = useState<"spanish" | "catalan">("spanish");
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  if (!article) return null;

  const content: ArticleContent | null =
    language === "catalan" ? article.content_catalan : article.content_spanish;

  if (!content) return null;

  const copyToClipboard = () => {
    const html = `<h1>${content.title}</h1>\n${content.content}`;
    navigator.clipboard.writeText(html);
    toast.success("HTML copiado al portapapeles");
  };

  const downloadHtml = () => {
    const html = `<!DOCTYPE html>
<html lang="${language === "catalan" ? "ca" : "es"}">
<head>
  <meta charset="UTF-8">
  <meta name="description" content="${content.meta_description}">
  <title>${content.title}</title>
</head>
<body>
  <article>
    <h1>${content.title}</h1>
    ${article.image_url ? `<img src="${article.image_url}" alt="${content.title}">` : ""}
    ${content.content}
  </article>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${content.slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openOriginalImage = () => {
    if (article.image_url) {
      window.open(article.image_url, "_blank");
    }
  };

  return (
    <>
      <Dialog open={!!article} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <DialogTitle>{companyName}</DialogTitle>
              {article.content_catalan && (
                <Tabs
                  value={language}
                  onValueChange={(v) => setLanguage(v as "spanish" | "catalan")}
                >
                  <TabsList>
                    <TabsTrigger value="spanish">Español</TabsTrigger>
                    <TabsTrigger value="catalan">Catalán</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Slug: {content.slug}</Badge>
              <Badge variant="outline">Tema: {article.topic}</Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              <strong>Meta descripción:</strong> {content.meta_description}
            </div>

            {/* Image with download and regenerate options */}
            {article.image_url && (
              <div className="relative group">
                <img
                  src={article.image_url}
                  alt={content.title}
                  className="w-full max-h-80 object-cover rounded-lg cursor-pointer transition-opacity group-hover:opacity-90"
                  onClick={openOriginalImage}
                />
                
                {/* Overlay with actions on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={openOriginalImage}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver original
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onRegenerateImage}
                    disabled={isRegeneratingImage}
                  >
                    {isRegeneratingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <ImageIcon className="h-4 w-4 mr-1" />
                    )}
                    Nueva imagen
                  </Button>
                </div>

                {/* Photographer credit */}
                {article.image_photographer && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Foto:{" "}
                    {article.image_photographer_url ? (
                      <a
                        href={article.image_photographer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary-foreground"
                      >
                        {article.image_photographer}
                      </a>
                    ) : (
                      article.image_photographer
                    )}{" "}
                    / Unsplash
                  </div>
                )}
              </div>
            )}

            {/* No image state with regenerate option */}
            {!article.image_url && (
              <div className="border border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-3">Sin imagen destacada</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRegenerateImage}
                  disabled={isRegeneratingImage}
                >
                  {isRegeneratingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-1" />
                  )}
                  Generar imagen
                </Button>
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.content, {
                ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'div', 'span', 'hr', 'img', 'br'],
                ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'src', 'alt'],
                ALLOW_DATA_ATTR: false,
              }) }}
            />

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-1" />
                Copiar HTML
              </Button>
              <Button variant="outline" size="sm" onClick={downloadHtml}>
                <Download className="h-4 w-4 mr-1" />
                Descargar HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Regenerar artículo
              </Button>
              <Button
                size="sm"
                onClick={() => setShowPublishDialog(true)}
                className="ml-auto"
              >
                <Globe className="h-4 w-4 mr-1" />
                Publicar en WordPress
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WordPressPublishDialogEmpresa
        open={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        article={article}
        empresaId={empresaId}
        companyName={companyName}
        hasWordPress={hasWordPress}
      />
    </>
  );
}
