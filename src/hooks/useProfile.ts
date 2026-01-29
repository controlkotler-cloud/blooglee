import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  plan: 'free' | 'pro' | 'agency';
  sites_limit: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'mkpro_admin' | 'user';
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

      return data as Profile;
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
  
  const isAdmin = roles.some(r => r.role === 'admin');
  
  return { isAdmin, isLoading };
}

export function useIsMKProAdmin() {
  const { data: roles = [], isLoading } = useUserRoles();
  
  const isMKProAdmin = roles.some(r => r.role === 'mkpro_admin');
  const isAdmin = roles.some(r => r.role === 'admin');
  
  return { 
    isMKProAdmin, 
    isAdmin,
    canAccessMKPro: isMKProAdmin || isAdmin,
    isLoading 
  };
}
