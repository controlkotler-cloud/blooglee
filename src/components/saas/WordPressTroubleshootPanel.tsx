import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, Shield, Globe, Key, MessageSquare, HelpCircle, Copy, Check, FileCode } from 'lucide-react';
import { CODE_SNIPPETS, getSnippetById } from '@/data/codeSnippets';
import { useChatWidget } from '@/components/saas/SupportChatWidget';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface TroubleshootButtonProps {
  icon: React.ElementType;
  title: string;
  description: string;
  snippetId: string;
  onOpen: (snippetId: string) => void;
}

function TroubleshootButton({ icon: Icon, title, description, snippetId, onOpen }: TroubleshootButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(snippetId)}
      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 transition-all text-left group"
    >
      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </button>
  );
}

interface SnippetDialogProps {
  snippetId: string | null;
  onClose: () => void;
}

function SnippetDialog({ snippetId, onClose }: SnippetDialogProps) {
  const [copied, setCopied] = useState(false);
  const snippet = snippetId ? getSnippetById(snippetId) : null;

  const handleCopy = async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  };

  if (!snippet) return null;

  return (
    <Dialog open={!!snippetId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-violet-500" />
            {snippet.title}
          </DialogTitle>
          <DialogDescription>{snippet.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Instrucciones */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold">?</span>
              Cómo usar
            </h4>
            <div className="text-sm text-muted-foreground whitespace-pre-line bg-muted/50 p-3 rounded-lg">
              {snippet.instructions}
            </div>
          </div>

          {/* Código */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold">&lt;/&gt;</span>
                Código
                {snippet.fileName && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {snippet.fileName}
                  </span>
                )}
              </h4>
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed">
              <code>{snippet.code}</code>
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WordPressTroubleshootPanel() {
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);
  const { openChat } = useChatWidget();
  const navigate = useNavigate();

  const troubleshootItems = [
    { icon: Shield, title: 'Wordfence bloquea', description: 'Añadir excepciones al firewall', snippetId: 'wordfence-whitelist' },
    { icon: Globe, title: 'Polylang/WPML', description: 'Soporte API para idiomas', snippetId: 'polylang-api-support' },
    { icon: Key, title: 'Sin contraseñas de app', description: 'Habilitar en wp-config.php', snippetId: 'force-app-passwords' },
    { icon: Shield, title: 'iThemes Security', description: 'Reactivar API REST', snippetId: 'ithemes-api-enable' },
  ];

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            ¿Problemas conectando WordPress?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Los plugins de seguridad pueden bloquear la conexión. Aquí tienes soluciones rápidas:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {troubleshootItems.map((item) => (
              <TroubleshootButton
                key={item.snippetId}
                icon={item.icon}
                title={item.title}
                description={item.description}
                snippetId={item.snippetId}
                onOpen={setSelectedSnippet}
              />
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-amber-200 dark:border-amber-800">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => openChat({ action: 'wordpress_connection' })}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Hablar con Bloobot
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/help')}
              className="gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Centro de ayuda
            </Button>
          </div>
        </CardContent>
      </Card>

      <SnippetDialog 
        snippetId={selectedSnippet} 
        onClose={() => setSelectedSnippet(null)} 
      />
    </>
  );
}
