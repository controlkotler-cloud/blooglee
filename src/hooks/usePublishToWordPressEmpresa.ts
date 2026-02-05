import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PublishToWordPressEmpresaInput {
  empresa_id: string;
  title: string;
  content: string;
  slug: string;
  status: "publish" | "draft" | "future";
  date?: string;
  image_url?: string;
  image_alt?: string;
  meta_description?: string;
  seo_title?: string;
  focus_keyword?: string;
  excerpt?: string;
  lang?: "es" | "ca";
  category_ids?: number[];
  tag_ids?: number[];
}

export interface PublishResult {
  success: boolean;
  post_id?: number;
  post_url?: string;
  status?: string;
  date?: string;
  error?: string;
}

export function usePublishToWordPressEmpresa() {
  return useMutation({
    mutationFn: async (input: PublishToWordPressEmpresaInput): Promise<PublishResult> => {
      const { data, error } = await supabase.functions.invoke("publish-to-wordpress", {
        body: {
          empresa_id: input.empresa_id,
          title: input.title,
          content: input.content,
          slug: input.slug,
          status: input.status,
          date: input.date,
          image_url: input.image_url,
          image_alt: input.image_alt,
          meta_description: input.meta_description,
        seo_title: input.seo_title,
        focus_keyword: input.focus_keyword,
        excerpt: input.excerpt,
          lang: input.lang,
          category_ids: input.category_ids,
          tag_ids: input.tag_ids,
        },
      });

      if (error) {
        throw new Error(error.message || "Error al publicar en WordPress");
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
