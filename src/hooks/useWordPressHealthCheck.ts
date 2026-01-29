import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HealthCheck {
  id: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  value?: string;
  action?: string;
  solution_slug?: string;
}

export interface HealthCheckResult {
  phase: number;
  overall_status: 'success' | 'warning' | 'error';
  checks: HealthCheck[];
  detected_plugins: string[];
  languages?: { code: string; name: string }[];
  categories?: { id: number; name: string; slug: string }[];
  errors: string[];
  recommendations: { priority: string; title: string; slug: string }[];
}

export function useWordPressHealthCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runHealthCheck = useCallback(async (
    siteUrl: string,
    wpUsername?: string,
    wpAppPassword?: string,
    phase: number = 1
  ): Promise<HealthCheckResult | null> => {
    setIsChecking(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('wordpress-health-check', {
        body: {
          site_url: siteUrl,
          wp_username: wpUsername,
          wp_app_password: wpAppPassword,
          phase,
        },
      });

      if (fnError) {
        console.error('Health check error:', fnError);
        setError(fnError.message || 'Error al ejecutar diagnóstico');
        return null;
      }

      setResult(data as HealthCheckResult);
      return data as HealthCheckResult;

    } catch (err) {
      console.error('Health check error:', err);
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const resetHealthCheck = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isChecking,
    result,
    error,
    runHealthCheck,
    resetHealthCheck,
  };
}
