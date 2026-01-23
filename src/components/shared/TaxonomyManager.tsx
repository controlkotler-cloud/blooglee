import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Tag, FolderOpen } from "lucide-react";
import {
  useTaxonomies,
  useSyncTaxonomies,
  useDefaultTaxonomies,
  useSetDefaultTaxonomies,
  WordPressTaxonomy,
} from "@/hooks/useWordPressTaxonomies";

interface TaxonomyManagerProps {
  wordpressSiteId: string | undefined;
  onSave?: () => void;
}

export function TaxonomyManager({ wordpressSiteId, onSave }: TaxonomyManagerProps) {
  const { data: taxonomies, isLoading: isLoadingTaxonomies } = useTaxonomies(wordpressSiteId);
  const { data: defaults, isLoading: isLoadingDefaults } = useDefaultTaxonomies(wordpressSiteId);
  const syncMutation = useSyncTaxonomies();
  const setDefaultsMutation = useSetDefaultTaxonomies();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Inicializar SOLO una vez cuando llegan los defaults
  useEffect(() => {
    if (defaults && !initialized) {
      const categoryIds = defaults
        .filter((d) => d.taxonomy?.taxonomy_type === "category")
        .map((d) => d.taxonomy_id);
      const tagIds = defaults
        .filter((d) => d.taxonomy?.taxonomy_type === "tag")
        .map((d) => d.taxonomy_id);
      setSelectedCategoryIds(categoryIds);
      setSelectedTagIds(tagIds);
      setInitialized(true);
    }
  }, [defaults, initialized]);

  const handleSync = () => {
    if (wordpressSiteId) {
      syncMutation.mutate(wordpressSiteId);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setHasChanges(true);
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setHasChanges(true);
  };

  const handleSaveDefaults = async () => {
    if (!wordpressSiteId) return;
    await setDefaultsMutation.mutateAsync({
      wordpressSiteId,
      taxonomyIds: [...selectedCategoryIds, ...selectedTagIds],
    });
    setHasChanges(false);
    onSave?.();
  };

  if (!wordpressSiteId) return null;

  const isLoading = isLoadingTaxonomies || isLoadingDefaults;
  const hasTaxonomies =
    (taxonomies?.categories?.length || 0) > 0 || (taxonomies?.tags?.length || 0) > 0;

  return (
    <div className="space-y-4 pt-3 border-t border-dashed">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Tag className="h-4 w-4" />
          Categorías y Tags (opcional)
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Sincronizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !hasTaxonomies ? (
        <p className="text-xs text-muted-foreground bg-muted p-3 rounded">
          No hay categorías ni tags sincronizados. Pulsa "Sincronizar" para importar.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Categorías - checkboxes nativos */}
          {(taxonomies?.categories?.length || 0) > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                <FolderOpen className="h-3 w-3" />
                Categorías por defecto
              </Label>
              <div className="flex flex-wrap gap-3">
                {taxonomies?.categories.map((cat: WordPressTaxonomy) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tags - checkboxes nativos */}
          {(taxonomies?.tags?.length || 0) > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                Tags por defecto
              </Label>
              <div className="flex flex-wrap gap-3">
                {taxonomies?.tags.map((tag: WordPressTaxonomy) => (
                  <label key={tag.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Botón guardar */}
          {hasChanges && (
            <Button
              type="button"
              size="sm"
              onClick={handleSaveDefaults}
              disabled={setDefaultsMutation.isPending}
              className="w-full"
            >
              {setDefaultsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Guardar taxonomías por defecto
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
