import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Tag, FolderOpen } from "lucide-react";
import {
  useTaxonomies,
  useDefaultTaxonomies,
  WordPressTaxonomy,
} from "@/hooks/useWordPressTaxonomies";

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
  const { data: taxonomies, isLoading: isLoadingTaxonomies } = useTaxonomies(wordpressSiteId);
  const { data: defaults, isLoading: isLoadingDefaults } = useDefaultTaxonomies(wordpressSiteId);
  const [initialized, setInitialized] = useState(false);

  // Initialize with defaults on first load
  useEffect(() => {
    if (defaults && !initialized && taxonomies) {
      const defaultCategoryIds = defaults
        .filter((d) => d.taxonomy?.taxonomy_type === "category")
        .map((d) => d.taxonomy?.wp_id)
        .filter((id): id is number => id !== undefined);
      
      const defaultTagIds = defaults
        .filter((d) => d.taxonomy?.taxonomy_type === "tag")
        .map((d) => d.taxonomy?.wp_id)
        .filter((id): id is number => id !== undefined);

      if (defaultCategoryIds.length > 0) {
        onCategoriesChange(defaultCategoryIds);
      }
      if (defaultTagIds.length > 0) {
        onTagsChange(defaultTagIds);
      }
      setInitialized(true);
    }
  }, [defaults, initialized, taxonomies, onCategoriesChange, onTagsChange]);

  const toggleCategory = (wpId: number) => {
    if (selectedCategoryIds.includes(wpId)) {
      onCategoriesChange(selectedCategoryIds.filter((id) => id !== wpId));
    } else {
      onCategoriesChange([...selectedCategoryIds, wpId]);
    }
  };

  const toggleTag = (wpId: number) => {
    if (selectedTagIds.includes(wpId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== wpId));
    } else {
      onTagsChange([...selectedTagIds, wpId]);
    }
  };

  if (!wordpressSiteId) return null;

  const isLoading = isLoadingTaxonomies || isLoadingDefaults;
  const hasTaxonomies =
    (taxonomies?.categories?.length || 0) > 0 || (taxonomies?.tags?.length || 0) > 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando taxonomías...
      </div>
    );
  }

  if (!hasTaxonomies) {
    return (
      <p className="text-xs text-muted-foreground">
        No hay categorías ni tags configurados. Puedes sincronizarlos desde la configuración de la empresa/farmacia.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Categories */}
      {(taxonomies?.categories?.length || 0) > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-xs">
            <FolderOpen className="h-3 w-3" />
            Categorías
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {taxonomies?.categories.map((cat: WordPressTaxonomy) => (
              <div
                key={cat.id}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border cursor-pointer transition-colors ${
                  selectedCategoryIds.includes(cat.wp_id)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted/50 border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => toggleCategory(cat.wp_id)}
              >
                <Checkbox
                  checked={selectedCategoryIds.includes(cat.wp_id)}
                  onCheckedChange={() => toggleCategory(cat.wp_id)}
                  className="h-3 w-3"
                />
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {(taxonomies?.tags?.length || 0) > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-xs">
            <Tag className="h-3 w-3" />
            Tags
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {taxonomies?.tags.map((tag: WordPressTaxonomy) => (
              <div
                key={tag.id}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border cursor-pointer transition-colors ${
                  selectedTagIds.includes(tag.wp_id)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted/50 border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => toggleTag(tag.wp_id)}
              >
                <Checkbox
                  checked={selectedTagIds.includes(tag.wp_id)}
                  onCheckedChange={() => toggleTag(tag.wp_id)}
                  className="h-3 w-3"
                />
                <span>{tag.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
