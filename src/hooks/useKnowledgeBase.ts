import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KnowledgeArticle {
  id: string;
  slug: string;
  category: string;
  subcategory: string | null;
  priority: string;
  error_code: string | null;
  title: string;
  symptoms: string[];
  cause: string | null;
  solution: string;
  solution_steps: Record<string, unknown> | null;
  snippet_code: string | null;
  related_plugins: string[];
  help_url: string | null;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface CategoryCount {
  category: string;
  count: number;
  icon: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  seguridad: '🔒',
  multiidioma: '🌍',
  permisos: '👤',
  cache: '⚡',
  hosting: '🖥️',
  seo: '📈',
  temas: '🎨',
  api_rest: '🔌',
  medios: '📷',
  ssl: '🔐',
  performance: '⏱️',
  core: '⚙️',
  database: '🗄️',
  contenido: '📝',
  taxonomias: '🏷️',
};

export function useKnowledgeBase() {
  return useQuery({
    queryKey: ['knowledge_base'],
    queryFn: async (): Promise<KnowledgeArticle[]> => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('priority', { ascending: true })
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching knowledge base:', error);
        throw error;
      }

      return (data || []) as KnowledgeArticle[];
    },
  });
}

export function useKnowledgeArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ['knowledge_base', slug],
    queryFn: async (): Promise<KnowledgeArticle | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('Error fetching article:', error);
        throw error;
      }

      return data as KnowledgeArticle | null;
    },
    enabled: !!slug,
  });
}

export function useKnowledgeCategories() {
  return useQuery({
    queryKey: ['knowledge_base_categories'],
    queryFn: async (): Promise<CategoryCount[]> => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('category');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      // Count articles per category
      const counts: Record<string, number> = {};
      for (const article of data || []) {
        counts[article.category] = (counts[article.category] || 0) + 1;
      }

      return Object.entries(counts).map(([category, count]) => ({
        category,
        count,
        icon: CATEGORY_ICONS[category] || '📄',
      }));
    },
  });
}

export function useSearchKnowledgeBase(query: string) {
  return useQuery({
    queryKey: ['knowledge_base_search', query],
    queryFn: async (): Promise<KnowledgeArticle[]> => {
      if (!query.trim()) return [];

      const searchTerms = query.toLowerCase().split(/\s+/);

      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*');

      if (error) {
        console.error('Error searching knowledge base:', error);
        throw error;
      }

      // Client-side filtering since we don't have full-text search
      const scored = (data || []).map((article: any) => {
        const text = [
          article.title,
          article.cause,
          article.solution,
          ...(article.symptoms || []),
          ...(article.keywords || []),
          ...(article.related_plugins || []),
        ].join(' ').toLowerCase();

        let score = 0;
        for (const term of searchTerms) {
          if (text.includes(term)) score++;
        }

        return { article, score };
      });

      return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(s => s.article);
    },
    enabled: query.trim().length >= 2,
  });
}

export function useHighPriorityArticles(limit = 5) {
  return useQuery({
    queryKey: ['knowledge_base_high_priority', limit],
    queryFn: async (): Promise<KnowledgeArticle[]> => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('priority', 'alta')
        .limit(limit);

      if (error) {
        console.error('Error fetching high priority articles:', error);
        throw error;
      }

      return (data || []) as KnowledgeArticle[];
    },
  });
}
