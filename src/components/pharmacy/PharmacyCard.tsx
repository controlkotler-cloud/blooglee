import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Eye, Edit3, Trash2, Check, Globe, RefreshCw, Hand, Zap, ExternalLink, Clock } from "lucide-react";
import type { Farmacia } from "@/hooks/useFarmacias";
import type { Articulo } from "@/hooks/useArticulos";
import type { SeasonalTopic } from "@/lib/seasonalTopics";

interface PharmacyCardProps {
  pharmacy: Farmacia;
  topic: SeasonalTopic;
  article: Articulo | null;
  isGenerating: boolean;
  hasWordPress?: boolean;
  onGenerate: () => void;
  onPreview: () => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PharmacyCard({
  pharmacy,
  topic,
  article,
  isGenerating,
  hasWordPress,
  onGenerate,
  onPreview,
  onRegenerate,
  onEdit,
  onDelete,
}: PharmacyCardProps) {
  const hasArticle = !!article;
  const hasCatalan = pharmacy.languages?.includes("catalan");
  const isManual = !pharmacy.auto_generate;
  const isPublished = !!article?.wp_post_url;
  const wpPostUrl = article?.wp_post_url;

  return (
    <Card className={`transition-all ${hasArticle ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/20" : ""}`}>
      <CardContent className="p-5 space-y-4">
        {/* Header: Location + Config badges */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground font-medium">{pharmacy.location}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
            {/* Auto/Manual indicator */}
            {isManual ? (
              <Badge variant="outline" className="text-xs bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400">
                <Hand className="w-3 h-3 mr-1" />
                Manual
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400">
                <Zap className="w-3 h-3 mr-1" />
                Auto
              </Badge>
            )}
            {hasCatalan && (
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                ES/CA
              </Badge>
            )}
            {hasWordPress && (
              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400">
                WP
              </Badge>
            )}
          </div>
        </div>

        {/* Pharmacy name */}
        <h3 className="font-semibold text-lg break-words leading-tight">{pharmacy.name}</h3>

        {/* Topic */}
        <div className="flex flex-col gap-1">
          <Badge variant="secondary" className="text-xs w-fit">
            {isManual && pharmacy.custom_topic ? pharmacy.custom_topic : topic.tema}
          </Badge>
          {isManual && pharmacy.custom_topic && (
            <span className="text-xs text-muted-foreground">(tema personalizado)</span>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasArticle ? (
            <Badge className="bg-green-600 hover:bg-green-600 text-white">
              <Check className="w-3 h-3 mr-1" />
              Generado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
              <Clock className="w-3 h-3 mr-1" />
              Pendiente
            </Badge>
          )}
          
          {hasArticle && (
            isPublished ? (
              <Badge className="bg-violet-600 hover:bg-violet-600 text-white">
                <ExternalLink className="w-3 h-3 mr-1" />
                Publicado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                <Clock className="w-3 h-3 mr-1" />
                Sin publicar
              </Badge>
            )
          )}
        </div>

        {/* Actions */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              {hasArticle ? (
                <>
                  <Button size="sm" variant="outline" onClick={onPreview} title="Ver artículo">
                    <Eye className="w-4 h-4 mr-1.5" />
                    Ver
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onRegenerate} 
                    disabled={isGenerating}
                    title="Regenerar artículo"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                  {wpPostUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(wpPostUrl, '_blank')}
                      title="Ver en WordPress"
                      className="text-violet-600 hover:text-violet-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={onGenerate}
                  disabled={isGenerating}
                  title="Generar artículo"
                  className="bg-primary hover:bg-primary/90"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Play className="w-4 h-4 mr-1.5" />
                  )}
                  Generar
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={onEdit} title="Editar farmacia">
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete} title="Eliminar farmacia" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
