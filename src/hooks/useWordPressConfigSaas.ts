import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface WordPressConfig {
  id: string;
  site_id: string;
  user_id: string;
  site_url: string;
  wp_username: string;
  wp_app_password: string;
  created_at: string;
  updated_at: string;
}

export interface WordPressConfigInput {
  site_id: string;
  site_url: string;
  wp_username: string;
  wp_app_password: string;
}

export function useWordPressConfig(siteId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wordpress_configs', siteId],
    queryFn: async (): Promise<WordPressConfig | null> => {
      if (!user?.id || !siteId) return null;

      const { data, error } = await supabase
        .from('wordpress_configs')
        .select('*')
        .eq('site_id', siteId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching WordPress config:', error);
        return null;
      }

      return data as WordPressConfig | null;
    },
    enabled: !!user?.id && !!siteId,
  });
}

export function useUpsertWordPressConfig() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (config: WordPressConfigInput): Promise<WordPressConfig> => {
      if (!user?.id) throw new Error('No user logged in');

      // Check if config exists
      const { data: existing } = await supabase
        .from('wordpress_configs')
        .select('id')
        .eq('site_id', config.site_id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('wordpress_configs')
          .update({
            site_url: config.site_url,
            wp_username: config.wp_username,
            wp_app_password: config.wp_app_password,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as WordPressConfig;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('wordpress_configs')
          .insert({
            site_id: config.site_id,
            user_id: user.id,
            site_url: config.site_url,
            wp_username: config.wp_username,
            wp_app_password: config.wp_app_password,
          })
          .select()
          .single();

        if (error) throw error;
        return data as WordPressConfig;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_configs', variables.site_id] });
      toast.success('Configuración de WordPress guardada');
    },
    onError: (error) => {
      console.error('Error saving WordPress config:', error);
      toast.error('Error al guardar la configuración');
    },
  });
}

export function useDeleteWordPressConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (siteId: string): Promise<void> => {
      const { error } = await supabase
        .from('wordpress_configs')
        .delete()
        .eq('site_id', siteId);

      if (error) throw error;
    },
    onSuccess: (_, siteId) => {
      queryClient.invalidateQueries({ queryKey: ['wordpress_configs', siteId] });
      toast.success('Configuración de WordPress eliminada');
    },
    onError: (error) => {
      console.error('Error deleting WordPress config:', error);
      toast.error('Error al eliminar la configuración');
    },
  });
}
