import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSites } from '@/hooks/useSites';
import { useIsAdmin, useIsSuperAdmin } from '@/hooks/useProfile';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireSuperAdmin = false }: ProtectedRouteProps) => {
  const { session, loading } = useAuth();
  const { data: sites, isLoading: loadingSites } = useSites();
  const { isAdmin, isLoading: loadingRoles } = useIsAdmin();
  const { isSuperAdmin, isLoading: loadingSuperAdmin } = useIsSuperAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth', { replace: true });
      return;
    }

    // Wait for all data to load
    if (loading || loadingSites || loadingRoles || loadingSuperAdmin) return;

    // Check superadmin requirement for admin routes
    if (requireSuperAdmin && !isSuperAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Admins have free access to all protected routes
    if (isAdmin || isSuperAdmin) {
      return;
    }

    // Regular users without sites go to onboarding
    if (sites?.length === 0 && location.pathname !== '/onboarding' && location.pathname !== '/onboarding/wizard') {
      navigate('/onboarding', { replace: true });
    }
  }, [session, loading, loadingSites, loadingRoles, loadingSuperAdmin, sites, isAdmin, isSuperAdmin, requireSuperAdmin, navigate, location.pathname]);

  if (loading || loadingSites || loadingRoles || loadingSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
};
