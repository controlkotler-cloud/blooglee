import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaxonomySaas {
  id: string;
  wordpress_config_id: string;
  user_id: string;
  taxonomy_type: 'category' | 'tag';
  wp_id: number;
  name: string;
  slug: string | null;
  created_at: string;
}

export function useTaxonomiesSaas(wordpressConfigId: string | undefined) {
  return useQuery({
    queryKey: ['wordpress-taxonomies-saas', wordpressConfigId],
    queryFn: async () => {
      if (!wordpressConfigId) return { categories: [], tags: [] };

      const { data, error } = await supabase
        .from('wordpress_taxonomies_saas')
        .select('*')
        .eq('wordpress_config_id', wordpressConfigId)
        .order('name');

      if (error) {
        console.error('Error fetching taxonomies:', error);
        throw error;
      }

      const taxonomies = (data || []) as unknown as TaxonomySaas[];
      
      return {
        categories: taxonomies.filter(t => t.taxonomy_type === 'category'),
        tags: taxonomies.filter(t => t.taxonomy_type === 'tag'),
      };
    },
    enabled: !!wordpressConfigId,
  });
}

export function useSyncTaxonomiesSaas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wordpressConfigId: string) => {
      const { data, error } = await supabase.functions.invoke('sync-wordpress-taxonomies-saas', {
        body: { wordpress_config_id: wordpressConfigId }
      });

      if (error) {
        console.error('Sync error:', error);
        throw new Error(error.message || 'Error al sincronizar');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data, wordpressConfigId) => {
      queryClient.invalidateQueries({ queryKey: ['wordpress-taxonomies-saas', wordpressConfigId] });
      toast.success(`Sincronizadas ${data.categories} categorías y ${data.tags} tags`);
    },
    onError: (error: Error) => {
      console.error('Sync mutation error:', error);
      toast.error(`Error: ${error.message}`);
    }
  });
}
