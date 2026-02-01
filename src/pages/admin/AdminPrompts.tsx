import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PromptCard } from '@/components/admin/PromptCard';
import { PromptEditor } from '@/components/admin/PromptEditor';
import { 
  useAdminPrompts, 
  useCreatePrompt, 
  useUpdatePrompt, 
  useDeletePrompt,
  Prompt,
  CATEGORIES 
} from '@/hooks/useAdminPrompts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, FileText, Loader2 } from 'lucide-react';

export default function AdminPrompts() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);

  const { data: prompts, isLoading } = useAdminPrompts(selectedCategory);
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const deletePrompt = useDeletePrompt();

  const filteredPrompts = prompts?.filter((prompt) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      prompt.name.toLowerCase().includes(query) ||
      prompt.key.toLowerCase().includes(query) ||
      prompt.description?.toLowerCase().includes(query) ||
      prompt.content.toLowerCase().includes(query)
    );
  });

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingPrompt(null);
    setIsEditorOpen(true);
  };

  const handleSave = (data: Parameters<typeof updatePrompt.mutate>[0] | Parameters<typeof createPrompt.mutate>[0]) => {
    if ('id' in data && data.id) {
      updatePrompt.mutate(data as Parameters<typeof updatePrompt.mutate>[0], {
        onSuccess: () => setIsEditorOpen(false),
      });
    } else {
      createPrompt.mutate(data as Parameters<typeof createPrompt.mutate>[0], {
        onSuccess: () => setIsEditorOpen(false),
      });
    }
  };

  const handleToggleActive = (prompt: Prompt, active: boolean) => {
    updatePrompt.mutate({ id: prompt.id, is_active: active });
  };

  const handleDelete = (prompt: Prompt) => {
    setDeletingPrompt(prompt);
  };

  const confirmDelete = () => {
    if (deletingPrompt) {
      deletePrompt.mutate(deletingPrompt.id, {
        onSuccess: () => setDeletingPrompt(null),
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Prompts del Sistema
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los prompts de IA utilizados en la plataforma
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Prompt
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, key o contenido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="h-10">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="capitalize">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPrompts?.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hay prompts</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery 
                ? 'No se encontraron prompts con esa búsqueda'
                : 'Crea el primer prompt para empezar'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear Prompt
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPrompts?.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}

        {/* Editor Dialog */}
        <PromptEditor
          prompt={editingPrompt}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSave}
          isSaving={createPrompt.isPending || updatePrompt.isPending}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingPrompt} onOpenChange={() => setDeletingPrompt(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar prompt?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El prompt "{deletingPrompt?.name}" será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
