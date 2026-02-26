import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ArrowLeft,
  Globe,
  MapPin,
  Loader2,
  Sparkles,
  Link2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  History,
} from "lucide-react";
import { useSites } from "@/hooks/useSites";
import { useArticlesSaas, useGenerateArticleSaas } from "@/hooks/useArticlesSaas";
import { useWordPressConfig } from "@/hooks/useWordPressConfigSaas";
import { BloogleeLogo } from "@/components/saas/BloogleeLogo";
import { SiteArticles } from "@/components/saas/SiteArticles";
import { SiteSettings } from "@/components/saas/SiteSettings";
import { SiteActivityLog } from "@/components/saas/SiteActivityLog";
import { WordPressConfigForm } from "@/components/saas/WordPressConfigForm";

import { toast } from "sonner";
import { useGeneration } from "@/contexts/GenerationContext";

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "articles";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const { data: sites = [], isLoading: loadingSites } = useSites();
  const site = sites.find((s) => s.id === id);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: articles = [] } = useArticlesSaas(id, currentMonth, currentYear);
  const { data: wpConfig } = useWordPressConfig(id);

  const generateMutation = useGenerateArticleSaas();
  const { isGenerating: checkGenerating } = useGeneration();

  const canGenerate = !!wpConfig;
  const isGenerating = site ? checkGenerating(site.id) : false;

  const hasPublishedArticle = articles.some((a) => !!a.wp_post_url);

  const handleGenerateArticle = () => {
    if (!site) return;
    if (!canGenerate) {
      toast.info("Configura WordPress primero para generar artículos");
      setActiveTab("wordpress");
      return;
    }
    if (hasPublishedArticle) {
      toast.info("Ya tienes un artículo publicado para este periodo");
      return;
    }
    generateMutation.mutate({ siteId: site.id });
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
        <Button onClick={() => navigate("/dashboard")}>Volver al dashboard</Button>
      </div>
    );
  }

  // WP status indicator
  const renderWpStatus = () => {
    if (wpConfig) {
      return (
        <Badge
          variant="outline"
          className="text-emerald-600 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          WordPress conectado
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-amber-600 border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
        onClick={() => setActiveTab("wordpress")}
      >
        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
        Sin WordPress
        <span className="ml-1.5 text-[11px] opacity-70">Conectar →</span>
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <BloogleeLogo size="md" />
            </div>

            <div className="flex items-center gap-3">
              {renderWpStatus()}

              {hasPublishedArticle ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 px-3 py-1.5">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Publicado este periodo</span>
                  <span className="sm:hidden">Publicado</span>
                </Badge>
              ) : (
                <Button
                  onClick={handleGenerateArticle}
                  disabled={isGenerating}
                  className={
                    canGenerate
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                      : "border-amber-500/50 text-amber-700 hover:bg-amber-50"
                  }
                  variant={canGenerate ? "default" : "outline"}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
                  ) : canGenerate ? (
                    <Sparkles className="w-4 h-4 sm:mr-2" />
                  ) : (
                    <Lock className="w-4 h-4 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">
                    {isGenerating ? "Generando..." : canGenerate ? "Generar artículo" : "Configura WP primero"}
                  </span>
                  <span className="sm:hidden">{isGenerating ? "" : canGenerate ? "Generar" : "WP"}</span>
                </Button>
              )}
            </div>
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
            </div>
          </div>
          <p className="text-muted-foreground">{articles.length} artículos generados este mes</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="articles">Artículos</TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <History className="w-3.5 h-3.5" />
              Actividad
            </TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
          </TabsList>

          <TabsContent value="articles">
            <SiteArticles
              siteId={site.id}
              siteName={site.name}
              siteSector={site.sector || undefined}
              onGenerateArticle={handleGenerateArticle}
              isGenerating={isGenerating}
            />
          </TabsContent>

          <TabsContent value="activity">
            <SiteActivityLog siteId={site.id} siteName={site.name} />
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettings site={site} />
          </TabsContent>

          <TabsContent value="wordpress">
            <WordPressConfigForm
              siteId={site.id}
              languages={site.languages}
              wordpressContext={site.wordpress_context as any}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
