import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Sparkles, LogOut, Crown, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useIsMKProAdmin } from '@/hooks/useProfile';
import { useSites } from '@/hooks/useSites';
import { useAllArticlesSaas } from '@/hooks/useArticlesSaas';
import { SiteCard } from '@/components/saas/SiteCard';
import { toast } from 'sonner';

export default function SaasDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { isMKProAdmin } = useIsMKProAdmin();
  const { data: sites = [], isLoading: loadingSites } = useSites();
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: articles = [] } = useAllArticlesSaas(currentMonth, currentYear);

  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  const sitesLimit = profile?.sites_limit ?? 1;
  const canAddSite = sites.length < sitesLimit;
  const planLabel = profile?.plan === 'agency' ? 'Agency' : profile?.plan === 'pro' ? 'Pro' : 'Free';

  const getArticleCountForSite = (siteId: string) => {
    return articles.filter(a => a.site_id === siteId).length;
  };

  const handleGenerateArticle = async (siteId: string) => {
    setGeneratingId(siteId);
    // TODO: Implement generate-article-saas edge function
    toast.info('Generación de artículos SaaS próximamente');
    setTimeout(() => setGeneratingId(null), 1000);
  };

  const isLoading = loadingProfile || loadingSites;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Blooglee</h1>
                <p className="text-sm text-muted-foreground">Tu generador de contenido</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                {planLabel}
              </Badge>
              <Badge variant="secondary">
                {sites.length}/{sitesLimit} sitios
              </Badge>
              {isMKProAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/mkpro')}>
                  MKPro Admin
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Cerrar sesión">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Tus sitios</h2>
          <Button 
            onClick={() => navigate('/onboarding')} 
            disabled={!canAddSite}
            title={!canAddSite ? `Límite de ${sitesLimit} sitios alcanzado` : undefined}
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir sitio
          </Button>
        </div>

        {sites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No tienes sitios todavía</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer sitio para empezar a generar artículos automáticamente
              </p>
              <Button onClick={() => navigate('/onboarding')}>
                <Plus className="w-4 h-4 mr-2" />
                Crear mi primer sitio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sites.map(site => (
              <SiteCard
                key={site.id}
                site={site}
                articleCount={getArticleCountForSite(site.id)}
                hasWordPress={false} // TODO: Check wordpress_configs
                onGenerateArticle={() => handleGenerateArticle(site.id)}
                onViewArticles={() => toast.info('Vista de artículos próximamente')}
                onConfigureWordPress={() => toast.info('Configuración WP próximamente')}
                onEdit={() => toast.info('Edición de sitio próximamente')}
                onDelete={() => toast.info('Eliminación de sitio próximamente')}
                isGenerating={generatingId === site.id}
              />
            ))}
          </div>
        )}

        {!canAddSite && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Has alcanzado el límite de sitios</p>
                <p className="text-sm text-muted-foreground">
                  Actualiza a Pro para gestionar hasta 5 sitios
                </p>
              </div>
              <Button variant="default">
                <Crown className="w-4 h-4 mr-2" />
                Actualizar plan
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
