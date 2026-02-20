import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Globe, 
  MapPin, 
  Sparkles, 
  Settings, 
  FileText,
  Trash2,
  Link2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import type { Site } from '@/hooks/useSites';

interface SiteCardProps {
  site: Site;
  articleCount: number;
  hasWordPress: boolean;
  wpSiteUrl?: string;
  lastArticleDate?: string | null;
  onGenerateArticle: () => void;
  onViewArticles: () => void;
  onConfigureWordPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isGenerating?: boolean;
  isFirstSite?: boolean;
}

function formatRelativeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 14) return 'Hace 1 semana';
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function needsAttention(hasWordPress: boolean, lastArticleDate?: string | null): boolean {
  if (!hasWordPress) return true;
  if (!lastArticleDate) return true;
  const diffMs = Date.now() - new Date(lastArticleDate).getTime();
  return diffMs > 14 * 24 * 60 * 60 * 1000;
}

export function SiteCard({
  site,
  articleCount,
  hasWordPress,
  wpSiteUrl,
  lastArticleDate,
  onGenerateArticle,
  onViewArticles,
  onConfigureWordPress,
  onEdit,
  onDelete,
  isGenerating,
  isFirstSite,
}: SiteCardProps) {
  const canGenerate = hasWordPress;
  const attention = needsAttention(hasWordPress, lastArticleDate);
  const relativeDate = formatRelativeDate(lastArticleDate);

  return (
    <TooltipProvider>
      <Card 
        className="group hover:shadow-md transition-shadow relative"
        data-tour={isFirstSite ? "site-card" : undefined}
      >
        {/* Attention dot */}
        {attention && (
          <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-background z-10" />
        )}

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-6">
              <CardTitle className="text-[15px] sm:text-lg line-clamp-2">{site.name}</CardTitle>
              {site.sector && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {site.sector.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar configuración</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eliminar sitio</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {site.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{site.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span className="capitalize">{site.geographic_scope}</span>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasWordPress ? (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                WP Conectado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30 bg-amber-50 dark:bg-amber-900/20 font-semibold">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Sin WordPress
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              {articleCount} artículo{articleCount !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Last article date */}
          {relativeDate && (
            <p className="text-xs text-muted-foreground">
              Último artículo: {relativeDate}
            </p>
          )}
          {!lastArticleDate && articleCount === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Sin artículos todavía
            </p>
          )}

          {/* Action buttons with tooltips */}
          <div className="flex flex-wrap gap-2">
            {canGenerate ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    onClick={onGenerateArticle}
                    disabled={isGenerating}
                    data-tour={isFirstSite ? "generate-button" : undefined}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generando...' : 'Generar'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Generar un nuevo artículo con IA</TooltipContent>
              </Tooltip>
            ) : (
              <Button 
                size="sm" 
                onClick={onConfigureWordPress}
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
                data-tour={isFirstSite ? "wordpress-config" : undefined}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Configura WP primero
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onViewArticles}
                  data-tour={isFirstSite ? "view-articles" : undefined}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver artículos
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver todos los artículos del sitio</TooltipContent>
            </Tooltip>
            {hasWordPress && wpSiteUrl && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => window.open(wpSiteUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Abrir WordPress en nueva pestaña</TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
