import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export interface OnboardingStepData {
  step1?: {
    business_name?: string;
    business_type?: string;
    sector?: string;
    location?: string;
    scope?: string;
    website_url?: string;
    business_description?: string;
    detected_blog_url?: string;
    detected_social_url?: string;
    detected_languages?: string[];
    detected_colors?: string[];
    tone_suggestion?: string;
    audience_suggestion?: string;
    content_goal_suggestion?: string;
    editorial_focus_suggestion?: string;
    keywords_suggestion?: string;
    extracted_from_website?: boolean;
  };
  step2?: {
    tone?: string;
    audience?: string;
    custom_topic?: string;
    content_goal?: string;
    content_pillars?: string[];
    preferred_length?: string;
  };
  step2b?: {
    mood?: string;
    use_brand_colors?: boolean;
  };
  step3?: {
    selected_topic?: string;
    topic_options?: string[];
  };
  step_content_prefs?: {
    catalan?: boolean;
    include_featured_image?: boolean;
    instagram_url?: string;
    avoid_topics?: string;
    priority_topics?: string;
    angle_to_avoid?: string;
    preferred_source_domains?: string;
  };
  step_scheduling?: {
    auto_generate?: boolean;
    frequency?: string;
    day_of_week?: string;
    local_hour?: string;
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
  const [progress, setProgressState] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const progressRef = useRef<OnboardingProgress | null>(null);

  // Wrapper to keep ref in sync with state
  const setProgress = useCallback(
    (updater: OnboardingProgress | null | ((prev: OnboardingProgress | null) => OnboardingProgress | null)) => {
      if (typeof updater !== "function") {
        // Direct value: update ref immediately so subsequent sync reads see it
        progressRef.current = updater;
      }
      setProgressState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        progressRef.current = next;
        return next;
      });
    },
    [],
  );

  // Load or create onboarding progress
  useEffect(() => {
    mountedRef.current = true;
    if (!user?.id) return;

    const loadProgress = async () => {
      setIsLoading(true);
      try {
        // Try to find existing progress (any site if siteId not specified)
        let query = supabase
          .from("onboarding_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("wizard_completed", false)
          .order("created_at", { ascending: false })
          .limit(1);

        if (siteId) {
          query = supabase
            .from("onboarding_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("site_id", siteId)
            .limit(1);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error loading onboarding progress:", error);
          return;
        }

        if (mountedRef.current) {
          if (data && data.length > 0) {
            const record = data[0] as unknown as OnboardingProgress;
            // Only reset to step 1 if this is the very first load (no progress loaded yet)
            // and there's no specific siteId — prevents resetting during active sessions
            if (!siteId && !record.wizard_completed && record.current_step > 1 && !progressRef.current) {
              // Check if progress is stale (older than 30 minutes)
              const updatedAt = new Date(record.updated_at).getTime();
              const isStale = Date.now() - updatedAt > 30 * 60 * 1000;
              if (isStale) {
                record.current_step = 1;
                record.step_data = {};
                supabase
                  .from("onboarding_progress")
                  .update({ current_step: 1, step_data: {} } as any)
                  .eq("id", record.id)
                  .then();
              }
            }
            setProgress(record);
          } else {
            setProgress(null);
          }
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    loadProgress();
    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, siteId]);

  // Create a new onboarding progress for a site
  const createProgress = useCallback(
    async (newSiteId: string) => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("onboarding_progress")
        .insert([
          {
            user_id: user.id,
            site_id: newSiteId,
            current_step: 1,
            wizard_completed: false,
            checklist_completed: false,
            step_data: {},
          },
        ] as any)
        .select()
        .single();

      if (error) {
        console.error("Error creating onboarding progress:", error);
        return null;
      }

      const record = data as unknown as OnboardingProgress;
      setProgress(record);
      return record;
    },
    [user?.id],
  );

  // Save step data (optimistic + async persist)
  const saveStepData = useCallback(
    async (stepKey: string, data: object) => {
      const current = progressRef.current;
      if (!current) return;

      const newStepData = { ...current.step_data, [stepKey]: data };
      const updated = { ...current, step_data: newStepData };

      // Update ref immediately so subsequent sync calls (e.g. nextStep) see latest data
      progressRef.current = updated;

      // Optimistic state update
      setProgress(updated);

      // Persist
      const { error } = await supabase
        .from("onboarding_progress")
        .update({ step_data: newStepData } as any)
        .eq("id", current.id);

      if (error) console.error("Error saving step data:", error);
    },
    [setProgress],
  );

  // Navigate steps
  const MAX_STEP = 9;

  const nextStep = useCallback(async () => {
    const current = progressRef.current;
    if (!current || current.current_step >= MAX_STEP) return;

    const newStep = current.current_step + 1;
    setProgress((prev) => (prev ? { ...prev, current_step: newStep } : null));

    const { error } = await supabase.from("onboarding_progress").update({ current_step: newStep }).eq("id", current.id);

    if (error) console.error("Error advancing step:", error);
  }, [setProgress]);

  const prevStep = useCallback(async () => {
    const current = progressRef.current;
    if (!current || current.current_step <= 1) return;

    const newStep = current.current_step - 1;
    setProgress((prev) => (prev ? { ...prev, current_step: newStep } : null));

    const { error } = await supabase.from("onboarding_progress").update({ current_step: newStep }).eq("id", current.id);

    if (error) console.error("Error going back:", error);
  }, [setProgress]);

  const goToStep = useCallback(
    async (step: number) => {
      const current = progressRef.current;
      if (!current) return;

      setProgress((prev) => (prev ? { ...prev, current_step: step } : null));

      const { error } = await supabase.from("onboarding_progress").update({ current_step: step }).eq("id", current.id);

      if (error) console.error("Error setting step:", error);
    },
    [setProgress],
  );

  const completeWizard = useCallback(async () => {
    const current = progressRef.current;
    if (!current) return;

    setProgress((prev) => (prev ? { ...prev, wizard_completed: true } : null));

    const { error } = await supabase
      .from("onboarding_progress")
      .update({ wizard_completed: true })
      .eq("id", current.id);

    if (error) console.error("Error completing wizard:", error);

    // Invalidate sites query so ProtectedRoute sees the new site
    queryClient.invalidateQueries({ queryKey: ["sites"] });
  }, [setProgress, queryClient]);

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
