import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useGeneration } from "@/contexts/GenerationContext";

interface GenerateArticleParams {
  siteId: string;
  topic?: string | null;
}

// WordPress Publishing Types
export interface PublishInputSaas {
  site_id: string;
  title: string;
  seo_title?: string;
  content: string;
  slug: string;
  status: "publish" | "draft" | "future";
  date?: string;
  image_url?: string;
  image_alt?: string;
  meta_description?: string;
  excerpt?: string;
  focus_keyword?: string;
  lang?: "es" | "ca";
  category_ids?: number[];
  tag_ids?: number[];
}

export interface PublishResultSaas {
  success: boolean;
  post_id?: number;
  post_url?: string;
  status?: string;
  error?: string;
}

export function usePublishToWordPressSaas() {
  return useMutation({
    mutationFn: async (input: PublishInputSaas): Promise<PublishResultSaas> => {
      console.log("[usePublishToWordPressSaas] Invoking edge function with:", {
        site_id: input.site_id,
        title: input.title?.substring(0, 50),
        status: input.status,
        lang: input.lang,
        timestamp: new Date().toISOString(),
      });

      const { data, error } = await supabase.functions.invoke("publish-to-wordpress-saas", {
        body: input,
      });

      if (error) {
        // Detect network/CORS errors
        const errorMessage = error.message || "";
        const isNetworkError =
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("Load failed") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("Failed to send") ||
          errorMessage.includes("CORS") ||
          errorMessage.includes("net::ERR");

        console.error("[usePublishToWordPressSaas] Publish error:", {
          message: errorMessage,
          isNetworkError,
          error,
          cause: (error as any).cause,
        });

        if (isNetworkError) {
          throw new Error(
            "No se pudo conectar con el servidor. Verifica tu conexión, extensiones del navegador o red corporativa.",
          );
        }
        throw new Error(errorMessage || "Error al publicar");
      }

      if (data?.error) {
        console.error("[usePublishToWordPressSaas] Backend returned error:", data.error);
        throw new Error(data.error);
      }

      console.log("[usePublishToWordPressSaas] Success:", data);
      return data as PublishResultSaas;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Artículo publicado en WordPress");
      }
    },
    onError: (error: Error) => {
      console.error("[usePublishToWordPressSaas] Mutation error:", error);

      // More descriptive toast messages
      if (error.message.includes("No se pudo conectar")) {
        toast.error("Error de conexión. Revisa tu red o extensiones del navegador.");
      } else {
        toast.error(`Error: ${error.message}`);
      }
    },
  });
}

export function useGenerateArticleSaas() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addGenerating, removeGenerating } = useGeneration();

  return useMutation({
    mutationFn: async (params: GenerateArticleParams) => {
      if (!user?.id) throw new Error("No user logged in");

      addGenerating(params.siteId);
      toast.info("Generando artículo... puedes navegar libremente", {
        duration: 60000,
        id: `gen-${params.siteId}`,
      });

      const { data, error } = await supabase.functions.invoke("generate-article-saas", {
        body: {
          siteId: params.siteId,
          topic: params.topic || null,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      });

      if (error) {
        // Check if error response contains JSON with more details
        if (typeof error === "object" && error.message) {
          throw new Error(error.message);
        }
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSettled: (_, __, params) => {
      removeGenerating(params.siteId);
      toast.dismiss(`gen-${params.siteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Artículo generado correctamente");
    },
    onError: (error: any) => {
      console.error("Generate article error:", error);
      const message = error?.message || "Error al generar el artículo";

      if (message.toLowerCase().includes("artículo de prueba") || message.toLowerCase().includes("prueba")) {
        toast.error(
          "Ya usaste tu artículo de prueba. Si quieres seguir, te ayudamos a ampliar el plan desde Facturación.",
        );
      } else if (message.toLowerCase().includes("límite")) {
        toast.error(
          "Has llegado al límite de tu plan. Si quieres seguir publicando, te ayudamos a ampliarlo desde Facturación.",
        );
      } else if (message.includes("Rate limit")) {
        toast.error("Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.");
      } else if (message.includes("Payment required")) {
        toast.error("Créditos agotados. Añade más créditos para continuar.");
      } else {
        toast.error(message);
      }
    },
  });
}

export interface ArticleContent {
  title: string;
  seo_title?: string;
  excerpt?: string;
  focus_keyword?: string;
  meta_description: string;
  slug: string;
  content: string;
}

export interface Article {
  id: string;
  site_id: string;
  user_id: string;
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
  week_of_month: number | null;
  day_of_month: number | null;
  wp_post_url: string | null;
}

export function useArticlesSaas(siteId: string | undefined, month?: number, year?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["articles", siteId, month, year],
    queryFn: async (): Promise<Article[]> => {
      if (!user?.id || !siteId) return [];

      // RLS handles access control (own + team articles)
      let query = supabase.from("articles").select("*").eq("site_id", siteId);

      if (month !== undefined) {
        query = query.eq("month", month);
      }
      if (year !== undefined) {
        query = query.eq("year", year);
      }

      const { data, error } = await query.order("generated_at", { ascending: false });

      if (error) {
        console.error("Error fetching articles:", error);
        throw error;
      }

      return (data ?? []) as unknown as Article[];
    },
    enabled: !!user?.id && !!siteId,
  });
}

export function useAllArticlesSaas(month: number, year: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["articles", "all", month, year],
    queryFn: async (): Promise<Article[]> => {
      if (!user?.id) return [];

      // RLS handles access control (own + team articles)
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .order("generated_at", { ascending: false });

      if (error) {
        console.error("Error fetching all articles:", error);
        throw error;
      }

      return (data ?? []) as unknown as Article[];
    },
    enabled: !!user?.id,
  });
}

export function useDeleteArticleSaas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // 1. Get image_url before deleting
      const { data: article } = await supabase.from("articles").select("image_url").eq("id", id).maybeSingle();

      // 2. Delete image from storage if it's in article-images bucket
      if (article?.image_url && article.image_url.includes("article-images")) {
        try {
          const url = new URL(article.image_url);
          const bucketPath = url.pathname.split("/article-images/")[1];
          if (bucketPath) {
            await supabase.storage.from("article-images").remove([decodeURIComponent(bucketPath)]);
          }
        } catch (e) {
          console.warn("Failed to delete image from storage:", e);
        }
      }

      // 3. Delete the article row
      const { error } = await supabase.from("articles").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Artículo eliminado");
    },
    onError: (error) => {
      console.error("Error deleting article:", error);
      toast.error("Error al eliminar el artículo");
    },
  });
}

// Regenerate image hook
interface RegenerateImageParams {
  articleId: string;
  pexelsQuery: string;
  articleTitle?: string;
  articleContent?: string;
  companySector?: string;
  usedImageUrls?: string[];
}

export function useRegenerateImageSaas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RegenerateImageParams) => {
      const { data, error } = await supabase.functions.invoke("regenerate-image", {
        body: {
          pexelsQuery: params.pexelsQuery,
          articleTitle: params.articleTitle,
          articleContent: params.articleContent,
          companySector: params.companySector,
          usedImageUrls: params.usedImageUrls || [],
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No se obtuvo imagen");

      // Update article with new image
      const { error: updateError } = await supabase
        .from("articles")
        .update({
          image_url: data.url,
          image_photographer: data.photographer,
          image_photographer_url: data.photographer_url,
        })
        .eq("id", params.articleId);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Imagen actualizada");
    },
    onError: (error: Error) => {
      console.error("Error regenerating image:", error);
      toast.error(`Error: ${error.message}`);
    },
  });
}
