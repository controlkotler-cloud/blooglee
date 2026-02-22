import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
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
  created_at: string;
}

export interface FormattedBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  readTime: string;
  category: string;
  seoKeywords: string[];
  author: {
    name: string;
    avatar: string;
    role: string;
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function calculateReadTime(content: string): string {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min`;
}

function transformPost(post: BlogPost): FormattedBlogPost {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    image: post.image_url || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop",
    date: formatDate(post.published_at),
    readTime: calculateReadTime(post.content),
    category: post.category,
    seoKeywords: post.seo_keywords || [],
    author: {
      name: post.author_name,
      avatar: post.author_avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      role: post.author_role || "Blooglee Team",
    },
  };
}

export function useBlogPosts(audience?: string, category?: string) {
  return useQuery({
    queryKey: ["blog_posts", audience, category],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      // Filter by audience if specified
      if (audience && audience !== "todos") {
        query = query.eq("audience", audience.toLowerCase());
      }

      // Filter by thematic category if specified
      if (category && category !== "Todos") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching blog posts:", error);
        throw error;
      }

      return (data || []).map(transformPost);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAudienceCounts() {
  return useQuery({
    queryKey: ["audience_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("audience")
        .eq("is_published", true);

      if (error) {
        console.error("Error fetching audience counts:", error);
        throw error;
      }

      const counts: Record<string, number> = { empresas: 0, agencias: 0 };
      (data || []).forEach((post) => {
        const aud = post.audience?.toLowerCase() || 'general';
        if (aud === 'empresas' || aud === 'agencias') {
          counts[aud] = (counts[aud] || 0) + 1;
        }
      });

      return counts;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ["blog_post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching blog post:", error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return transformPost(data);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRelatedPosts(currentSlug: string, category: string, limit: number = 2) {
  return useQuery({
    queryKey: ["related_posts", currentSlug, category, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .eq("category", category)
        .neq("slug", currentSlug)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching related posts:", error);
        throw error;
      }

      return (data || []).map(transformPost);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ["blog_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("category")
        .eq("is_published", true);

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }

      // Count posts per category
      const counts: Record<string, number> = {};
      (data || []).forEach((post) => {
        counts[post.category] = (counts[post.category] || 0) + 1;
      });

      return counts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
