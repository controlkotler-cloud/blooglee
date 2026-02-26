import { useState } from "react";
import DOMPurify from "dompurify";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, ExternalLink, ImagePlus, Loader2 } from "lucide-react";
import type { Article } from "@/hooks/useArticlesSaas";
import { useRegenerateImageSaas } from "@/hooks/useArticlesSaas";

interface ArticlePreviewDialogProps {
  article: Article | null;
  open: boolean;
  onClose: () => void;
  onPublish: () => void;
  siteSector?: string;
}

export function ArticlePreviewDialog({ article, open, onClose, onPublish, siteSector }: ArticlePreviewDialogProps) {
  const [selectedLang, setSelectedLang] = useState<"spanish" | "catalan">("spanish");
  const regenerateMutation = useRegenerateImageSaas();

  if (!article) return null;

  const content = selectedLang === "spanish" ? article.content_spanish : article.content_catalan;
  const hasSpanish = !!article.content_spanish;
  const hasCatalan = !!article.content_catalan;
  const isPublished = !!article.wp_post_url;

  const handleRegenerateImage = () => {
    if (!article) return;

    regenerateMutation.mutate({
      articleId: article.id,
      pexelsQuery: article.pexels_query || article.topic,
      articleTitle: article.content_spanish?.title,
      articleContent: article.content_spanish?.content,
      companySector: siteSector,
      usedImageUrls: article.image_url ? [article.image_url] : [],
    });
  };

  const isRegeneratingImage = regenerateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="line-clamp-1">{content?.title || article.topic}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Language tabs */}
        <Tabs
          value={selectedLang}
          onValueChange={(v) => setSelectedLang(v as "spanish" | "catalan")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="spanish" disabled={!hasSpanish}>
                Español
              </TabsTrigger>
              <TabsTrigger value="catalan" disabled={!hasCatalan}>
                Català
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {!isPublished && (
                <Button size="sm" onClick={onPublish}>
                  <Upload className="w-4 h-4 mr-2" />
                  Publicar
                </Button>
              )}
              {isPublished && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                  Publicado
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Featured image */}
            {article.image_url && (
              <div className="space-y-2">
                <a href={article.image_url} target="_blank" rel="noopener noreferrer" className="block relative group">
                  <img
                    src={article.image_url}
                    alt={content?.title || article.topic}
                    loading="lazy"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <ExternalLink className="w-6 h-6 text-white" />
                  </div>
                </a>
                <div className="flex items-center justify-between">
                  {article.image_photographer && (
                    <p className="text-xs text-muted-foreground">
                      Foto por{" "}
                      <a
                        href={article.image_photographer_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {article.image_photographer}
                      </a>
                    </p>
                  )}
                  {!isPublished && (
                    <Button
                      onClick={handleRegenerateImage}
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

            <TabsContent value="spanish" className="m-0">
              {article.content_spanish ? (
                <ArticleContentView content={article.content_spanish} />
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay contenido en español</p>
              )}
            </TabsContent>

            <TabsContent value="catalan" className="m-0">
              {article.content_catalan ? (
                <ArticleContentView content={article.content_catalan} />
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay contenido en catalán</p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface ArticleContentViewProps {
  content: {
    title: string;
    meta_description: string;
    slug: string;
    content: string;
  };
}

function ArticleContentView({ content }: ArticleContentViewProps) {
  return (
    <div className="space-y-4">
      {/* Meta description */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Meta description
          </Badge>
          <span className="text-xs text-muted-foreground">{content.meta_description.length}/160 caracteres</span>
        </div>
        <p className="text-sm">{content.meta_description}</p>
      </div>

      {/* Slug */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="secondary" className="text-xs">
          Slug
        </Badge>
        <code className="bg-muted px-2 py-0.5 rounded text-xs">{content.slug}</code>
      </div>

      {/* Content */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content.content, {
            ALLOWED_TAGS: [
              "p",
              "h1",
              "h2",
              "h3",
              "h4",
              "ul",
              "ol",
              "li",
              "strong",
              "em",
              "a",
              "blockquote",
              "code",
              "pre",
              "table",
              "thead",
              "tbody",
              "tr",
              "td",
              "th",
              "div",
              "span",
              "hr",
              "img",
              "br",
            ],
            ALLOWED_ATTR: ["href", "target", "rel", "class", "id", "src", "alt"],
            ALLOW_DATA_ATTR: false,
          }),
        }}
      />
    </div>
  );
}
