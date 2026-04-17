import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  category: string;
  author_name: string;
  author_avatar: string | null;
  author_role: string | null;
  read_time: string;
  published_at: string;
  is_published: boolean;
  seo_keywords: string[] | null;
  audience: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

export function useAllAdminBlogPosts() {
  return useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async (): Promise<AdminBlogPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as AdminBlogPost[]) || [];
    },
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<AdminBlogPost>) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert([input as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog_posts"] });
      toast.success("Post creado");
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AdminBlogPost> & { id: string }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ ...input, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog_posts"] });
      toast.success("Post actualizado");
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog_posts"] });
      toast.success("Post eliminado");
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);
}
