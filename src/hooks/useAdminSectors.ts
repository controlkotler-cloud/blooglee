import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AuthoritySource {
  label: string;
  url: string;
  source_type?: "official" | "association" | "technical" | "stats";
  topics?: string[];
  is_active?: boolean;
}

export interface SectorContext {
  id: string;
  sector_key: string;
  sector_keywords: string[];
  image_examples: string[];
  prohibited_terms: string[];
  fallback_query: string;
  tone_description: string | null;
  authority_sources: AuthoritySource[];
  auto_generated: boolean;
  needs_review: boolean;
  created_by_site_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdminSectors() {
  return useQuery({
    queryKey: ["admin-sectors"],
    queryFn: async (): Promise<SectorContext[]> => {
      const { data, error } = await supabase
        .from("sector_contexts" as any)
        .select("*")
        .order("needs_review", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as SectorContext[]) || [];
    },
  });
}

export function useUpdateSector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      authority_sources?: AuthoritySource[];
      prohibited_terms?: string[];
      needs_review?: boolean;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (input.authority_sources !== undefined) updateData.authority_sources = input.authority_sources;
      if (input.prohibited_terms !== undefined) updateData.prohibited_terms = input.prohibited_terms;
      if (input.needs_review !== undefined) updateData.needs_review = input.needs_review;
      updateData.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("sector_contexts" as any)
        .update(updateData as any)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sectors"] });
      toast.success("Sector actualizado");
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`);
    },
  });
}
