import { Copy, Trash2, RefreshCw, Instagram, Linkedin, Facebook } from 'lucide-react';
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

interface Props {
  item: SocialContent;
  onDelete: (id: string) => void;
  onRegenerate: (item: SocialContent) => void;
  isRegenerating?: boolean;
}

export function SocialContentCard({ item, onDelete, onRegenerate, isRegenerating }: Props) {
  const { toast } = useToast();
  const config = platformConfig[item.platform] || platformConfig.tiktok;
  const Icon = config.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.content);
    toast({ title: 'Copiado al portapapeles' });
  };

  return (
    <Card className="overflow-hidden">
      {item.image_url && (
        <div className="aspect-square max-h-48 overflow-hidden">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={config.color}>
            {Icon && <Icon className="h-3 w-3 mr-1" />}
            {config.label}
          </Badge>
          <Badge variant="secondary" className="text-xs">{item.content_type}</Badge>
        </div>
        <CardTitle className="text-sm line-clamp-2">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-6 whitespace-pre-line">{item.content}</p>
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
