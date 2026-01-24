import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ArticleContent {
  title: string;
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
}

export function useArticlesSaas(siteId: string | undefined, month?: number, year?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['articles', siteId, month, year],
    queryFn: async (): Promise<Article[]> => {
      if (!user?.id || !siteId) return [];

      let query = supabase
        .from('articles')
        .select('*')
        .eq('site_id', siteId)
        .eq('user_id', user.id);

      if (month !== undefined) {
        query = query.eq('month', month);
      }
      if (year !== undefined) {
        query = query.eq('year', year);
      }

      const { data, error } = await query.order('generated_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
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
    queryKey: ['articles', 'all', month, year],
    queryFn: async (): Promise<Article[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Error fetching all articles:', error);
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
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Artículo eliminado');
    },
    onError: (error) => {
      console.error('Error deleting article:', error);
      toast.error('Error al eliminar el artículo');
    },
  });
}
