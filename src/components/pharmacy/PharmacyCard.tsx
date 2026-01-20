import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Eye, Edit3, Trash2, Check, Globe } from "lucide-react";
import type { Farmacia } from "@/hooks/useFarmacias";
import type { Articulo } from "@/hooks/useArticulos";
import type { SeasonalTopic } from "@/lib/seasonalTopics";

interface PharmacyCardProps {
  pharmacy: Farmacia;
  topic: SeasonalTopic;
  article: Articulo | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PharmacyCard({
  pharmacy,
  topic,
  article,
  isGenerating,
  onGenerate,
  onPreview,
  onEdit,
  onDelete,
}: PharmacyCardProps) {
  const hasArticle = !!article;
  const hasCatalan = pharmacy.languages?.includes("catalan");

  return (
    <Card className={`transition-all ${hasArticle ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{pharmacy.name}</h3>
              {hasCatalan && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  ES/CA
                </Badge>
              )}
              {hasArticle && (
                <Badge variant="default" className="bg-green-600">
                  <Check className="w-3 h-3 mr-1" />
                  Generado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{pharmacy.location}</p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {topic.tema}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasArticle ? (
              <Button size="sm" variant="outline" onClick={onPreview}>
                <Eye className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
