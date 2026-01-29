import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  MapPin, 
  Sparkles, 
  Settings, 
  FileText,
  Trash2,
  Link2,
  Lock
} from 'lucide-react';
import type { Site } from '@/hooks/useSites';

interface SiteCardProps {
  site: Site;
  articleCount: number;
  hasWordPress: boolean;
  onGenerateArticle: () => void;
  onViewArticles: () => void;
  onConfigureWordPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isGenerating?: boolean;
  isFirstSite?: boolean;
}

export function SiteCard({
  site,
  articleCount,
  hasWordPress,
  onGenerateArticle,
  onViewArticles,
  onConfigureWordPress,
  onEdit,
  onDelete,
  isGenerating,
  isFirstSite,
}: SiteCardProps) {
  const canGenerate = hasWordPress;

  return (
    <Card 
      className="group hover:shadow-md transition-shadow"
      data-tour={isFirstSite ? "site-card" : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{site.name}</CardTitle>
            {site.sector && (
              <Badge variant="secondary" className="text-xs capitalize">
                {site.sector.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={onEdit} title="Editar">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} title="Eliminar" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
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

        <div className="flex items-center gap-2">
          {hasWordPress ? (
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20">
              <Link2 className="w-3 h-3 mr-1" />
              WP Conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30 bg-amber-50 dark:bg-amber-900/20">
              <Lock className="w-3 h-3 mr-1" />
              Sin WordPress
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            {articleCount} artículo{articleCount !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {canGenerate ? (
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
          ) : (
            <Button 
              size="sm" 
              onClick={onConfigureWordPress}
              variant="outline"
              className="border-amber-500/50 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              data-tour={isFirstSite ? "wordpress-config" : undefined}
            >
              <Lock className="w-4 h-4 mr-2" />
              Configura WP primero
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onViewArticles}
            data-tour={isFirstSite ? "view-articles" : undefined}
          >
            <FileText className="w-4 h-4 mr-2" />
            Ver artículos
          </Button>
          {hasWordPress && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onConfigureWordPress}
              title="Configurar WordPress"
            >
              <Link2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
