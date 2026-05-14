import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BetaInvitation {
  id: string;
  token: string;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
}

export function useBetaInvitations() {
  return useQuery({
    queryKey: ['beta-invitations'],
    queryFn: async (): Promise<BetaInvitation[]> => {
      const { data, error } = await supabase
        .from('beta_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateBetaInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ maxUses, expiresAt }: { 
      maxUses: number; 
      expiresAt?: string;
    }) => {
      // Generate a random token
      const token = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();

      const { data, error } = await supabase
        .from('beta_invitations')
        .insert({ 
          token,
          max_uses: maxUses,
          expires_at: expiresAt || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beta-invitations'] });
    },
  });
}

export function useToggleBetaInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('beta_invitations')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beta-invitations'] });
    },
  });
}

export function useValidateBetaToken() {
  return useMutation({
    mutationFn: async (token: string): Promise<BetaInvitation | null> => {
      const { data, error } = await supabase
        .rpc('validate_beta_token', { _token: token.toUpperCase() });

      if (error || !data || data.length === 0) return null;

      const row = data[0];
      return {
        id: row.id,
        token: token.toUpperCase(),
        max_uses: row.max_uses,
        current_uses: row.current_uses,
        expires_at: row.expires_at,
        created_at: '',
        is_active: true,
      };
    },
  });
}

export function useIncrementBetaUses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      // Get current uses and increment
      const { data: current, error: fetchError } = await supabase
        .from('beta_invitations')
        .select('current_uses')
        .eq('id', invitationId)
        .single();

      if (fetchError) throw fetchError;

      if (current) {
        const { error } = await supabase
          .from('beta_invitations')
          .update({ current_uses: current.current_uses + 1 })
          .eq('id', invitationId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beta-invitations'] });
    },
  });
}
