import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Site {
  id: string;
  user_id: string;
  name: string;
  sector: string | null;
  description: string | null;
  location: string | null;
  geographic_scope: 'local' | 'regional' | 'national' | 'international';
  languages: string[];
  blog_url: string | null;
  instagram_url: string | null;
  auto_generate: boolean;
  custom_topic: string | null;
  include_featured_image: boolean;
  publish_frequency: string;
  created_at: string;
  updated_at: string;
}

export interface SiteInput {
  name: string;
  sector?: string | null;
  description?: string | null;
  location?: string | null;
  geographic_scope?: 'local' | 'regional' | 'national' | 'international';
  languages?: string[];
  blog_url?: string | null;
  instagram_url?: string | null;
  auto_generate?: boolean;
  custom_topic?: string | null;
  include_featured_image?: boolean;
  publish_frequency?: string;
}

export function useSites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sites', user?.id],
    queryFn: async (): Promise<Site[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching sites:', error);
        throw error;
      }

      return data as Site[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (site: SiteInput): Promise<Site> => {
      if (!user?.id) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('sites')
        .insert({
          user_id: user.id,
          name: site.name,
          sector: site.sector ?? null,
          description: site.description ?? null,
          location: site.location ?? null,
          geographic_scope: site.geographic_scope ?? 'local',
          languages: site.languages ?? ['spanish'],
          blog_url: site.blog_url ?? null,
          instagram_url: site.instagram_url ?? null,
          auto_generate: site.auto_generate ?? true,
          custom_topic: site.custom_topic ?? null,
          include_featured_image: site.include_featured_image ?? true,
          publish_frequency: site.publish_frequency ?? 'monthly',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Site;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Sitio creado correctamente');
    },
    onError: (error) => {
      console.error('Error creating site:', error);
      toast.error('Error al crear el sitio');
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (site: Partial<SiteInput> & { id: string }): Promise<Site> => {
      const { id, ...updates } = site;

      const { data, error } = await supabase
        .from('sites')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Site;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Sitio actualizado');
    },
    onError: (error) => {
      console.error('Error updating site:', error);
      toast.error('Error al actualizar el sitio');
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Sitio eliminado');
    },
    onError: (error) => {
      console.error('Error deleting site:', error);
      toast.error('Error al eliminar el sitio');
    },
  });
}
