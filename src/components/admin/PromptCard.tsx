import { Prompt } from '@/hooks/useAdminPrompts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onToggleActive: (prompt: Prompt, active: boolean) => void;
}

const categoryColors: Record<string, string> = {
  farmacias: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  empresas: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  saas: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  blog: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  soporte: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
};

export function PromptCard({ prompt, onEdit, onDelete, onToggleActive }: PromptCardProps) {
  const truncatedContent = prompt.content.length > 150 
    ? prompt.content.substring(0, 150) + '...' 
    : prompt.content;

  return (
    <Card className={`transition-all ${!prompt.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {prompt.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {prompt.key}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={prompt.is_active}
              onCheckedChange={(checked) => onToggleActive(prompt, checked)}
              aria-label={prompt.is_active ? 'Desactivar' : 'Activar'}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(prompt)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(prompt)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {prompt.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {prompt.description}
          </p>
        )}
        
        <div className="bg-muted/50 rounded-md p-3 mb-3">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
            {truncatedContent}
          </pre>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={categoryColors[prompt.category] || ''}>
            {prompt.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            v{prompt.version}
          </Badge>
          {prompt.variables && prompt.variables.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {prompt.variables.length} variables
            </Badge>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(prompt.updated_at), { 
              addSuffix: true, 
              locale: es 
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
