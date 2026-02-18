import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export interface OnboardingStepData {
  step1?: {
    business_name?: string;
    sector?: string;
    location?: string;
    scope?: string;
    website_url?: string;
  };
  step2?: {
    tone?: string;
    audience?: string;
  };
  step2b?: {
    mood?: string;
    use_brand_colors?: boolean;
  };
  step3?: {
    selected_topic?: string;
    topic_options?: string[];
  };
  step5?: {
    article_id?: string;
  };
  [key: string]: unknown;
}

interface OnboardingProgress {
  id: string;
  user_id: string;
  site_id: string;
  current_step: number;
  wizard_completed: boolean;
  checklist_completed: boolean;
  step_data: OnboardingStepData;
  created_at: string;
  updated_at: string;
}

export function useOnboarding(siteId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // Load or create onboarding progress
  useEffect(() => {
    mountedRef.current = true;
    if (!user?.id) return;

    const loadProgress = async () => {
      setIsLoading(true);
      try {
        // Try to find existing progress (any site if siteId not specified)
        let query = supabase
          .from('onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('wizard_completed', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (siteId) {
          query = supabase
            .from('onboarding_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('site_id', siteId)
            .limit(1);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error loading onboarding progress:', error);
          return;
        }

        if (mountedRef.current) {
          if (data && data.length > 0) {
            setProgress(data[0] as unknown as OnboardingProgress);
          } else {
            setProgress(null);
          }
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    loadProgress();
    return () => { mountedRef.current = false; };
  }, [user?.id, siteId]);

  // Create a new onboarding progress for a site
  const createProgress = useCallback(async (newSiteId: string) => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('onboarding_progress')
      .insert([{
        user_id: user.id,
        site_id: newSiteId,
        current_step: 1,
        wizard_completed: false,
        checklist_completed: false,
        step_data: {},
      }] as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating onboarding progress:', error);
      return null;
    }

    const record = data as unknown as OnboardingProgress;
    setProgress(record);
    return record;
  }, [user?.id]);

  // Save step data (optimistic + async persist)
  const saveStepData = useCallback(async (stepKey: string, data: object) => {
    if (!progress) return;

    const newStepData = { ...progress.step_data, [stepKey]: data };

    // Optimistic update
    setProgress(prev => prev ? { ...prev, step_data: newStepData } : null);

    // Persist
    const { error } = await supabase
      .from('onboarding_progress')
      .update({ step_data: newStepData } as any)
      .eq('id', progress.id);

    if (error) console.error('Error saving step data:', error);
  }, [progress]);

  // Navigate steps
  const nextStep = useCallback(async () => {
    if (!progress) return;

    const newStep = progress.current_step + 1;
    setProgress(prev => prev ? { ...prev, current_step: newStep } : null);

    const { error } = await supabase
      .from('onboarding_progress')
      .update({ current_step: newStep })
      .eq('id', progress.id);

    if (error) console.error('Error advancing step:', error);
  }, [progress]);

  const prevStep = useCallback(async () => {
    if (!progress || progress.current_step <= 1) return;

    const newStep = progress.current_step - 1;
    setProgress(prev => prev ? { ...prev, current_step: newStep } : null);

    const { error } = await supabase
      .from('onboarding_progress')
      .update({ current_step: newStep })
      .eq('id', progress.id);

    if (error) console.error('Error going back:', error);
  }, [progress]);

  const goToStep = useCallback(async (step: number) => {
    if (!progress) return;

    setProgress(prev => prev ? { ...prev, current_step: step } : null);

    const { error } = await supabase
      .from('onboarding_progress')
      .update({ current_step: step })
      .eq('id', progress.id);

    if (error) console.error('Error setting step:', error);
  }, [progress]);

  const completeWizard = useCallback(async () => {
    if (!progress) return;

    setProgress(prev => prev ? { ...prev, wizard_completed: true } : null);

    const { error } = await supabase
      .from('onboarding_progress')
      .update({ wizard_completed: true })
      .eq('id', progress.id);

    if (error) console.error('Error completing wizard:', error);

    // Invalidate sites query so ProtectedRoute sees the new site
    queryClient.invalidateQueries({ queryKey: ['sites'] });
  }, [progress, queryClient]);

  return {
    progress,
    currentStep: progress?.current_step ?? 1,
    stepData: progress?.step_data ?? {},
    wizardCompleted: progress?.wizard_completed ?? false,
    isLoading,
    siteId: progress?.site_id,
    createProgress,
    saveStepData,
    nextStep,
    prevStep,
    goToStep,
    completeWizard,
  };
}
