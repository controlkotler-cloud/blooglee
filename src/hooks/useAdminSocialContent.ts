import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SocialContent {
  id: string;
  blog_post_id: string | null;
  platform: string;
  content_type: string;
  title: string;
  content: string;
  media_prompt: string | null;
  image_url: string | null;
  status: string;
  scheduled_for: string | null;
  metricool_post_id: string | null;
  language: string;
  created_at: string;
  blog_post_url?: string | null;
}

export function useAdminSocialContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-social-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_content' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SocialContent[];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (params: {
      blogPostId?: string;
      platform: string;
      contentType: string;
      language: string;
      customTopic?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-social-content', {
        body: params,
      });
      if (error) throw error;
      return data as SocialContent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-content'] });
      toast({ title: 'Contenido generado', description: 'El contenido social se ha creado correctamente.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Error al generar contenido', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_content' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-content'] });
      toast({ title: 'Eliminado' });
    },
  });

  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const scheduleMutation = useMutation({
    mutationFn: async (params: { socialContentId: string; scheduledDate?: string; scheduledTimezone?: string }) => {
      setSchedulingId(params.socialContentId);
      const { data, error } = await supabase.functions.invoke('schedule-metricool-post', {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      setSchedulingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-social-content'] });
      toast({ title: '✅ Programado en Metricool', description: `Post programado en ${data?.platform || 'la red social'}` });
    },
    onError: (err: any) => {
      setSchedulingId(null);
      toast({ title: 'Error en Metricool', description: err.message || 'No se pudo programar', variant: 'destructive' });
    },
  });

  return {
    items,
    isLoading,
    generate: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    deleteItem: deleteMutation.mutateAsync,
    scheduleToMetricool: scheduleMutation.mutateAsync,
    schedulingId,
  };
}
