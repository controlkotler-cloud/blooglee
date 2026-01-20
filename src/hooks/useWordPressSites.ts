import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WordPressSite {
  id: string;
  farmacia_id: string;
  site_url: string;
  wp_username: string;
  wp_app_password: string;
  created_at: string;
  updated_at: string;
}

export interface WordPressSiteInput {
  farmacia_id: string;
  site_url: string;
  wp_username: string;
  wp_app_password: string;
}

export interface PublishToWordPressInput {
  farmacia_id: string;
  title: string;
  content: string;
  slug: string;
  status: 'publish' | 'draft' | 'future';
  date?: string;
  image_url?: string;
  image_alt?: string;
}

export interface PublishResult {
  success: boolean;
  post_id?: number;
  post_url?: string;
  status?: string;
  date?: string;
  error?: string;
}

// Get WordPress site config for a specific farmacia
export function useWordPressSite(farmaciaId: string | undefined) {
  return useQuery({
    queryKey: ["wordpress_sites", farmaciaId],
    queryFn: async () => {
      if (!farmaciaId) return null;
      
      const { data, error } = await supabase
        .from("wordpress_sites")
        .select("*")
        .eq("farmacia_id", farmaciaId)
        .maybeSingle();

      if (error) throw error;
      return data as WordPressSite | null;
    },
    enabled: !!farmaciaId,
  });
}

// Get all WordPress sites
export function useWordPressSites() {
  return useQuery({
    queryKey: ["wordpress_sites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wordpress_sites")
        .select("*");

      if (error) throw error;
      return data as WordPressSite[];
    },
  });
}

// Create or update WordPress site config
export function useUpsertWordPressSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WordPressSiteInput) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("wordpress_sites")
        .select("id")
        .eq("farmacia_id", input.farmacia_id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from("wordpress_sites")
          .update({
            site_url: input.site_url,
            wp_username: input.wp_username,
            wp_app_password: input.wp_app_password,
          })
          .eq("farmacia_id", input.farmacia_id)
          .select()
          .single();

        if (error) throw error;
        return data as WordPressSite;
      } else {
        // Insert
        const { data, error } = await supabase
          .from("wordpress_sites")
          .insert(input)
          .select()
          .single();

        if (error) throw error;
        return data as WordPressSite;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wordpress_sites"] });
      queryClient.invalidateQueries({ queryKey: ["wordpress_sites", variables.farmacia_id] });
      toast.success("Configuración de WordPress guardada");
    },
    onError: (error) => {
      toast.error(`Error al guardar configuración: ${error.message}`);
    },
  });
}

// Delete WordPress site config
export function useDeleteWordPressSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (farmaciaId: string) => {
      const { error } = await supabase
        .from("wordpress_sites")
        .delete()
        .eq("farmacia_id", farmaciaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordpress_sites"] });
      toast.success("Configuración de WordPress eliminada");
    },
    onError: (error) => {
      toast.error(`Error al eliminar configuración: ${error.message}`);
    },
  });
}

// Publish article to WordPress
export function usePublishToWordPress() {
  return useMutation({
    mutationFn: async (input: PublishToWordPressInput): Promise<PublishResult> => {
      const { data, error } = await supabase.functions.invoke('publish-to-wordpress', {
        body: input,
      });

      if (error) {
        throw new Error(error.message || 'Error al publicar en WordPress');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as PublishResult;
    },
    onSuccess: (result) => {
      if (result.post_url) {
        toast.success("Artículo publicado correctamente");
      } else {
        toast.success("Artículo guardado correctamente");
      }
    },
    onError: (error) => {
      toast.error(`Error al publicar: ${error.message}`);
    },
  });
}
