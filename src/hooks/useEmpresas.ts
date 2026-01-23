import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Empresa {
  id: string;
  name: string;
  location: string | null;
  sector: string | null;
  languages: string[];
  blog_url: string | null;
  instagram_url: string | null;
  auto_generate: boolean;
  custom_topic: string | null;
  include_featured_image: boolean;
  publish_frequency: string;
  geographic_scope: string;
  created_at: string;
  updated_at: string;
}

export function useEmpresas() {
  return useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Empresa[];
    },
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (empresa: {
      name: string;
      location?: string | null;
      sector?: string | null;
      languages: string[];
      blog_url?: string | null;
      instagram_url?: string | null;
      auto_generate?: boolean;
      custom_topic?: string | null;
      include_featured_image?: boolean;
      publish_frequency?: string;
      geographic_scope?: string;
    }) => {
      const { data, error } = await supabase
        .from("empresas")
        .insert({
          name: empresa.name,
          location: empresa.location || null,
          sector: empresa.sector || null,
          languages: empresa.languages,
          blog_url: empresa.blog_url || null,
          instagram_url: empresa.instagram_url || null,
          auto_generate: empresa.auto_generate ?? true,
          custom_topic: empresa.custom_topic,
          include_featured_image: empresa.include_featured_image ?? true,
          publish_frequency: empresa.publish_frequency || 'monthly',
          geographic_scope: empresa.geographic_scope || 'local',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      toast.success("Empresa creada correctamente");
    },
    onError: (error) => {
      toast.error(`Error al crear empresa: ${error.message}`);
    },
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (empresa: Partial<Empresa> & { id: string }) => {
      const { data, error } = await supabase
        .from("empresas")
        .update({
          name: empresa.name,
          location: empresa.location,
          sector: empresa.sector,
          languages: empresa.languages,
          blog_url: empresa.blog_url,
          instagram_url: empresa.instagram_url,
          auto_generate: empresa.auto_generate,
          custom_topic: empresa.custom_topic,
          include_featured_image: empresa.include_featured_image,
          publish_frequency: empresa.publish_frequency,
          geographic_scope: empresa.geographic_scope,
        })
        .eq("id", empresa.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      toast.success("Empresa actualizada correctamente");
    },
    onError: (error) => {
      toast.error(`Error al actualizar empresa: ${error.message}`);
    },
  });
}

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("empresas").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      queryClient.invalidateQueries({ queryKey: ["articulos_empresas"] });
      toast.success("Empresa eliminada correctamente");
    },
    onError: (error) => {
      toast.error(`Error al eliminar empresa: ${error.message}`);
    },
  });
}
