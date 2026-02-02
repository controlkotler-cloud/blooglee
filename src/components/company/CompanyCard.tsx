import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empresa } from "@/hooks/useEmpresas";
import { ArticuloEmpresa } from "@/hooks/useArticulosEmpresas";
import {
  Eye,
  RefreshCw,
  Sparkles,
  Pencil,
  Trash2,
  Loader2,
  Hand,
  Zap,
  Building2,
  MapPin,
  Globe,
  Calendar,
  ImageOff,
  Check,
  ExternalLink,
  Clock,
} from "lucide-react";

interface CompanyCardProps {
  company: Empresa;
  article: ArticuloEmpresa | null;
  isGenerating: boolean;
  hasWordPress?: boolean;
  onGenerate: () => void;
  onPreview: () => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const frequencyLabels: Record<string, string> = {
  monthly: "Mensual",
  biweekly: "Quincenal",
  weekly: "Semanal",
  daily: "Diario",
};

const scopeLabels: Record<string, string> = {
  local: "Local",
  regional: "Regional",
  national: "Nacional",
};

export function CompanyCard({
  company,
  article,
  isGenerating,
  hasWordPress,
  onGenerate,
  onPreview,
  onRegenerate,
  onEdit,
  onDelete,
}: CompanyCardProps) {
  const hasArticle = !!article;
  const hasCatalan = company.languages.includes("catalan");
  const isManual = !company.auto_generate;
  const hasImage = company.include_featured_image ?? true;
  const frequency = company.publish_frequency || "monthly";
  const scope = company.geographic_scope || "local";
  const isPublished = !!article?.wp_post_url;
  const wpPostUrl = article?.wp_post_url;

  const getScopeIcon = () => {
    switch (scope) {
      case "national":
        return <Globe className="h-3 w-3" />;
      case "regional":
        return <MapPin className="h-3 w-3" />;
      default:
        return <MapPin className="h-3 w-3" />;
    }
  };

  const getLocationDisplay = () => {
    if (scope === "national") {
      return "España";
    }
    return company.location || "";
  };

  return (
    <Card className={`transition-all ${hasArticle ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/20" : ""}`}>
      <CardContent className="p-5 space-y-4">
        {/* Header: Location/sector + Config badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              {getScopeIcon()}
              {getLocationDisplay()}
            </span>
            {company.sector && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {company.sector}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Company name */}
        <h3 className="font-semibold text-lg leading-tight break-words">{company.name}</h3>
        
        {/* Config badges row */}
        <div className="flex gap-1.5 flex-wrap">
          {/* Auto/Manual indicator */}
          {isManual ? (
            <Badge variant="outline" className="text-xs bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400">
              <Hand className="h-3 w-3 mr-1" />
              Manual
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400">
              <Zap className="h-3 w-3 mr-1" />
              Auto
            </Badge>
          )}
          
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {frequencyLabels[frequency]}
          </Badge>
          
          <Badge variant="outline" className="text-xs">
            {scopeLabels[scope]}
          </Badge>
          
          <Badge variant="outline" className="text-xs">ES</Badge>
          {hasCatalan && <Badge variant="outline" className="text-xs">CA</Badge>}
          
          {!hasImage && (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700">
              <ImageOff className="h-3 w-3 mr-1" />
              Sin img
            </Badge>
          )}
          
          {hasWordPress && (
            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400">
              WP
            </Badge>
          )}
        </div>

        {/* Topic display - only show if manual with custom topic */}
        {isManual && company.custom_topic && (
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="text-xs w-fit">
              {company.custom_topic}
            </Badge>
            <span className="text-xs text-muted-foreground">(tema personalizado)</span>
          </div>
        )}
        
        {/* Auto-generate explanation */}
        {!isManual && (
          <p className="text-xs text-muted-foreground">
            La IA generará el tema automáticamente
          </p>
        )}

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
                  <Button size="sm" variant="outline" onClick={onPreview}>
                    <Eye className="h-4 w-4 mr-1.5" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRegenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
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
                  className="bg-primary hover:bg-primary/90"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1.5" />
                  )}
                  Generar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
