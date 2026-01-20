import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Play, LayoutDashboard, Building2, Settings } from "lucide-react";
import { useFarmacias, useCreateFarmacia, useUpdateFarmacia, useDeleteFarmacia, type Farmacia } from "@/hooks/useFarmacias";
import { useArticulos, useGenerateArticle, type Articulo } from "@/hooks/useArticulos";
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

export default function Index() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Farmacia | null>(null);
  const [deletingPharmacy, setDeletingPharmacy] = useState<Farmacia | null>(null);
  const [previewArticle, setPreviewArticle] = useState<{ article: Articulo; pharmacyName: string } | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const { data: farmacias = [], isLoading: loadingFarmacias } = useFarmacias();
  const { data: articulos = [], isLoading: loadingArticulos } = useArticulos(selectedMonth, selectedYear);

  const createFarmacia = useCreateFarmacia();
  const updateFarmacia = useUpdateFarmacia();
  const deleteFarmacia = useDeleteFarmacia();
  const generateArticle = useGenerateArticle();

  const getArticleForPharmacy = (pharmacyId: string) => {
    return articulos.find((a) => a.farmacia_id === pharmacyId) || null;
  };

  const handleCreateFarmacia = (data: { name: string; location: string; languages: string[] }) => {
    createFarmacia.mutate(data, {
      onSuccess: () => setShowAddForm(false),
    });
  };

  const handleUpdateFarmacia = (data: { name: string; location: string; languages: string[] }) => {
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

  const handleGenerateArticle = async (pharmacy: Farmacia, index: number) => {
    const topic = getAssignedTopic(index, selectedMonth);
    setGeneratingId(pharmacy.id);

    try {
      await generateArticle.mutateAsync({
        farmaciaId: pharmacy.id,
        pharmacyName: pharmacy.name,
        pharmacyLocation: pharmacy.location,
        pharmacyLanguages: pharmacy.languages,
        topic,
        month: selectedMonth,
        year: selectedYear,
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateAll = async () => {
    const pending = farmacias.filter((p) => !getArticleForPharmacy(p.id));

    if (pending.length === 0) {
      toast.info("Todos los artículos ya están generados");
      return;
    }

    setGeneratingAll(true);
    setGenerationProgress(0);

    for (let i = 0; i < pending.length; i++) {
      const pharmacy = pending[i];
      const pharmacyIndex = farmacias.findIndex((p) => p.id === pharmacy.id);
      const topic = getAssignedTopic(pharmacyIndex, selectedMonth);

      setGeneratingId(pharmacy.id);
      setGenerationProgress(Math.round(((i + 1) / pending.length) * 100));

      try {
        await generateArticle.mutateAsync({
          farmaciaId: pharmacy.id,
          pharmacyName: pharmacy.name,
          pharmacyLocation: pharmacy.location,
          pharmacyLanguages: pharmacy.languages,
          topic,
          month: selectedMonth,
          year: selectedYear,
        });
      } catch (error) {
        console.error("Error generating article:", error);
      }

      if (i < pending.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    setGeneratingAll(false);
    setGeneratingId(null);
    setGenerationProgress(0);
    toast.success(`🎉 Se han generado ${pending.length} artículos`);
  };

  const handleImportFarmacias = async (newFarmacias: { name: string; location: string; languages: string[] }[]) => {
    for (const farmacia of newFarmacias) {
      await createFarmacia.mutateAsync(farmacia);
    }
  };

  const pendingCount = farmacias.length - articulos.length;
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
                  {[2024, 2025, 2026].map((year) => (<SelectItem key={year} value={String(year)}>{year}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {generatingAll && (
        <div className="border-b bg-primary/5 px-4 py-3">
          <div className="container mx-auto flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <Progress value={generationProgress} className="flex-1 h-2" />
            <span className="text-sm font-medium">{generationProgress}%</span>
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
                    <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} topic={getAssignedTopic(index, selectedMonth)} article={getArticleForPharmacy(pharmacy.id)} isGenerating={generatingId === pharmacy.id} onGenerate={() => handleGenerateArticle(pharmacy, index)} onPreview={() => { const article = getArticleForPharmacy(pharmacy.id); if (article) setPreviewArticle({ article, pharmacyName: pharmacy.name }); }} onEdit={() => setEditingPharmacy(pharmacy)} onDelete={() => setDeletingPharmacy(pharmacy)} />
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
      <ArticlePreview article={previewArticle?.article || null} pharmacyName={previewArticle?.pharmacyName || ""} onClose={() => setPreviewArticle(null)} />

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
