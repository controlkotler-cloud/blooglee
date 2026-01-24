import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft, Globe, MapPin, Loader2, Sparkles, Link2 } from 'lucide-react';
import { useSites } from '@/hooks/useSites';
import { useArticlesSaas } from '@/hooks/useArticlesSaas';
import { useWordPressConfig } from '@/hooks/useWordPressConfigSaas';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { SiteArticles } from '@/components/saas/SiteArticles';
import { SiteSettings } from '@/components/saas/SiteSettings';
import { WordPressConfigForm } from '@/components/saas/WordPressConfigForm';
import { toast } from 'sonner';

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('articles');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: sites = [], isLoading: loadingSites } = useSites();
  const site = sites.find((s) => s.id === id);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: articles = [] } = useArticlesSaas(id, currentMonth, currentYear);
  const { data: wpConfig } = useWordPressConfig(id);

  const handleGenerateArticle = async () => {
    setIsGenerating(true);
    // TODO: Implement generate-article-saas edge function
    toast.info('Generación de artículos SaaS próximamente');
    setTimeout(() => setIsGenerating(false), 1000);
  };

  if (loadingSites) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Sitio no encontrado</p>
        <Button onClick={() => navigate('/dashboard')}>Volver al dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <BloogleeLogo size="md" />
            </div>

            <Button onClick={handleGenerateArticle} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generar artículo
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{site.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Site header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{site.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {site.sector && (
                <Badge variant="secondary">
                  <Globe className="w-3 h-3 mr-1" />
                  {site.sector}
                </Badge>
              )}
              {site.location && (
                <Badge variant="outline">
                  <MapPin className="w-3 h-3 mr-1" />
                  {site.location}
                </Badge>
              )}
              {wpConfig && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                  <Link2 className="w-3 h-3 mr-1" />
                  WordPress
                </Badge>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">
            {articles.length} artículos generados este mes
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="articles">Artículos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
          </TabsList>

          <TabsContent value="articles">
            <SiteArticles
              siteId={site.id}
              onGenerateArticle={handleGenerateArticle}
              isGenerating={isGenerating}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettings site={site} />
          </TabsContent>

          <TabsContent value="wordpress">
            <WordPressConfigForm siteId={site.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
