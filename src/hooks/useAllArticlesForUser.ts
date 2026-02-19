import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Article } from './useArticlesSaas';

export function useAllArticlesForUser() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['articles', 'all-user', user?.id],
    queryFn: async (): Promise<Article[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Error fetching all user articles:', error);
        throw error;
      }

      return (data ?? []) as unknown as Article[];
    },
    enabled: !!user?.id,
  });
}
