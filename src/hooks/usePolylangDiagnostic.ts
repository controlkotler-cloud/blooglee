import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PolylangDiagnostic {
  id: string;
  status: string;
  message: string | null;
  checked_at: string | null;
}

export function usePolylangDiagnostic(siteId: string | undefined) {
  return useQuery({
    queryKey: ['wordpress-diagnostics', 'polylang', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      const { data, error } = await supabase
        .from('wordpress_diagnostics')
        .select('id, status, message, checked_at')
        .eq('site_id', siteId)
        .eq('check_type', 'polylang')
        .order('checked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching polylang diagnostic:', error);
        return null;
      }

      return data as PolylangDiagnostic | null;
    },
    enabled: !!siteId,
  });
}
