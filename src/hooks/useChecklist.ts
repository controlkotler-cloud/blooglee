import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChecklistItem {
  id: string;
  user_id: string;
  site_id: string;
  step_key: string;
  status: string;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const STEP_ORDER = [
  'business_setup',
  'style_setup',
  'first_article',
  'wordpress_connect',
  'first_publish',
  'content_profile',
  'auto_publish',
];

export function useChecklist(siteId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['checklist', user?.id, siteId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      if (!user?.id) return [];

      let q = supabase
        .from('onboarding_checklist')
        .select('*')
        .eq('user_id', user.id);

      if (siteId) {
        q = q.eq('site_id', siteId);
      }

      const { data, error } = await q;
      if (error) {
        console.error('Error fetching checklist:', error);
        return [];
      }

      // Sort by predefined order
      const items = (data ?? []) as unknown as ChecklistItem[];
      return items.sort(
        (a, b) => STEP_ORDER.indexOf(a.step_key) - STEP_ORDER.indexOf(b.step_key)
      );
    },
    enabled: !!user?.id,
  });

  const checklistItems = query.data ?? [];
  const completedCount = checklistItems.filter(i => i.status === 'completed').length;
  const totalCount = checklistItems.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isChecklistComplete = totalCount > 0 && completedCount === totalCount;

  const updateStepMutation = useMutation({
    mutationFn: async ({
      stepKey,
      status,
      metadata,
    }: {
      stepKey: string;
      status: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error('No user');

      const updates: Record<string, unknown> = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      if (metadata) {
        updates.metadata = metadata;
      }

      let q = supabase
        .from('onboarding_checklist')
        .update(updates)
        .eq('user_id', user.id)
        .eq('step_key', stepKey);

      if (siteId) {
        q = q.eq('site_id', siteId);
      }

      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });

  const updateStep = (stepKey: string, status: string, metadata?: Record<string, unknown>) => {
    updateStepMutation.mutate({ stepKey, status, metadata });
  };

  const getNextPendingStep = (): string | null => {
    const pending = checklistItems.find(i => i.status === 'pending');
    return pending?.step_key ?? null;
  };

  return {
    checklistItems,
    completedCount,
    totalCount,
    progressPercentage,
    isChecklistComplete,
    isLoading: query.isLoading,
    updateStep,
    getNextPendingStep,
  };
}
