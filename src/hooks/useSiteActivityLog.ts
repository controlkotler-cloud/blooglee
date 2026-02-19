import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ActivityLogEntry {
  id: string;
  site_id: string;
  user_id: string;
  action_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useSiteActivityLog(siteId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['site-activity-log', siteId],
    queryFn: async (): Promise<ActivityLogEntry[]> => {
      if (!user || !siteId) return [];
      const { data, error } = await supabase
        .from('site_activity_log')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as ActivityLogEntry[];
    },
    enabled: !!user && !!siteId,
  });
}
