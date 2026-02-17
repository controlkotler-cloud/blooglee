import { Copy, Trash2, RefreshCw, Instagram, Linkedin, Facebook, ExternalLink, Send, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { SocialContent } from '@/hooks/useAdminSocialContent';

const platformConfig: Record<string, { icon: any; label: string; color: string }> = {
  instagram: { icon: Instagram, label: 'Instagram', color: 'bg-pink-500/10 text-pink-600' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'bg-blue-500/10 text-blue-600' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'bg-indigo-500/10 text-indigo-600' },
  tiktok: { icon: null, label: 'TikTok', color: 'bg-gray-500/10 text-gray-600' },
};

const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
  draft: { icon: Clock, label: 'Borrador', color: 'bg-yellow-500/10 text-yellow-700' },
  scheduled: { icon: Send, label: 'Programado', color: 'bg-green-500/10 text-green-700' },
  published: { icon: CheckCircle, label: 'Publicado', color: 'bg-emerald-500/10 text-emerald-700' },
};

interface Props {
  item: SocialContent;
  onDelete: (id: string) => void;
  onRegenerate: (item: SocialContent) => void;
  onSchedule?: (id: string) => void;
  isRegenerating?: boolean;
  isScheduling?: boolean;
}

export function SocialContentCard({ item, onDelete, onRegenerate, onSchedule, isRegenerating, isScheduling }: Props) {
  const { toast } = useToast();
  const config = platformConfig[item.platform] || platformConfig.tiktok;
  const Icon = config.icon;
  const status = statusConfig[item.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.content);
    toast({ title: 'Copiado al portapapeles' });
  };

  const isAlreadyScheduled = item.status === 'scheduled' || item.status === 'published';

  return (
    <Card className="overflow-hidden">
      {item.image_url && (
        <div className="aspect-square max-h-48 overflow-hidden">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="outline" className={config.color}>
            {Icon && <Icon className="h-3 w-3 mr-1" />}
            {config.label}
          </Badge>
          <Badge variant="outline" className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
        <CardTitle className="text-sm line-clamp-2">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-6 whitespace-pre-line">{item.content}</p>
        {(item as any).blog_post_url && (
          <a
            href={(item as any).blog_post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Ver post del blog
          </a>
        )}
        
        {/* Publish to Metricool button */}
        {onSchedule && !isAlreadyScheduled && (
          <Button 
            size="sm" 
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white"
            onClick={() => onSchedule(item.id)}
            disabled={isScheduling}
          >
            <Send className={`h-3 w-3 mr-1.5 ${isScheduling ? 'animate-pulse' : ''}`} />
            {isScheduling ? 'Publicando...' : 'Publicar en Metricool'}
          </Button>
        )}

        {isAlreadyScheduled && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {item.scheduled_for 
              ? `Programado: ${new Date(item.scheduled_for).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`
              : 'Programado en Metricool'
            }
          </div>
        )}

        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1">
            <Copy className="h-3 w-3 mr-1" /> Copiar
          </Button>
          <Button size="sm" variant="outline" onClick={() => onRegenerate(item)} disabled={isRegenerating}>
            <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)} className="text-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
