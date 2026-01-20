import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SeasonalTopic } from "@/lib/seasonalTopics";

export interface ArticleContent {
  title: string;
  meta_description: string;
  slug: string;
  content: string;
}

export interface Articulo {
  id: string;
  farmacia_id: string;
  month: number;
  year: number;
  topic: string;
  content_spanish: ArticleContent | null;
  content_catalan: ArticleContent | null;
  image_url: string | null;
  image_photographer: string | null;
  image_photographer_url: string | null;
  generated_at: string;
}

interface GenerateArticleParams {
  farmaciaId: string;
  pharmacyName: string;
  pharmacyLocation: string;
  pharmacyLanguages: string[];
  topic: SeasonalTopic;
  month: number;
  year: number;
}

export function useArticulos(month: number, year: number) {
  return useQuery({
    queryKey: ["articulos", month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articulos")
        .select("*")
        .eq("month", month)
        .eq("year", year);

      if (error) throw error;
      return data as unknown as Articulo[];
    },
  });
}

export function useGenerateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateArticleParams) => {
      const { data, error } = await supabase.functions.invoke("generate-article", {
        body: {
          pharmacy: {
            name: params.pharmacyName,
            location: params.pharmacyLocation,
            languages: params.pharmacyLanguages,
          },
          topic: params.topic,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Save the article to the database
      const articleData = {
        farmacia_id: params.farmaciaId,
        month: params.month,
        year: params.year,
        topic: params.topic.tema,
        content_spanish: data.content.spanish,
        content_catalan: data.content.catalan || null,
        image_url: data.image.url,
        image_photographer: data.image.photographer,
        image_photographer_url: data.image.photographer_url,
      };

      const { data: savedArticle, error: saveError } = await supabase
        .from("articulos")
        .upsert(articleData, { onConflict: "farmacia_id,month,year" })
        .select()
        .single();

      if (saveError) throw saveError;
      return savedArticle as unknown as Articulo;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ["articulos", params.month, params.year] });
      toast.success(`Artículo generado para ${params.pharmacyName}`);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useDeleteArticulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, month, year }: { id: string; month: number; year: number }) => {
      const { error } = await supabase.from("articulos").delete().eq("id", id);
      if (error) throw error;
      return { month, year };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["articulos", data.month, data.year] });
      toast.success("Artículo eliminado");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}
