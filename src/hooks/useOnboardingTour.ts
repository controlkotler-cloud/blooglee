import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useOnboardingTour() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: onboardingCompleted, isLoading } = useQuery({
    queryKey: ['onboarding_completed', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) return true;

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching onboarding status:', error);
        return true; // Default to completed to avoid showing tour on error
      }

      return data?.onboarding_completed ?? false;
    },
    enabled: !!user?.id,
  });

  const completeTourMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding_completed', user?.id] });
    },
  });

  return {
    shouldShowTour: !isLoading && !onboardingCompleted,
    isLoading,
    completeTour: completeTourMutation.mutate,
  };
}
