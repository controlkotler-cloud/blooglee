import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WordPressDiagnostic {
  id: string;
  status: string;
  message: string | null;
  checked_at: string | null;
}

export function useWordPressDiagnostic(
  siteId: string | undefined,
  checkType: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["wordpress-diagnostics", checkType, siteId],
    queryFn: async () => {
      if (!siteId) return null;

      const { data, error } = await supabase
        .from("wordpress_diagnostics")
        .select("id, status, message, checked_at")
        .eq("site_id", siteId)
        .eq("check_type", checkType)
        .order("checked_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching ${checkType} diagnostic:`, error);
        return null;
      }

      return data as WordPressDiagnostic | null;
    },
    enabled: enabled && !!siteId,
  });
}
