import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WordPressTaxonomy {
  id: string;
  wordpress_site_id: string;
  taxonomy_type: "category" | "tag";
  wp_id: number;
  name: string;
  slug: string | null;
  created_at: string;
}

export interface WordPressSiteDefaultTaxonomy {
  id: string;
  wordpress_site_id: string;
  taxonomy_id: string;
  created_at: string;
}

// Fetch all taxonomies for a WordPress site
export function useTaxonomies(wordpressSiteId: string | undefined) {
  return useQuery({
    queryKey: ["wordpress_taxonomies", wordpressSiteId],
    queryFn: async () => {
      if (!wordpressSiteId) return { categories: [], tags: [] };

      const { data, error } = await supabase
        .from("wordpress_taxonomies")
        .select("*")
        .eq("wordpress_site_id", wordpressSiteId)
        .order("name");

      if (error) throw error;

      const taxonomies = data as WordPressTaxonomy[];
      return {
        categories: taxonomies.filter((t) => t.taxonomy_type === "category"),
        tags: taxonomies.filter((t) => t.taxonomy_type === "tag"),
      };
    },
    enabled: !!wordpressSiteId,
  });
}

// Fetch default taxonomies for a WordPress site
export function useDefaultTaxonomies(wordpressSiteId: string | undefined) {
  return useQuery({
    queryKey: ["wordpress_default_taxonomies", wordpressSiteId],
    queryFn: async () => {
      if (!wordpressSiteId) return [];

      const { data, error } = await supabase
        .from("wordpress_site_default_taxonomies")
        .select("*, taxonomy:wordpress_taxonomies(*)")
        .eq("wordpress_site_id", wordpressSiteId);

      if (error) throw error;

      return data as (WordPressSiteDefaultTaxonomy & { taxonomy: WordPressTaxonomy })[];
    },
    enabled: !!wordpressSiteId,
  });
}

// Sync taxonomies from WordPress
export function useSyncTaxonomies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wordpressSiteId: string) => {
      const { data, error } = await supabase.functions.invoke("sync-wordpress-taxonomies", {
        body: { wordpress_site_id: wordpressSiteId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data, wordpressSiteId) => {
      queryClient.invalidateQueries({ queryKey: ["wordpress_taxonomies", wordpressSiteId] });
      toast.success(`Sincronizado: ${data.total_categories} categorías y ${data.total_tags} tags`);
    },
    onError: (error) => {
      toast.error(`Error al sincronizar: ${error.message}`);
    },
  });
}

// Set default taxonomies for a WordPress site
export function useSetDefaultTaxonomies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      wordpressSiteId,
      taxonomyIds,
    }: {
      wordpressSiteId: string;
      taxonomyIds: string[];
    }) => {
      // First, delete existing defaults
      const { error: deleteError } = await supabase
        .from("wordpress_site_default_taxonomies")
        .delete()
        .eq("wordpress_site_id", wordpressSiteId);

      if (deleteError) throw deleteError;

      // Then insert new defaults
      if (taxonomyIds.length > 0) {
        const records = taxonomyIds.map((taxonomyId) => ({
          wordpress_site_id: wordpressSiteId,
          taxonomy_id: taxonomyId,
        }));

        const { error: insertError } = await supabase
          .from("wordpress_site_default_taxonomies")
          .insert(records);

        if (insertError) throw insertError;
      }

      return { success: true };
    },
    onSuccess: (_, { wordpressSiteId }) => {
      queryClient.invalidateQueries({ queryKey: ["wordpress_default_taxonomies", wordpressSiteId] });
      toast.success("Taxonomías por defecto guardadas");
    },
    onError: (error) => {
      toast.error(`Error al guardar: ${error.message}`);
    },
  });
}
