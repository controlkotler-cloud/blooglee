import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Plus, LogOut, Globe, User, CreditCard, HelpCircle, Settings, ArrowLeftRight, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useIsMKProAdmin, useIsSuperAdmin } from '@/hooks/useProfile';
import { useSites } from '@/hooks/useSites';
import { useAllArticlesSaas, useGenerateArticleSaas } from '@/hooks/useArticlesSaas';
import { useAllArticlesForUser } from '@/hooks/useAllArticlesForUser';
import { useWordPressConfigsBatch } from '@/hooks/useWordPressConfigSaas';
import { useChecklist } from '@/hooks/useChecklist';
import { SiteCard } from '@/components/saas/SiteCard';
import { SitesToolbar, type ViewMode, type SortOption, type FilterOption } from '@/components/saas/SitesToolbar';
import { SitesTableView } from '@/components/saas/SitesTableView';
import { AgencyStatsBanner } from '@/components/saas/AgencyStatsBanner';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { PlanBadge, type PlanType } from '@/components/saas/PlanBadge';

import { SetupChecklist } from '@/components/setup/SetupChecklist';
import { toast } from 'sonner';
import { useGeneration } from '@/contexts/GenerationContext';

const VIEW_MODE_KEY = 'blooglee-view-mode';

export default function SaasDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { canAccessMKPro } = useIsMKProAdmin();
  const { isSuperAdmin } = useIsSuperAdmin();
  const { data: sites = [], isLoading: loadingSites } = useSites();
  const { isGenerating } = useGeneration();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: monthArticles = [] } = useAllArticlesSaas(currentMonth, currentYear);
  const { data: allArticles = [] } = useAllArticlesForUser();

  const siteIds = sites.map(s => s.id);
  const { data: wpConfigsMap = {} } = useWordPressConfigsBatch(siteIds);

  const firstSiteId = sites[0]?.id;
  const { isChecklistComplete, checklistItems, isLoading: loadingChecklist } = useChecklist(firstSiteId);
  const showChecklist = sites.length > 0 && checklistItems.length > 0 && !isChecklistComplete;

  const generateMutation = useGenerateArticleSaas();
  

  const sitesLimit = profile?.sites_limit ?? 1;
  const isAdmin = isSuperAdmin || canAccessMKPro;
  const canAddSite = isAdmin || sites.length < sitesLimit;
  const plan = (profile?.plan || 'free') as PlanType;

  // Toolbar state
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    if (saved === 'cards' || saved === 'table') return saved;
    return sites.length > 6 ? 'table' : 'cards';
  });

  // Update default view when sites load
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    if (!saved) {
      setViewMode(sites.length > 6 ? 'table' : 'cards');
    }
  }, [sites.length]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  // Compute per-site data
  const siteDataMap = useMemo(() => {
    const map: Record<string, { articleCount: number; lastArticleDate: string | null }> = {};
    for (const site of sites) {
      const siteArticles = allArticles.filter(a => a.site_id === site.id);
      map[site.id] = {
        articleCount: siteArticles.length,
        lastArticleDate: siteArticles.length > 0 ? siteArticles[0].generated_at : null,
      };
    }
    return map;
  }, [sites, allArticles]);

  // Filter counts
  const filterCounts = useMemo(() => ({
    noWp: sites.filter(s => !wpConfigsMap[s.id]).length,
    wpConnected: sites.filter(s => !!wpConfigsMap[s.id]).length,
    noArticles: sites.filter(s => (siteDataMap[s.id]?.articleCount ?? 0) === 0).length,
  }), [sites, wpConfigsMap, siteDataMap]);

  // Sites needing attention: no WP, 0 articles, or no activity in 2+ weeks
  const sitesNeedingAttention = useMemo(() => {
    return sites.filter(s => {
      if (!wpConfigsMap[s.id]) return true;
      const data = siteDataMap[s.id];
      if (!data || data.articleCount === 0) return true;
      if (data.lastArticleDate) {
        const diffMs = Date.now() - new Date(data.lastArticleDate).getTime();
        if (diffMs > 14 * 24 * 60 * 60 * 1000) return true;
      }
      return false;
    }).length;
  }, [sites, wpConfigsMap, siteDataMap]);

  // Apply search + filter + sort
  const filteredSites = useMemo(() => {
    let result = [...sites];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.sector || '').toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q)
      );
    }

    // Filter
    switch (activeFilter) {
      case 'no-wp':
        result = result.filter(s => !wpConfigsMap[s.id]);
        break;
      case 'wp-connected':
        result = result.filter(s => !!wpConfigsMap[s.id]);
        break;
      case 'no-articles':
        result = result.filter(s => (siteDataMap[s.id]?.articleCount ?? 0) === 0);
        break;
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'activity': {
          const dateA = siteDataMap[a.id]?.lastArticleDate;
          const dateB = siteDataMap[b.id]?.lastArticleDate;
          return (dateB ? new Date(dateB).getTime() : 0) - (dateA ? new Date(dateA).getTime() : 0);
        }
        case 'articles':
          return (siteDataMap[b.id]?.articleCount ?? 0) - (siteDataMap[a.id]?.articleCount ?? 0);
        case 'wordpress':
          return (wpConfigsMap[a.id] ? 1 : 0) - (wpConfigsMap[b.id] ? 1 : 0);
        default:
          return 0;
      }
    });

    return result;
  }, [sites, search, activeFilter, sortOption, wpConfigsMap, siteDataMap]);

  const handleGenerateArticle = (siteId: string) => {
    generateMutation.mutate({ siteId });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isLoading = loadingProfile || loadingSites || loadingChecklist;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Grid class based on site count
  const getGridClass = () => {
    const count = filteredSites.length;
    if (count === 1) return 'max-w-[500px] mx-auto';
    if (count === 2) return 'grid gap-4 grid-cols-1 sm:grid-cols-2 max-w-[1024px] mx-auto';
    return 'grid gap-4 md:grid-cols-2 lg:grid-cols-3';
  };

  // Table row data
  const tableData = filteredSites.map(site => ({
    site,
    articleCount: siteDataMap[site.id]?.articleCount ?? 0,
    wpConfig: wpConfigsMap[site.id] || null,
    lastArticleDate: siteDataMap[site.id]?.lastArticleDate ?? null,
    needsAttention: !wpConfigsMap[site.id] ||
      (siteDataMap[site.id]?.articleCount ?? 0) === 0 ||
      (siteDataMap[site.id]?.lastArticleDate
        ? Date.now() - new Date(siteDataMap[site.id].lastArticleDate!).getTime() > 14 * 24 * 60 * 60 * 1000
        : true),
  }));

  const articlesThisMonth = monthArticles.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div data-tour="welcome">
              <BloogleeLogo size="lg" />
            </div>
            <div className="flex items-center gap-3">
              {canAccessMKPro && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/mkpro')}
                  className="gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span className="hidden sm:inline">MKPro</span>
                </Button>
              )}
              <PlanBadge plan={plan} />
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {sites.length}/{sitesLimit} sitios
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <User className="w-4 h-4 mr-2" />
                    Mi cuenta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/billing')}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Facturación
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/help')}>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Ayuda
                  </DropdownMenuItem>
                  {canAccessMKPro && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/mkpro')}>
                        MKPro Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  {isSuperAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Panel Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {showChecklist ? (
          <SetupChecklist site={sites[0]} />
        ) : (
          <>
            {/* Title + Add button */}
            <div className="flex items-center justify-between mb-4">
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
              /* Empty state - no sites */
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Crea tu primer sitio</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Añade tu negocio para empezar a generar artículos con IA.
                </p>
                <Button size="lg" onClick={() => navigate('/onboarding')}>
                  <Plus className="w-5 h-5 mr-2" />
                  Añadir sitio
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Agency stats banner */}
                <AgencyStatsBanner
                  totalSites={sites.length}
                  wpConnected={filterCounts.wpConnected}
                  wpDisconnected={filterCounts.noWp}
                  articlesThisMonth={articlesThisMonth}
                  sitesNeedingAttention={sitesNeedingAttention}
                  onFilterClick={setActiveFilter}
                />

                {/* Toolbar */}
                <SitesToolbar
                  search={search}
                  onSearchChange={setSearch}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  sortOption={sortOption}
                  onSortChange={setSortOption}
                  filterCounts={filterCounts}
                  totalSites={sites.length}
                />

                {/* No results from filter */}
                {filteredSites.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <p className="text-muted-foreground mb-3">No hay sitios que coincidan con tu búsqueda o filtro.</p>
                    <Button
                      variant="outline"
                      onClick={() => { setSearch(''); setActiveFilter('all'); }}
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                ) : viewMode === 'table' ? (
                  /* Table view */
                  <SitesTableView
                    sites={tableData}
                    onGenerateArticle={handleGenerateArticle}
                    onViewArticles={(id) => navigate(`/site/${id}`)}
                    onEditSite={(id) => navigate(`/site/${id}?tab=settings`)}
                    isGenerating={isGenerating}
                  />
                ) : (
                  /* Cards view */
                  <div className={filteredSites.length <= 2 ? '' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
                    {filteredSites.length === 1 ? (
                      <div className="max-w-[500px] mx-auto">
                        <SiteCard
                          site={filteredSites[0]}
                          articleCount={siteDataMap[filteredSites[0].id]?.articleCount ?? 0}
                          hasWordPress={!!wpConfigsMap[filteredSites[0].id]}
                          wpSiteUrl={wpConfigsMap[filteredSites[0].id]?.site_url}
                          lastArticleDate={siteDataMap[filteredSites[0].id]?.lastArticleDate}
                          onGenerateArticle={() => handleGenerateArticle(filteredSites[0].id)}
                          onViewArticles={() => navigate(`/site/${filteredSites[0].id}`)}
                          onConfigureWordPress={() => navigate(`/site/${filteredSites[0].id}?tab=wordpress`)}
                          onEdit={() => navigate(`/site/${filteredSites[0].id}?tab=settings`)}
                          onDelete={() => toast.info('Usa la configuración del sitio para eliminarlo')}
                          isGenerating={isGenerating(filteredSites[0].id)}
                          isFirstSite={true}
                        />
                      </div>
                    ) : filteredSites.length === 2 ? (
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 max-w-[1024px] mx-auto">
                        {filteredSites.map((site, index) => (
                          <SiteCard
                            key={site.id}
                            site={site}
                            articleCount={siteDataMap[site.id]?.articleCount ?? 0}
                            hasWordPress={!!wpConfigsMap[site.id]}
                            wpSiteUrl={wpConfigsMap[site.id]?.site_url}
                            lastArticleDate={siteDataMap[site.id]?.lastArticleDate}
                            onGenerateArticle={() => handleGenerateArticle(site.id)}
                            onViewArticles={() => navigate(`/site/${site.id}`)}
                            onConfigureWordPress={() => navigate(`/site/${site.id}?tab=wordpress`)}
                            onEdit={() => navigate(`/site/${site.id}?tab=settings`)}
                            onDelete={() => toast.info('Usa la configuración del sitio para eliminarlo')}
                            isGenerating={isGenerating(site.id)}
                            isFirstSite={index === 0}
                          />
                        ))}
                      </div>
                    ) : (
                      filteredSites.map((site, index) => (
                        <SiteCard
                          key={site.id}
                          site={site}
                          articleCount={siteDataMap[site.id]?.articleCount ?? 0}
                          hasWordPress={!!wpConfigsMap[site.id]}
                          wpSiteUrl={wpConfigsMap[site.id]?.site_url}
                          lastArticleDate={siteDataMap[site.id]?.lastArticleDate}
                          onGenerateArticle={() => handleGenerateArticle(site.id)}
                          onViewArticles={() => navigate(`/site/${site.id}`)}
                          onConfigureWordPress={() => navigate(`/site/${site.id}?tab=wordpress`)}
                          onEdit={() => navigate(`/site/${site.id}?tab=settings`)}
                          onDelete={() => toast.info('Usa la configuración del sitio para eliminarlo')}
                          isGenerating={isGenerating(site.id)}
                          isFirstSite={index === 0}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {!canAddSite && (
              <Card className="mt-6 border-primary/20 bg-primary/5">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Has alcanzado el límite de sitios</p>
                    <p className="text-sm text-muted-foreground">
                      Actualiza tu plan para gestionar más sitios
                    </p>
                  </div>
                  <Button variant="default" onClick={() => navigate('/billing')}>
                    Actualizar plan
                  </Button>
                </CardContent>
              </Card>
            )}

          </>
        )}
      </main>
    </div>
  );
}
