import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Farmacia {
  id: string;
  name: string;
  location: string;
  languages: string[];
  blog_url: string | null;
  instagram_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useFarmacias() {
  return useQuery({
    queryKey: ["farmacias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmacias")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Farmacia[];
    },
  });
}

export function useCreateFarmacia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (farmacia: { name: string; location: string; languages: string[]; blog_url?: string | null; instagram_url?: string | null }) => {
      const { data, error } = await supabase
        .from("farmacias")
        .insert({
          name: farmacia.name,
          location: farmacia.location,
          languages: farmacia.languages,
          blog_url: farmacia.blog_url || null,
          instagram_url: farmacia.instagram_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Farmacia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmacias"] });
      toast.success("Farmacia añadida correctamente");
    },
    onError: (error) => {
      toast.error(`Error al añadir farmacia: ${error.message}`);
    },
  });
}

export function useUpdateFarmacia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (farmacia: Partial<Farmacia> & { id: string }) => {
      const { data, error } = await supabase
        .from("farmacias")
        .update({
          name: farmacia.name,
          location: farmacia.location,
          languages: farmacia.languages,
          blog_url: farmacia.blog_url,
          instagram_url: farmacia.instagram_url,
        })
        .eq("id", farmacia.id)
        .select()
        .single();

      if (error) throw error;
      return data as Farmacia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmacias"] });
      toast.success("Farmacia actualizada");
    },
    onError: (error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useDeleteFarmacia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("farmacias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmacias"] });
      queryClient.invalidateQueries({ queryKey: ["articulos"] });
      toast.success("Farmacia eliminada");
    },
    onError: (error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}
