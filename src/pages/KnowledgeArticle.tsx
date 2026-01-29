import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, HelpCircle, MessageSquare, ExternalLink, Copy, Check, Loader2 } from 'lucide-react';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { useKnowledgeArticle } from '@/hooks/useKnowledgeBase';
import { useState } from 'react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const CATEGORY_LABELS: Record<string, string> = {
  seguridad: 'Seguridad',
  multiidioma: 'Multiidioma',
  permisos: 'Permisos',
  cache: 'Caché',
  hosting: 'Hosting',
  seo: 'SEO',
  temas: 'Temas',
  api_rest: 'API REST',
  medios: 'Medios',
  ssl: 'SSL',
  performance: 'Rendimiento',
  core: 'WordPress Core',
  database: 'Base de datos',
  contenido: 'Contenido',
  taxonomias: 'Taxonomías',
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  alta: { bg: 'bg-red-100', text: 'text-red-700', label: 'Prioridad Alta' },
  media: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Prioridad Media' },
  baja: { bg: 'bg-green-100', text: 'text-green-700', label: 'Prioridad Baja' },
};

export default function KnowledgeArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: article, isLoading, error } = useKnowledgeArticle(slug);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!article?.snippet_code) return;
    try {
      await navigator.clipboard.writeText(article.snippet_code);
      setCodeCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error('Error al copiar el código');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/help')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <BloogleeLogo size="md" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Artículo no encontrado</h1>
          <p className="text-muted-foreground mb-6">
            El artículo que buscas no existe o ha sido movido.
          </p>
          <Button onClick={() => navigate('/help')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Centro de Ayuda
          </Button>
        </main>
      </div>
    );
  }

  const priorityStyle = PRIORITY_STYLES[article.priority] || PRIORITY_STYLES.media;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/help')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <BloogleeLogo size="md" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/help" className="hover:text-primary">Centro de Ayuda</Link>
          <span>/</span>
          <span>{CATEGORY_LABELS[article.category] || article.category}</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="secondary">
            {CATEGORY_LABELS[article.category] || article.category}
          </Badge>
          <Badge className={`${priorityStyle.bg} ${priorityStyle.text} hover:${priorityStyle.bg}`}>
            {priorityStyle.label}
          </Badge>
          {article.related_plugins.map(plugin => (
            <Badge key={plugin} variant="outline">
              {plugin}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6">{article.title}</h1>

        {/* Symptoms */}
        {article.symptoms.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Síntomas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {article.symptoms.map((symptom, index) => (
                  <li key={index}>{symptom}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Cause */}
        {article.cause && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Causa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{article.cause}</p>
            </CardContent>
          </Card>
        )}

        {/* Solution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Solución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{article.solution}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Code snippet */}
        {article.snippet_code && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Código</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopyCode}>
                  {codeCopied ? (
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
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                <code>{article.snippet_code}</code>
              </pre>
            </CardContent>
          </Card>
        )}

        {/* External help link */}
        {article.help_url && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <a
                href={article.help_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Ver tutorial externo
              </a>
            </CardContent>
          </Card>
        )}

        {/* Still need help */}
        <Card className="bg-muted/50">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              ¿Sigue sin funcionar? Nuestro asistente puede ayudarte.
            </p>
            <Button>
              <MessageSquare className="w-4 h-4 mr-2" />
              Hablar con Bloobot
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
