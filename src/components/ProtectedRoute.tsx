import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSites } from '@/hooks/useSites';
import { useIsMKProAdmin } from '@/hooks/useProfile';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useAuth();
  const { data: sites, isLoading: loadingSites } = useSites();
  const { isMKProAdmin, isLoading: loadingRoles } = useIsMKProAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth', { replace: true });
      return;
    }

    // Wait for all data to load
    if (loading || loadingSites || loadingRoles) return;

    // MKPro admins should go to /mkpro, not onboarding
    if (isMKProAdmin) {
      if (location.pathname !== '/mkpro') {
        navigate('/mkpro', { replace: true });
      }
      return;
    }

    // Regular users without sites go to onboarding
    if (sites?.length === 0 && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [session, loading, loadingSites, loadingRoles, sites, isMKProAdmin, navigate, location.pathname]);

  if (loading || loadingSites || loadingRoles) {
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
