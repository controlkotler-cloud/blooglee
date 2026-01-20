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
      console.log("Generating article for:", params.pharmacyName, "Languages:", params.pharmacyLanguages);
      
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

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }
      
      if (data.error) {
        console.error("Article generation error:", data.error);
        throw new Error(data.error);
      }

      console.log("Article data received:", {
        hasSpanish: !!data.content?.spanish,
        hasCatalan: !!data.content?.catalan,
        imageUrl: data.image?.url
      });

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

      console.log("Saving article to database:", { farmaciaId: params.farmaciaId, month: params.month, year: params.year });

      // Try insert first, then update if conflict
      const { data: existingArticle } = await supabase
        .from("articulos")
        .select("id")
        .eq("farmacia_id", params.farmaciaId)
        .eq("month", params.month)
        .eq("year", params.year)
        .maybeSingle();

      let savedArticle;
      let saveError;

      if (existingArticle) {
        // Update existing
        const result = await supabase
          .from("articulos")
          .update(articleData)
          .eq("id", existingArticle.id)
          .select()
          .single();
        savedArticle = result.data;
        saveError = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from("articulos")
          .insert(articleData)
          .select()
          .single();
        savedArticle = result.data;
        saveError = result.error;
      }

      if (saveError) {
        console.error("Database save error:", saveError);
        throw new Error(`Error guardando en base de datos: ${saveError.message}`);
      }

      console.log("Article saved successfully:", savedArticle?.id);
      return savedArticle as unknown as Articulo;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ["articulos", params.month, params.year] });
      toast.success(`Artículo generado para ${params.pharmacyName}`);
    },
    onError: (error) => {
      console.error("useGenerateArticle error:", error);
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
