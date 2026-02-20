import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NotificationPreferences {
  article_published: boolean;
  pre_publish_review: boolean;
  weekly_summary: boolean;
  product_updates: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  plan: 'free' | 'starter' | 'pro' | 'agency';
  sites_limit: number;
  posts_limit: number;
  onboarding_completed: boolean;
  is_beta: boolean;
  beta_started_at: string | null;
  beta_expires_at: string | null;
  beta_invitation_id: string | null;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  tax_id: string | null;
  billing_address: string | null;
  timezone: string | null;
  avatar_url: string | null;
  notification_preferences: NotificationPreferences | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'superadmin' | 'admin' | 'beta' | 'user';
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as unknown as Profile;
    },
    enabled: !!user?.id,
  });
}

export function useUserRoles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_roles', user?.id],
    queryFn: async (): Promise<UserRole[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return data as UserRole[];
    },
    enabled: !!user?.id,
  });
}

export function useIsAdmin() {
  const { data: roles = [], isLoading } = useUserRoles();
  
  // Both 'admin' (legacy) and 'superadmin' have admin privileges
  const isAdmin = roles.some(r => r.role === 'admin' || r.role === 'superadmin');
  
  return { isAdmin, isLoading };
}

export function useIsSuperAdmin() {
  const { data: roles = [], isLoading } = useUserRoles();
  
  const isSuperAdmin = roles.some(r => r.role === 'superadmin');
  
  return { isSuperAdmin, isLoading };
}


export function useIsBeta() {
  const { data: roles = [], isLoading } = useUserRoles();
  const { data: profile } = useProfile();
  
  const hasBetaRole = roles.some(r => r.role === 'beta');
  const isBetaActive = profile?.is_beta && profile?.beta_expires_at 
    ? new Date(profile.beta_expires_at) > new Date() 
    : false;
  
  return { 
    isBeta: hasBetaRole && isBetaActive,
    betaExpiresAt: profile?.beta_expires_at,
    isLoading 
  };
}
