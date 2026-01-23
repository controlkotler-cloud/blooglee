import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Play, LayoutDashboard, Building2, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFarmacias, useCreateFarmacia, useUpdateFarmacia, useDeleteFarmacia, type Farmacia } from "@/hooks/useFarmacias";
import { useArticulos, useGenerateArticle, useRegenerateImage, getUsedImageUrls, type Articulo } from "@/hooks/useArticulos";
import { useWordPressSites } from "@/hooks/useWordPressSites";
import { getAssignedTopic, MONTH_NAMES } from "@/lib/seasonalTopics";
import { Dashboard } from "@/components/pharmacy/Dashboard";
import { PharmacyCard } from "@/components/pharmacy/PharmacyCard";
import { PharmacyForm } from "@/components/pharmacy/PharmacyForm";
import { ArticlePreview } from "@/components/pharmacy/ArticlePreview";
import { ImportExport } from "@/components/pharmacy/ImportExport";
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

// Configuración de reintentos
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000]; // 2s, 4s, 8s

export default function Index() {
  const { signOut } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Farmacia | null>(null);
  const [deletingPharmacy, setDeletingPharmacy] = useState<Farmacia | null>(null);
  const [previewArticle, setPreviewArticle] = useState<{ article: Articulo; pharmacyName: string; pharmacyIndex: number; pharmacy: Farmacia } | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentRetry, setCurrentRetry] = useState(0);
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  const { data: farmacias = [], isLoading: loadingFarmacias } = useFarmacias();
  const { data: articulos = [], isLoading: loadingArticulos } = useArticulos(selectedMonth, selectedYear);

  const createFarmacia = useCreateFarmacia();
  const updateFarmacia = useUpdateFarmacia();
  const deleteFarmacia = useDeleteFarmacia();
  const generateArticle = useGenerateArticle();
  const regenerateImage = useRegenerateImage();
  const { data: wpSites = [] } = useWordPressSites();

  const hasWordPress = (pharmacyId: string) => wpSites.some(wp => wp.farmacia_id === pharmacyId);

  const getArticleForPharmacy = (pharmacyId: string) => {
    return articulos.find((a) => a.farmacia_id === pharmacyId) || null;
  };

  const handleCreateFarmacia = (data: { name: string; location: string; languages: string[]; blog_url?: string; instagram_url?: string; auto_generate?: boolean; custom_topic?: string | null }) => {
    createFarmacia.mutate(data, {
      onSuccess: () => setShowAddForm(false),
    });
  };

  const handleUpdateFarmacia = (data: { name: string; location: string; languages: string[]; blog_url?: string; instagram_url?: string; auto_generate?: boolean; custom_topic?: string | null }) => {
    if (!editingPharmacy) return;
    updateFarmacia.mutate({ id: editingPharmacy.id, ...data }, {
      onSuccess: () => setEditingPharmacy(null),
    });
  };

  const handleDeleteFarmacia = () => {
    if (!deletingPharmacy) return;
    deleteFarmacia.mutate(deletingPharmacy.id, {
      onSuccess: () => setDeletingPharmacy(null),
    });
  };

  /**
   * Genera un artículo con reintentos automáticos
   */
  const handleGenerateArticle = async (pharmacy: Farmacia, index: number, usedImageUrls?: string[]) => {
    // If pharmacy has custom topic, create a custom SeasonalTopic object
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
        // Éxito - salir del bucle
        setGeneratingId(null);
        setCurrentRetry(0);
        return true;
      } catch (error) {
        console.error(`Intento ${attempt + 1}/${MAX_RETRIES + 1} fallido para ${pharmacy.name}:`, error);
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt];
          setCurrentRetry(attempt + 1);
          toast.info(`Reintentando ${pharmacy.name} (${attempt + 1}/${MAX_RETRIES})...`, {
            duration: delay,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // Último intento fallido
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
    // Only generate for auto_generate = true pharmacies without articles
    const pending = farmacias.filter((p) => p.auto_generate && !getArticleForPharmacy(p.id));

    if (pending.length === 0) {
      toast.info("Todos los artículos ya están generados");
      return;
    }

    setGeneratingAll(true);
    setGenerationProgress(0);

    // Obtener URLs de imágenes usadas una vez al inicio
    let usedImageUrls = await getUsedImageUrls(selectedMonth, selectedYear);
    const failedPharmacies: Farmacia[] = [];
    let successCount = 0;

    for (let i = 0; i < pending.length; i++) {
      const pharmacy = pending[i];
      const pharmacyIndex = farmacias.findIndex((p) => p.id === pharmacy.id);
      
      setGeneratingId(pharmacy.id);
      setGenerationProgress(Math.round(((i + 1) / pending.length) * 100));

      const success = await handleGenerateArticleWithRetry(pharmacy, pharmacyIndex, usedImageUrls);
      
      if (success) {
        successCount++;
        // Actualizar lista de URLs usadas después de cada éxito
        usedImageUrls = await getUsedImageUrls(selectedMonth, selectedYear);
      } else {
        failedPharmacies.push(pharmacy);
      }

      // Delay entre generaciones para evitar rate limiting
      if (i < pending.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    setGeneratingAll(false);
    setGeneratingId(null);
    setGenerationProgress(0);
    
    if (failedPharmacies.length === 0) {
      toast.success(`🎉 Se han generado ${successCount} artículos correctamente`);
    } else {
      toast.warning(
        `Se generaron ${successCount} artículos. ${failedPharmacies.length} fallaron: ${failedPharmacies.map(p => p.name).join(", ")}`
      );
    }
  };

  /**
   * Versión interna con reintentos para handleGenerateAll
   */
  const handleGenerateArticleWithRetry = async (
    pharmacy: Farmacia, 
    index: number, 
    usedImageUrls: string[]
  ): Promise<boolean> => {
    const topic = getAssignedTopic(index, selectedMonth, pharmacy.id);

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
        return true;
      } catch (error) {
        console.error(`Intento ${attempt + 1}/${MAX_RETRIES + 1} fallido para ${pharmacy.name}:`, error);
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt];
          setCurrentRetry(attempt + 1);
          toast.info(`Reintentando ${pharmacy.name} (${attempt + 1}/${MAX_RETRIES})...`, {
            duration: delay,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    
    return false;
  };

  const handleImportFarmacias = async (newFarmacias: { name: string; location: string; languages: string[] }[]) => {
    for (const farmacia of newFarmacias) {
      await createFarmacia.mutateAsync({ ...farmacia, blog_url: null, instagram_url: null });
    }
  };

  // Count pending only for auto_generate pharmacies
  const pendingCount = farmacias.filter(p => p.auto_generate && !getArticleForPharmacy(p.id)).length;
  const isLoading = loadingFarmacias || loadingArticulos;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">PharmaBlog Manager</h1>
              <p className="text-sm text-muted-foreground">Generador automático de artículos para farmacias</p>
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
            <span className="text-sm font-medium">
              {generationProgress}%
              {currentRetry > 0 && ` (reintento ${currentRetry}/${MAX_RETRIES})`}
            </span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</TabsTrigger>
                <TabsTrigger value="farmacias"><Building2 className="w-4 h-4 mr-2" />Farmacias</TabsTrigger>
                <TabsTrigger value="config"><Settings className="w-4 h-4 mr-2" />Configuración</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddForm(true)} variant="outline"><Plus className="w-4 h-4 mr-2" />Añadir farmacia</Button>
                <Button onClick={handleGenerateAll} disabled={generatingAll || pendingCount === 0}>
                  {generatingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Generar todos ({pendingCount})
                </Button>
              </div>
            </div>

            <TabsContent value="dashboard">
              <Dashboard farmacias={farmacias} articulos={articulos} selectedMonth={selectedMonth} selectedYear={selectedYear} />
            </TabsContent>

            <TabsContent value="farmacias">
              {farmacias.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No hay farmacias</h3>
                  <p className="text-muted-foreground mb-4">Añade tu primera farmacia para empezar a generar artículos</p>
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

            <TabsContent value="config">
              <div className="max-w-md">
                <ImportExport farmacias={farmacias} articulos={articulos} selectedMonth={selectedMonth} selectedYear={selectedYear} onImportFarmacias={handleImportFarmacias} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

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
            // Usar el pexels_query guardado, o fallback al topic del tema asignado
            const pexelsQuery = previewArticle.article.pexels_query || 
              getAssignedTopic(previewArticle.pharmacyIndex, selectedMonth, previewArticle.pharmacy.id).pexels_query;
            
            // Obtener título y contenido del artículo para que la IA genere un query relevante
            const articleTitle = previewArticle.article.content_spanish?.title || previewArticle.article.topic;
            const articleContent = previewArticle.article.content_spanish?.content || "";
            
            const updatedArticle = await regenerateImage.mutateAsync({
              articleId: previewArticle.article.id,
              pexelsQuery,
              month: selectedMonth,
              year: selectedYear,
              articleTitle,
              articleContent,
            });
            // Update the preview with the new image
            setPreviewArticle(prev => prev ? {
              ...prev,
              article: updatedArticle
            } : null);
          } finally {
            setRegeneratingImageId(null);
          }
        } : undefined}
        isRegeneratingImage={previewArticle?.article ? regeneratingImageId === previewArticle.article.id : false}
      />

      <AlertDialog open={!!deletingPharmacy} onOpenChange={() => setDeletingPharmacy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar farmacia?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará <strong>{deletingPharmacy?.name}</strong> y todos sus artículos asociados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFarmacia}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}