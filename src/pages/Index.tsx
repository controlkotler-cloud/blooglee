import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Play, LayoutDashboard, Building2, Briefcase, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFarmacias, useCreateFarmacia, useUpdateFarmacia, useDeleteFarmacia, type Farmacia } from "@/hooks/useFarmacias";
import { useArticulos, useGenerateArticle, useRegenerateImage, getUsedImageUrls, type Articulo } from "@/hooks/useArticulos";
import { useEmpresas, useCreateEmpresa, useUpdateEmpresa, useDeleteEmpresa, type Empresa } from "@/hooks/useEmpresas";
import { useArticulosEmpresas, useGenerateArticleEmpresa, useRegenerateImageEmpresa, getUsedImageUrlsEmpresas, type ArticuloEmpresa } from "@/hooks/useArticulosEmpresas";
import { useWordPressSites } from "@/hooks/useWordPressSites";
import { useWordPressSitesEmpresas } from "@/hooks/useWordPressSitesEmpresas";
import { getAssignedTopic, MONTH_NAMES } from "@/lib/seasonalTopics";
import { Dashboard } from "@/components/pharmacy/Dashboard";
import { PharmacyCard } from "@/components/pharmacy/PharmacyCard";
import { PharmacyForm } from "@/components/pharmacy/PharmacyForm";
import { ArticlePreview } from "@/components/pharmacy/ArticlePreview";
import { ImportExport } from "@/components/pharmacy/ImportExport";
import { CompanyCard } from "@/components/company/CompanyCard";
import { CompanyForm } from "@/components/company/CompanyForm";
import { CompanyArticlePreview } from "@/components/company/CompanyArticlePreview";
import { CompanyImportExport } from "@/components/company/CompanyImportExport";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];

export default function Index() {
  const { signOut } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Pharmacy state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Farmacia | null>(null);
  const [deletingPharmacy, setDeletingPharmacy] = useState<Farmacia | null>(null);
  const [previewArticle, setPreviewArticle] = useState<{ article: Articulo; pharmacyName: string; pharmacyIndex: number; pharmacy: Farmacia } | null>(null);
  
  // Company state
  const [showAddCompanyForm, setShowAddCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Empresa | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Empresa | null>(null);
  const [previewCompanyArticle, setPreviewCompanyArticle] = useState<{ article: ArticuloEmpresa; companyName: string; company: Empresa } | null>(null);
  
  // Shared state
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentRetry, setCurrentRetry] = useState(0);
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  // Pharmacy data
  const { data: farmacias = [], isLoading: loadingFarmacias } = useFarmacias();
  const { data: articulos = [], isLoading: loadingArticulos } = useArticulos(selectedMonth, selectedYear);
  const createFarmacia = useCreateFarmacia();
  const updateFarmacia = useUpdateFarmacia();
  const deleteFarmacia = useDeleteFarmacia();
  const generateArticle = useGenerateArticle();
  const regenerateImage = useRegenerateImage();
  const { data: wpSites = [] } = useWordPressSites();

  // Company data
  const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();
  const { data: articulosEmpresas = [], isLoading: loadingArticulosEmpresas } = useArticulosEmpresas(selectedMonth, selectedYear);
  const createEmpresa = useCreateEmpresa();
  const updateEmpresa = useUpdateEmpresa();
  const deleteEmpresa = useDeleteEmpresa();
  const generateArticleEmpresa = useGenerateArticleEmpresa();
  const regenerateImageEmpresa = useRegenerateImageEmpresa();
  const { data: wpSitesEmpresas = [] } = useWordPressSitesEmpresas();

  const hasWordPress = (pharmacyId: string) => wpSites.some(wp => wp.farmacia_id === pharmacyId);
  const hasWordPressEmpresa = (empresaId: string) => wpSitesEmpresas.some(wp => wp.empresa_id === empresaId);

  const getArticleForPharmacy = (pharmacyId: string) => articulos.find((a) => a.farmacia_id === pharmacyId) || null;
  const getArticleForCompany = (empresaId: string) => articulosEmpresas.find((a) => a.empresa_id === empresaId) || null;

  // Pharmacy handlers
  const handleCreateFarmacia = (data: { name: string; location: string; languages: string[]; blog_url?: string; instagram_url?: string; auto_generate?: boolean; custom_topic?: string | null }) => {
    createFarmacia.mutate(data, { onSuccess: () => setShowAddForm(false) });
  };

  const handleUpdateFarmacia = (data: { name: string; location: string; languages: string[]; blog_url?: string; instagram_url?: string; auto_generate?: boolean; custom_topic?: string | null }) => {
    if (!editingPharmacy) return;
    updateFarmacia.mutate({ id: editingPharmacy.id, ...data }, { onSuccess: () => setEditingPharmacy(null) });
  };

  const handleDeleteFarmacia = () => {
    if (!deletingPharmacy) return;
    deleteFarmacia.mutate(deletingPharmacy.id, { onSuccess: () => setDeletingPharmacy(null) });
  };

  const handleGenerateArticle = async (pharmacy: Farmacia, index: number, usedImageUrls?: string[]) => {
    const topic = pharmacy.custom_topic && !pharmacy.auto_generate
      ? { tema: pharmacy.custom_topic, keywords: [], pexels_query: "pharmacy health wellness" }
      : getAssignedTopic(index, selectedMonth, pharmacy.id);
    setGeneratingId(pharmacy.id);
    setCurrentRetry(0);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await generateArticle.mutateAsync({
          farmaciaId: pharmacy.id,
          pharmacyName: pharmacy.name,
          pharmacyLocation: pharmacy.location,
          pharmacyLanguages: pharmacy.languages,
          pharmacyBlogUrl: pharmacy.blog_url || undefined,
          pharmacyInstagramUrl: pharmacy.instagram_url || undefined,
          topic,
          month: selectedMonth,
          year: selectedYear,
          usedImageUrls,
        });
        setGeneratingId(null);
        setCurrentRetry(0);
        return true;
      } catch (error) {
        console.error(`Intento ${attempt + 1}/${MAX_RETRIES + 1} fallido para ${pharmacy.name}:`, error);
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt];
          setCurrentRetry(attempt + 1);
          toast.info(`Reintentando ${pharmacy.name} (${attempt + 1}/${MAX_RETRIES})...`, { duration: delay });
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          toast.error(`Error generando artículo para ${pharmacy.name} después de ${MAX_RETRIES} reintentos`);
          setGeneratingId(null);
          setCurrentRetry(0);
          return false;
        }
      }
    }
    return false;
  };

  const handleGenerateAll = async () => {
    const pending = farmacias.filter((p) => p.auto_generate && !getArticleForPharmacy(p.id));
    if (pending.length === 0) {
      toast.info("Todos los artículos ya están generados");
      return;
    }
    setGeneratingAll(true);
    setGenerationProgress(0);
    let usedImageUrls = await getUsedImageUrls(selectedMonth, selectedYear);
    let successCount = 0;

    for (let i = 0; i < pending.length; i++) {
      const pharmacy = pending[i];
      const pharmacyIndex = farmacias.findIndex((p) => p.id === pharmacy.id);
      setGeneratingId(pharmacy.id);
      setGenerationProgress(Math.round(((i + 1) / pending.length) * 100));
      const success = await handleGenerateArticle(pharmacy, pharmacyIndex, usedImageUrls);
      if (success) {
        successCount++;
        usedImageUrls = await getUsedImageUrls(selectedMonth, selectedYear);
      }
      if (i < pending.length - 1) await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    setGeneratingAll(false);
    setGeneratingId(null);
    setGenerationProgress(0);
    toast.success(`🎉 Se han generado ${successCount} artículos correctamente`);
  };

  // Company handlers
  const handleCreateEmpresa = (data: { name: string; location: string; sector?: string | null; languages: string[]; blog_url?: string; instagram_url?: string; auto_generate?: boolean; custom_topic?: string | null }) => {
    createEmpresa.mutate(data, { onSuccess: () => setShowAddCompanyForm(false) });
  };

  const handleUpdateEmpresa = (data: { name: string; location?: string | null; sector?: string | null; languages: string[]; blog_url?: string; instagram_url?: string; auto_generate?: boolean; custom_topic?: string | null; include_featured_image?: boolean; publish_frequency?: string; geographic_scope?: string }) => {
    if (!editingCompany) return;
    updateEmpresa.mutate({ id: editingCompany.id, ...data }, { onSuccess: () => setEditingCompany(null) });
  };

  const handleDeleteEmpresa = () => {
    if (!deletingCompany) return;
    deleteEmpresa.mutate(deletingCompany.id, { onSuccess: () => setDeletingCompany(null) });
  };

  const handleGenerateArticleEmpresa = async (company: Empresa, usedImageUrls?: string[]) => {
    setGeneratingId(company.id);
    try {
      await generateArticleEmpresa.mutateAsync({
        empresaId: company.id,
        companyName: company.name,
        companyLocation: company.location,
        companySector: company.sector,
        companyLanguages: company.languages,
        companyBlogUrl: company.blog_url || undefined,
        companyInstagramUrl: company.instagram_url || undefined,
        companyGeographicScope: company.geographic_scope || "local",
        companyIncludeFeaturedImage: company.include_featured_image !== false,
        topic: company.custom_topic || undefined, // If null/undefined, AI will generate
        month: selectedMonth,
        year: selectedYear,
        usedImageUrls,
      });
    } catch (error) {
      console.error(`Error generating article for ${company.name}:`, error);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateAllEmpresas = async () => {
    const pending = empresas.filter((e) => e.auto_generate && !getArticleForCompany(e.id));
    if (pending.length === 0) {
      toast.info("Todos los artículos de empresas ya están generados");
      return;
    }
    setGeneratingAll(true);
    setGenerationProgress(0);
    let usedImageUrls = await getUsedImageUrlsEmpresas(selectedMonth, selectedYear);
    let successCount = 0;

    for (let i = 0; i < pending.length; i++) {
      const company = pending[i];
      setGeneratingId(company.id);
      setGenerationProgress(Math.round(((i + 1) / pending.length) * 100));
      try {
        await handleGenerateArticleEmpresa(company, usedImageUrls);
        successCount++;
        usedImageUrls = await getUsedImageUrlsEmpresas(selectedMonth, selectedYear);
      } catch (error) {
        console.error(`Error generating for ${company.name}:`, error);
      }
      if (i < pending.length - 1) await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    setGeneratingAll(false);
    setGeneratingId(null);
    setGenerationProgress(0);
    toast.success(`🎉 Se han generado ${successCount} artículos de empresas`);
  };

  const handleImportFarmacias = async (newFarmacias: { name: string; location: string; languages: string[] }[]) => {
    for (const farmacia of newFarmacias) {
      await createFarmacia.mutateAsync({ ...farmacia, blog_url: null, instagram_url: null });
    }
  };

  const handleImportEmpresas = async (newEmpresas: {
    name: string;
    location: string;
    sector?: string | null;
    languages: string[];
    blog_url?: string | null;
    instagram_url?: string | null;
    auto_generate?: boolean;
    custom_topic?: string | null;
  }[]) => {
    for (const empresa of newEmpresas) {
      await createEmpresa.mutateAsync(empresa);
    }
  };

  const pendingCount = farmacias.filter(p => p.auto_generate && !getArticleForPharmacy(p.id)).length;
  const pendingEmpresasCount = empresas.filter(e => e.auto_generate && !getArticleForCompany(e.id)).length;
  const isLoading = loadingFarmacias || loadingArticulos || loadingEmpresas || loadingArticulosEmpresas;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">PharmaBlog Manager</h1>
              <p className="text-sm text-muted-foreground">Generador automático de artículos</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, i) => (<SelectItem key={i} value={String(i + 1)}>{name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((year) => (<SelectItem key={year} value={String(year)}>{year}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Cerrar sesión">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {generatingAll && (
        <div className="border-b bg-primary/5 px-4 py-3">
          <div className="container mx-auto flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <Progress value={generationProgress} className="flex-1 h-2" />
            <span className="text-sm font-medium">{generationProgress}%{currentRetry > 0 && ` (reintento ${currentRetry}/${MAX_RETRIES})`}</span>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList>
              <TabsTrigger value="dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</TabsTrigger>
              <TabsTrigger value="farmacias"><Building2 className="w-4 h-4 mr-2" />Farmacias</TabsTrigger>
              <TabsTrigger value="empresas"><Briefcase className="w-4 h-4 mr-2" />Empresas</TabsTrigger>
              <TabsTrigger value="config"><Settings className="w-4 h-4 mr-2" />Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <Dashboard farmacias={farmacias} articulos={articulos} selectedMonth={selectedMonth} selectedYear={selectedYear} />
            </TabsContent>

            <TabsContent value="farmacias">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button onClick={() => setShowAddForm(true)} variant="outline"><Plus className="w-4 h-4 mr-2" />Añadir farmacia</Button>
                <Button onClick={handleGenerateAll} disabled={generatingAll || pendingCount === 0}>
                  {generatingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Generar todos ({pendingCount})
                </Button>
              </div>
              {farmacias.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No hay farmacias</h3>
                  <p className="text-muted-foreground mb-4">Añade tu primera farmacia para empezar</p>
                  <Button onClick={() => setShowAddForm(true)}><Plus className="w-4 h-4 mr-2" />Añadir farmacia</Button>
                </CardContent></Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {farmacias.map((pharmacy, index) => (
                    <PharmacyCard 
                      key={pharmacy.id} 
                      pharmacy={pharmacy} 
                      topic={getAssignedTopic(index, selectedMonth, pharmacy.id)} 
                      article={getArticleForPharmacy(pharmacy.id)} 
                      isGenerating={generatingId === pharmacy.id}
                      hasWordPress={hasWordPress(pharmacy.id)}
                      onGenerate={() => handleGenerateArticle(pharmacy, index)} 
                      onRegenerate={() => handleGenerateArticle(pharmacy, index)}
                      onPreview={() => { 
                        const article = getArticleForPharmacy(pharmacy.id); 
                        if (article) setPreviewArticle({ article, pharmacyName: pharmacy.name, pharmacyIndex: index, pharmacy }); 
                      }} 
                      onEdit={() => setEditingPharmacy(pharmacy)} 
                      onDelete={() => setDeletingPharmacy(pharmacy)} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="empresas">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button onClick={() => setShowAddCompanyForm(true)} variant="outline"><Plus className="w-4 h-4 mr-2" />Añadir empresa</Button>
                <Button onClick={handleGenerateAllEmpresas} disabled={generatingAll || pendingEmpresasCount === 0}>
                  {generatingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Generar todos ({pendingEmpresasCount})
                </Button>
              </div>
              {empresas.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No hay empresas</h3>
                  <p className="text-muted-foreground mb-4">Añade tu primera empresa para empezar</p>
                  <Button onClick={() => setShowAddCompanyForm(true)}><Plus className="w-4 h-4 mr-2" />Añadir empresa</Button>
                </CardContent></Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {empresas.map((company) => (
                    <CompanyCard 
                      key={company.id} 
                      company={company} 
                      article={getArticleForCompany(company.id)} 
                      isGenerating={generatingId === company.id}
                      hasWordPress={hasWordPressEmpresa(company.id)}
                      onGenerate={() => handleGenerateArticleEmpresa(company)} 
                      onRegenerate={() => handleGenerateArticleEmpresa(company)}
                      onPreview={() => { 
                        const article = getArticleForCompany(company.id); 
                        if (article) setPreviewCompanyArticle({ article, companyName: company.name, company }); 
                      }} 
                      onEdit={() => setEditingCompany(company)} 
                      onDelete={() => setDeletingCompany(company)} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="config">
              <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
                <ImportExport farmacias={farmacias} articulos={articulos} selectedMonth={selectedMonth} selectedYear={selectedYear} onImportFarmacias={handleImportFarmacias} />
                <CompanyImportExport empresas={empresas} articulos={articulosEmpresas} selectedMonth={selectedMonth} selectedYear={selectedYear} onImportEmpresas={handleImportEmpresas} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Pharmacy modals */}
      <PharmacyForm open={showAddForm} onClose={() => setShowAddForm(false)} onSubmit={handleCreateFarmacia} isLoading={createFarmacia.isPending} />
      <PharmacyForm open={!!editingPharmacy} onClose={() => setEditingPharmacy(null)} onSubmit={handleUpdateFarmacia} initialData={editingPharmacy} isLoading={updateFarmacia.isPending} />
      <ArticlePreview 
        article={previewArticle?.article || null} 
        pharmacyName={previewArticle?.pharmacyName || ""}
        farmaciaId={previewArticle?.pharmacy.id || ""}
        hasWordPress={previewArticle ? hasWordPress(previewArticle.pharmacy.id) : false}
        onClose={() => setPreviewArticle(null)}
        onRegenerate={previewArticle ? () => {
          handleGenerateArticle(previewArticle.pharmacy, previewArticle.pharmacyIndex);
          setPreviewArticle(null);
        } : undefined}
        isRegenerating={previewArticle ? generatingId === previewArticle.pharmacy.id : false}
        onRegenerateImage={previewArticle?.article ? async () => {
          if (!previewArticle?.article) return;
          setRegeneratingImageId(previewArticle.article.id);
          try {
            const pexelsQuery = previewArticle.article.pexels_query || getAssignedTopic(previewArticle.pharmacyIndex, selectedMonth, previewArticle.pharmacy.id).pexels_query;
            const articleTitle = previewArticle.article.content_spanish?.title || previewArticle.article.topic;
            const articleContent = previewArticle.article.content_spanish?.content || "";
            const updatedArticle = await regenerateImage.mutateAsync({ articleId: previewArticle.article.id, pexelsQuery, month: selectedMonth, year: selectedYear, articleTitle, articleContent });
            setPreviewArticle(prev => prev ? { ...prev, article: updatedArticle } : null);
          } finally {
            setRegeneratingImageId(null);
          }
        } : undefined}
        isRegeneratingImage={previewArticle?.article ? regeneratingImageId === previewArticle.article.id : false}
      />
      <AlertDialog open={!!deletingPharmacy} onOpenChange={(o) => !o && setDeletingPharmacy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar farmacia?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará permanentemente la farmacia "{deletingPharmacy?.name}" y todos sus artículos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFarmacia} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Company modals */}
      <CompanyForm open={showAddCompanyForm} onClose={() => setShowAddCompanyForm(false)} onSubmit={handleCreateEmpresa} isLoading={createEmpresa.isPending} />
      <CompanyForm open={!!editingCompany} onClose={() => setEditingCompany(null)} onSubmit={handleUpdateEmpresa} initialData={editingCompany} isLoading={updateEmpresa.isPending} />
      <CompanyArticlePreview 
        article={previewCompanyArticle?.article || null} 
        companyName={previewCompanyArticle?.companyName || ""}
        empresaId={previewCompanyArticle?.company.id || ""}
        hasWordPress={previewCompanyArticle ? hasWordPressEmpresa(previewCompanyArticle.company.id) : false}
        onClose={() => setPreviewCompanyArticle(null)}
        onRegenerate={previewCompanyArticle ? () => {
          handleGenerateArticleEmpresa(previewCompanyArticle.company);
          setPreviewCompanyArticle(null);
        } : undefined}
        isRegenerating={previewCompanyArticle ? generatingId === previewCompanyArticle.company.id : false}
        onRegenerateImage={previewCompanyArticle?.article ? async () => {
          if (!previewCompanyArticle?.article) return;
          setRegeneratingImageId(previewCompanyArticle.article.id);
          try {
            const pexelsQuery = previewCompanyArticle.article.pexels_query || "business professional";
            const articleTitle = previewCompanyArticle.article.content_spanish?.title || previewCompanyArticle.article.topic;
            const articleContent = previewCompanyArticle.article.content_spanish?.content || "";
            await regenerateImageEmpresa.mutateAsync({ 
              articleId: previewCompanyArticle.article.id, 
              pexelsQuery, 
              companySector: previewCompanyArticle.company.sector,
              month: selectedMonth, 
              year: selectedYear, 
              articleTitle, 
              articleContent 
            });
          } finally {
            setRegeneratingImageId(null);
          }
        } : undefined}
        isRegeneratingImage={previewCompanyArticle?.article ? regeneratingImageId === previewCompanyArticle.article.id : false}
      />
      <AlertDialog open={!!deletingCompany} onOpenChange={(o) => !o && setDeletingCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará permanentemente la empresa "{deletingCompany?.name}" y todos sus artículos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmpresa} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
