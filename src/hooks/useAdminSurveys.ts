import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface SurveyQuestion {
  id: string;
  type: 'rating' | 'boolean' | 'text' | 'select';
  question: string;
  scale?: number;
  options?: string[];
  conditional?: string;
}

export interface Survey {
  id: string;
  name: string;
  trigger_type: string;
  trigger_days_offset: number;
  questions: SurveyQuestion[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponse {
  id: string;
  user_id: string;
  survey_id: string;
  responses: Record<string, any>;
  completed_at: string;
  user_email?: string;
}

export function useAdminSurveys() {
  return useQuery({
    queryKey: ['admin-surveys'],
    queryFn: async (): Promise<Survey[]> => {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast questions from Json to SurveyQuestion[]
      return (data || []).map(survey => ({
        ...survey,
        questions: (survey.questions as unknown as SurveyQuestion[]) || [],
      }));
    },
  });
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, questions, ...updates }: Partial<Survey> & { id: string }) => {
      const updateData: Record<string, any> = { ...updates };
      if (questions) {
        updateData.questions = questions as unknown as Json;
      }
      
      const { error } = await supabase
        .from('surveys')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] });
    },
  });
}

export function useSurveyResponses(surveyId?: string) {
  return useQuery({
    queryKey: ['survey-responses', surveyId],
    queryFn: async (): Promise<SurveyResponse[]> => {
      let query = supabase
        .from('survey_responses')
        .select('*')
        .order('completed_at', { ascending: false });

      if (surveyId) {
        query = query.eq('survey_id', surveyId);
      }

      const { data: responses, error } = await query;

      if (error) throw error;

      // Get user emails
      const userIds = [...new Set(responses?.map(r => r.user_id) || [])];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', userIds);

        const emailMap = profiles?.reduce((acc, p) => {
          acc[p.user_id] = p.email;
          return acc;
        }, {} as Record<string, string>) || {};

        return (responses || []).map(r => ({
          ...r,
          responses: (r.responses as Record<string, any>) || {},
          user_email: emailMap[r.user_id] || 'Unknown',
        }));
      }

      return (responses || []).map(r => ({
        ...r,
        responses: (r.responses as Record<string, any>) || {},
      }));
    },
    enabled: true,
  });
}

export function usePendingSurveys() {
  return useQuery({
    queryKey: ['pending-surveys'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('pending_surveys')
        .select(`
          *,
          survey:surveys(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useSubmitSurveyResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ surveyId, responses }: { 
      surveyId: string; 
      responses: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert response
      const { error: insertError } = await supabase
        .from('survey_responses')
        .insert({
          user_id: user.id,
          survey_id: surveyId,
          responses,
        });

      if (insertError) throw insertError;

      // Remove from pending
      const { error: deleteError } = await supabase
        .from('pending_surveys')
        .delete()
        .eq('user_id', user.id)
        .eq('survey_id', surveyId);

      if (deleteError) console.error('Error removing pending survey:', deleteError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-surveys'] });
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
    },
  });
}
