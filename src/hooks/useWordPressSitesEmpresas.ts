import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WordPressSiteEmpresa {
  id: string;
  empresa_id: string;
  site_url: string;
  wp_username: string;
  wp_app_password: string;
  created_at: string;
  updated_at: string;
}

export interface WordPressSiteEmpresaInput {
  empresa_id: string;
  site_url: string;
  wp_username: string;
  wp_app_password: string;
}

// Get WordPress site config for a specific empresa
export function useWordPressSiteByEmpresa(empresaId: string | undefined) {
  return useQuery({
    queryKey: ["wordpress_sites_empresa", empresaId],
    queryFn: async () => {
      if (!empresaId) return null;

      const { data, error } = await supabase
        .from("wordpress_sites")
        .select("*")
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (error) throw error;
      return data as WordPressSiteEmpresa | null;
    },
    enabled: !!empresaId,
  });
}

// Get all WordPress sites for empresas
export function useWordPressSitesEmpresas() {
  return useQuery({
    queryKey: ["wordpress_sites_empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wordpress_sites")
        .select("*")
        .not("empresa_id", "is", null);

      if (error) throw error;
      return data as WordPressSiteEmpresa[];
    },
  });
}

// Create or update WordPress site config for empresa
export function useUpsertWordPressSiteForEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WordPressSiteEmpresaInput) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("wordpress_sites")
        .select("id")
        .eq("empresa_id", input.empresa_id)
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
          .eq("empresa_id", input.empresa_id)
          .select()
          .single();

        if (error) throw error;
        return data as WordPressSiteEmpresa;
      } else {
        // Insert - need to cast to any due to Supabase types not including empresa_id yet
        const { data, error } = await supabase
          .from("wordpress_sites")
          .insert({
            empresa_id: input.empresa_id,
            site_url: input.site_url,
            wp_username: input.wp_username,
            wp_app_password: input.wp_app_password,
          } as any)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as WordPressSiteEmpresa;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wordpress_sites_empresas"] });
      queryClient.invalidateQueries({
        queryKey: ["wordpress_sites_empresa", variables.empresa_id],
      });
      toast.success("Configuración de WordPress guardada");
    },
    onError: (error) => {
      toast.error(`Error al guardar configuración: ${error.message}`);
    },
  });
}

// Delete WordPress site config for empresa
export function useDeleteWordPressSiteForEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (empresaId: string) => {
      const { error } = await supabase
        .from("wordpress_sites")
        .delete()
        .eq("empresa_id", empresaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordpress_sites_empresas"] });
      toast.success("Configuración de WordPress eliminada");
    },
    onError: (error) => {
      toast.error(`Error al eliminar configuración: ${error.message}`);
    },
  });
}
