import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Upload, Trash2, MoreVertical, Image, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Article } from '@/hooks/useArticlesSaas';

interface ArticleCardProps {
  article: Article;
  onView: () => void;
  onPublish: () => void;
  onDelete: () => void;
}

export function ArticleCard({
  article,
  onView,
  onPublish,
  onDelete,
}: ArticleCardProps) {
  const title = article.content_spanish?.title || article.topic;
  const hasSpanish = !!article.content_spanish;
  const hasCatalan = !!article.content_catalan;
  const formattedDate = format(new Date(article.generated_at), "d MMM yyyy", { locale: es });

  return (
    <Card className="group hover:shadow-md transition-shadow overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Actions overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="w-4 h-4 mr-2" />
                Ver artículo
              </DropdownMenuItem>
              {!article.wp_post_url && (
                <DropdownMenuItem onClick={onPublish}>
                  <Upload className="w-4 h-4 mr-2" />
                  Publicar en WordPress
                </DropdownMenuItem>
              )}
              {!article.wp_post_url && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 
          className="font-medium line-clamp-2 mb-2 cursor-pointer hover:text-primary transition-colors"
          onClick={onView}
        >
          {title}
        </h3>

        {/* Meta */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
          <div className="flex gap-1">
            {article.wp_post_url && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 text-emerald-600 bg-emerald-50 border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                WP
              </Badge>
            )}
            {hasSpanish && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                ES
              </Badge>
            )}
            {hasCatalan && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                CA
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
