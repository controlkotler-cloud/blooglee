import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  plan: string;
  sites_limit: number;
  posts_limit: number;
  is_beta: boolean;
  beta_started_at: string | null;
  beta_expires_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  roles: string[];
  sites_count?: number;
  articles_count?: number;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<AdminUser[]> => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get sites count per user
      const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('user_id');

      if (sitesError) throw sitesError;

      // Get articles count per user
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('user_id');

      if (articlesError) throw articlesError;

      // Map sites and articles count
      const sitesCount = sites?.reduce((acc, site) => {
        acc[site.user_id] = (acc[site.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const articlesCount = articles?.reduce((acc, article) => {
        acc[article.user_id] = (acc[article.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Combine data
      return (profiles || []).map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.user_id).map(r => r.role) || [],
        sites_count: sitesCount[profile.user_id] || 0,
        articles_count: articlesCount[profile.user_id] || 0,
      }));
    },
  });
}

export function useUpdateUserPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, plan, sitesLimit, postsLimit }: { 
      userId: string; 
      plan: string;
      sitesLimit: number;
      postsLimit: number;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan,
          sites_limit: sitesLimit,
          posts_limit: postsLimit,
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role, action }: { 
      userId: string; 
      role: 'superadmin' | 'beta' | 'user';
      action: 'add' | 'remove';
    }) => {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useBetaUsers() {
  return useQuery({
    queryKey: ['admin-beta-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_beta', true)
        .order('beta_started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}
