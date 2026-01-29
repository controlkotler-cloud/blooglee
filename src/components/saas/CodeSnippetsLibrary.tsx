import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Copy, Check, Code2, Globe, Shield, User } from 'lucide-react';
import { CODE_SNIPPETS, CodeSnippet } from '@/data/codeSnippets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORY_INFO: Record<string, { label: string; icon: typeof Globe }> = {
  multiidioma: { label: 'Multiidioma', icon: Globe },
  seguridad: { label: 'Seguridad', icon: Shield },
  permisos: { label: 'Permisos', icon: User },
  general: { label: 'General', icon: Code2 },
};

function SnippetCard({ snippet }: { snippet: CodeSnippet }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const categoryInfo = CATEGORY_INFO[snippet.category] || CATEGORY_INFO.general;
  const CategoryIcon = categoryInfo.icon;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Error al copiar el código');
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CategoryIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{snippet.title}</CardTitle>
                  <CardDescription className="mt-1">{snippet.description}</CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {categoryInfo.label}
                    </Badge>
                    {snippet.plugin && (
                      <Badge variant="outline" className="text-xs">
                        {snippet.plugin}
                      </Badge>
                    )}
                    {snippet.fileName && (
                      <span className="text-xs text-muted-foreground">
                        → {snippet.fileName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Instrucciones:</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {snippet.instructions}
              </div>
            </div>

            {/* Code block */}
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                <code>{snippet.code}</code>
              </pre>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface CodeSnippetsLibraryProps {
  filterCategory?: string;
  filterPlugin?: string;
}

export function CodeSnippetsLibrary({ filterCategory, filterPlugin }: CodeSnippetsLibraryProps) {
  let snippets = CODE_SNIPPETS;

  if (filterCategory) {
    snippets = snippets.filter(s => s.category === filterCategory);
  }

  if (filterPlugin) {
    snippets = snippets.filter(s => s.plugin === filterPlugin);
  }

  if (snippets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay snippets disponibles para este filtro.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {snippets.map(snippet => (
        <SnippetCard key={snippet.id} snippet={snippet} />
      ))}
    </div>
  );
}
