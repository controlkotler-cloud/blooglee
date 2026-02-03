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
      console.log('Calling sync-wordpress-taxonomies-saas with config:', wordpressConfigId);
      
      const { data, error } = await supabase.functions.invoke('sync-wordpress-taxonomies-saas', {
        body: { wordpress_config_id: wordpressConfigId, analyze_content: true }
      });

      console.log('Sync response:', { data, error });

      if (error) {
        console.error('Sync invoke error:', error);
        throw new Error(error.message || 'Error al sincronizar');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data, wordpressConfigId) => {
      queryClient.invalidateQueries({ queryKey: ['wordpress-taxonomies-saas', wordpressConfigId] });
      queryClient.invalidateQueries({ queryKey: ['sites'] }); // Refresh sites to get updated wordpress_context
      
      // Show detailed feedback
      const taxonomyMsg = `${data.categories} categorías y ${data.tags} tags sincronizados`;
      
      if (data.content_analyzed && data.wordpress_context) {
        const topicsCount = data.wordpress_context.lastTopics?.length || 0;
        toast.success(`${taxonomyMsg}. Contexto WordPress guardado (${topicsCount} temas analizados).`);
      } else if (data.content_analyzed === false) {
        toast.success(taxonomyMsg);
      } else {
        // content_analyzed true but no wordpress_context - something went wrong
        toast.warning(`${taxonomyMsg}, pero no se pudo guardar el contexto de WordPress.`);
      }
    },
    onError: (error: Error) => {
      console.error('Sync mutation error:', error);
      toast.error(`Error al sincronizar: ${error.message}`);
    }
  });
}
