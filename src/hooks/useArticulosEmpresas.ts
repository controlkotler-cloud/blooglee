import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ArticleContent {
  title: string;
  meta_description: string;
  slug: string;
  content: string;
}

export interface ArticuloEmpresa {
  id: string;
  empresa_id: string;
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
}

interface GenerateArticleParams {
  empresaId: string;
  companyName: string;
  companyLocation?: string | null;
  companySector?: string | null;
  companyLanguages: string[];
  companyBlogUrl?: string;
  companyInstagramUrl?: string;
  companyGeographicScope?: string;
  companyIncludeFeaturedImage?: boolean;
  companyPublishFrequency?: string;  // daily, weekly, monthly
  topic?: string | null;
  month: number;
  year: number;
  usedImageUrls?: string[];
}

interface RegenerateImageParams {
  articleId: string;
  pexelsQuery: string;
  companySector?: string | null;
  month: number;
  year: number;
  articleTitle?: string;
  articleContent?: string;
}

export function useArticulosEmpresas(month: number, year: number) {
  return useQuery({
    queryKey: ["articulos_empresas", month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articulos_empresas")
        .select("*")
        .eq("month", month)
        .eq("year", year);

      if (error) throw error;
      return data as unknown as ArticuloEmpresa[];
    },
  });
}

export async function getUsedImageUrlsEmpresas(month: number, year: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("articulos_empresas")
    .select("image_url")
    .eq("month", month)
    .eq("year", year)
    .not("image_url", "is", null);

  if (error) {
    console.error("Error fetching used image URLs:", error);
    return [];
  }

  return data.map((a) => a.image_url).filter((url): url is string => url !== null);
}

export function useGenerateArticleEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateArticleParams) => {
      // Call the new dedicated edge function for companies
      const { data, error } = await supabase.functions.invoke("generate-article-empresa", {
        body: {
          empresaId: params.empresaId,  // Permite a la función buscar historial de temas
          company: {
            name: params.companyName,
            location: params.companyLocation,
            sector: params.companySector,
            languages: params.companyLanguages,
            blog_url: params.companyBlogUrl,
            instagram_url: params.companyInstagramUrl,
            geographic_scope: params.companyGeographicScope || "local",
            include_featured_image: params.companyIncludeFeaturedImage !== false,
          },
          topic: params.topic || null,
          month: params.month,
          year: params.year,
          usedImageUrls: params.usedImageUrls || [],
          autoGenerateTopic: !params.topic,
        },
      });

      if (error) throw error;

      // Use the topic from the response (which may be AI-generated)
      const finalTopic = data.topic || params.topic || "Artículo generado automáticamente";

      // Calculate week_of_month and day_of_month for the unique index
      const now = new Date();
      const dayOfMonth = now.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);

      // Save to database with frequency-aware upsert
      const articleData = {
        empresa_id: params.empresaId,
        month: params.month,
        year: params.year,
        topic: finalTopic,
        pexels_query: data.pexels_query || null,
        content_spanish: data.content?.spanish || null,
        content_catalan: data.content?.catalan || null,
        image_url: data.image?.url || null,
        image_photographer: data.image?.photographer || null,
        image_photographer_url: data.image?.photographer_url || null,
        day_of_month: dayOfMonth,
        week_of_month: weekOfMonth,
      };

      // Build query based on publish frequency
      const frequency = params.companyPublishFrequency || 'monthly';
      let existingQuery = supabase
        .from("articulos_empresas")
        .select("id")
        .eq("empresa_id", params.empresaId);

      if (frequency === 'daily') {
        // For daily: look for article generated TODAY
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        existingQuery = existingQuery.gte("generated_at", todayStart.toISOString());
      } else if (frequency === 'weekly') {
        // For weekly: look for article generated THIS WEEK
        existingQuery = existingQuery
          .eq("week_of_month", weekOfMonth)
          .eq("month", params.month)
          .eq("year", params.year);
      } else {
        // For monthly: look for article generated THIS MONTH
        existingQuery = existingQuery
          .eq("month", params.month)
          .eq("year", params.year);
      }

      const { data: existing } = await existingQuery.maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from("articulos_empresas")
          .update(articleData)
          .eq("id", existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("articulos_empresas")
          .insert(articleData);

        if (insertError) throw insertError;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["articulos_empresas", variables.month, variables.year],
      });
      toast.success("Artículo generado correctamente");
    },
    onError: (error) => {
      toast.error(`Error al generar artículo: ${error.message}`);
    },
  });
}

export function useRegenerateImageEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RegenerateImageParams) => {
      const { data, error } = await supabase.functions.invoke("regenerate-image", {
        body: {
          pexelsQuery: params.pexelsQuery,
          companySector: params.companySector,
          articleTitle: params.articleTitle,
          articleContent: params.articleContent,
          usedImageUrls: [], // Can be populated if needed
        },
      });

      if (error) throw error;

      // Update in database
      const { error: updateError } = await supabase
        .from("articulos_empresas")
        .update({
          image_url: data.image?.url || null,
          image_photographer: data.image?.photographer || null,
          image_photographer_url: data.image?.photographer_url || null,
          pexels_query: data.pexels_query || params.pexelsQuery,
        })
        .eq("id", params.articleId);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["articulos_empresas", variables.month, variables.year],
      });
      toast.success("Imagen regenerada correctamente");
    },
    onError: (error) => {
      toast.error(`Error al regenerar imagen: ${error.message}`);
    },
  });
}

export function useDeleteArticuloEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articulos_empresas").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articulos_empresas"] });
      toast.success("Artículo eliminado correctamente");
    },
    onError: (error) => {
      toast.error(`Error al eliminar artículo: ${error.message}`);
    },
  });
}
