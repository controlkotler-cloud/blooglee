import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SeasonalTopic } from "@/lib/seasonalTopics";
 import { useGeneration } from "@/contexts/GenerationContext";

export interface ArticleContent {
  title: string;
  seo_title?: string;
  meta_description: string;
  excerpt?: string;
  focus_keyword?: string;
  slug: string;
  content: string;
}

export interface Articulo {
  id: string;
  farmacia_id: string;
  month: number;
  year: number;
  topic: string;
  pexels_query: string | null;
  content_spanish: ArticleContent | null;
  content_catalan: ArticleContent | null;
  image_url: string | null;
  image_photographer: string | null;
  image_photographer_url: string | null;
  generated_at: string;
  wp_post_url: string | null;
}

interface GenerateArticleParams {
  farmaciaId: string;
  pharmacyName: string;
  pharmacyLocation: string;
  pharmacyLanguages: string[];
  pharmacyBlogUrl?: string;
  pharmacyInstagramUrl?: string;
  topic: SeasonalTopic;
  month: number;
  year: number;
  usedImageUrls?: string[];
}

interface RegenerateImageParams {
  articleId: string;
  pexelsQuery: string;
  month: number;
  year: number;
  articleTitle?: string;
  articleContent?: string;
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

/**
 * Obtiene todas las URLs de imágenes ya usadas en artículos del mes/año actual
 */
export async function getUsedImageUrls(month: number, year: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("articulos")
    .select("image_url")
    .eq("month", month)
    .eq("year", year);

  if (error) {
    console.error("Error fetching used image URLs:", error);
    return [];
  }

  return data
    .map((a) => a.image_url)
    .filter((url): url is string => url !== null);
}

export function useGenerateArticle() {
  const queryClient = useQueryClient();
   const { addGenerating, removeGenerating } = useGeneration();

  return useMutation({
    mutationFn: async (params: GenerateArticleParams) => {
      console.log("Generating article for:", params.pharmacyName, "Languages:", params.pharmacyLanguages);
       
       addGenerating(params.farmaciaId);
      
      // Obtener URLs de imágenes ya usadas para este mes/año
      const usedImageUrls = params.usedImageUrls || await getUsedImageUrls(params.month, params.year);
      console.log("Passing", usedImageUrls.length, "used image URLs to edge function");
      
      const { data, error } = await supabase.functions.invoke("generate-article", {
        body: {
          pharmacy: {
            name: params.pharmacyName,
            location: params.pharmacyLocation,
            languages: params.pharmacyLanguages,
            blog_url: params.pharmacyBlogUrl,
            instagram_url: params.pharmacyInstagramUrl,
          },
          topic: params.topic,
          month: params.month,
          year: params.year,
          usedImageUrls,
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
        pexels_query: data.pexels_query || params.topic.pexels_query,
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
     onSettled: (_, __, params) => {
       removeGenerating(params.farmaciaId);
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

/**
 * Hook para regenerar solo la imagen de un artículo existente
 */
export function useRegenerateImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RegenerateImageParams) => {
      console.log("Regenerating image for article:", params.articleId, "pexelsQuery:", params.pexelsQuery);
      
      // Obtener URLs de imágenes ya usadas para este mes/año
      const usedImageUrls = await getUsedImageUrls(params.month, params.year);
      console.log("Excluding", usedImageUrls.length, "used image URLs");
      
      const { data, error } = await supabase.functions.invoke("regenerate-image", {
        body: {
          pexelsQuery: params.pexelsQuery,
          usedImageUrls,
          articleTitle: params.articleTitle,
          articleContent: params.articleContent,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }
      
      if (data.error) {
        console.error("Image regeneration error:", data.error);
        throw new Error(data.error);
      }

      console.log("New image received:", data.image?.url?.substring(0, 50));

      // Update only image fields in the database
      const { data: updatedArticle, error: updateError } = await supabase
        .from("articulos")
        .update({
          image_url: data.image.url,
          image_photographer: data.image.photographer,
          image_photographer_url: data.image.photographer_url,
        })
        .eq("id", params.articleId)
        .select()
        .single();

      if (updateError) {
        console.error("Database update error:", updateError);
        throw new Error(`Error actualizando imagen: ${updateError.message}`);
      }

      console.log("Image updated successfully for article:", updatedArticle?.id);
      return updatedArticle as unknown as Articulo;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ["articulos", params.month, params.year] });
      toast.success("Imagen actualizada correctamente");
    },
    onError: (error) => {
      console.error("useRegenerateImage error:", error);
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