import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSites } from '@/hooks/useSites';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useAuth();
  const { data: sites, isLoading: loadingSites } = useSites();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth', { replace: true });
      return;
    }

    // Redirect new users without sites to onboarding (except if already there)
    if (!loading && !loadingSites && session && sites?.length === 0 && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [session, loading, loadingSites, sites, navigate, location.pathname]);

  if (loading || loadingSites) {
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
