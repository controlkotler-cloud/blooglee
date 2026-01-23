import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTaxonomies } from "@/hooks/useWordPressTaxonomies";

interface TaxonomySelectorProps {
  wordpressSiteId: string | undefined;
  selectedCategoryIds: number[];
  selectedTagIds: number[];
  onCategoriesChange: (ids: number[]) => void;
  onTagsChange: (ids: number[]) => void;
}

export function TaxonomySelector({
  wordpressSiteId,
  selectedCategoryIds,
  selectedTagIds,
  onCategoriesChange,
  onTagsChange,
}: TaxonomySelectorProps) {
  const { data: taxonomies, isLoading } = useTaxonomies(wordpressSiteId);

  if (!wordpressSiteId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando taxonomías...
      </div>
    );
  }

  const categories = taxonomies?.categories || [];
  const tags = taxonomies?.tags || [];

  if (categories.length === 0 && tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay categorías ni tags sincronizados.
      </p>
    );
  }

  const handleCategoryChange = (wpId: number, checked: boolean) => {
    if (checked) {
      onCategoriesChange([...selectedCategoryIds, wpId]);
    } else {
      onCategoriesChange(selectedCategoryIds.filter(id => id !== wpId));
    }
  };

  const handleTagChange = (wpId: number, checked: boolean) => {
    if (checked) {
      onTagsChange([...selectedTagIds, wpId]);
    } else {
      onTagsChange(selectedTagIds.filter(id => id !== wpId));
    }
  };

  return (
    <div className="space-y-3">
      {categories.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground">Categorías</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(cat.wp_id)}
                  onChange={(e) => handleCategoryChange(cat.wp_id, e.target.checked)}
                  className="h-3 w-3 rounded border-input"
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground">Tags</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.wp_id)}
                  onChange={(e) => handleTagChange(tag.wp_id, e.target.checked)}
                  className="h-3 w-3 rounded border-input"
                />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
