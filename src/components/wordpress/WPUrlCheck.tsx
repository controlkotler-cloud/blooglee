import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { track } from '@/lib/analytics';

function decodeHtmlEntities(text: string): string {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent || text;
}

interface WPUrlCheckProps {
  siteId: string;
  initialUrl?: string;
  onBack: () => void;
  onContinue: (url: string) => void;
  onSkip?: () => void;
}

interface CheckResult {
  is_wordpress: boolean;
  api_rest_active: boolean;
  ssl_valid: boolean;
  detected_plugins: string[];
  site_name: string;
  permalink_structure: string;
  error_type: string | null;
}

type CheckStatus = 'idle' | 'checking' | 'success' | 'error';

export function WPUrlCheck({ siteId, initialUrl, onBack, onContinue, onSkip }: WPUrlCheckProps) {
  const { user } = useAuth();
  const [url, setUrl] = useState(initialUrl?.replace(/^https?:\/\//, '') || '');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [result, setResult] = useState<CheckResult | null>(null);

  // Auto-check if initialUrl was provided
  useEffect(() => {
    if (initialUrl && url && status === 'idle') {
      handleCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const normalizeUrl = (input: string): string => {
    let u = input.trim().replace(/\/+$/, '');
    if (!u.startsWith('http')) {
      u = `https://${u}`;
    }
    return u;
  };

  const handleCheck = async () => {
    if (!url.trim()) return;

    setStatus('checking');
    setResult(null);

    const normalizedUrl = normalizeUrl(url);

    try {
      const { data, error } = await supabase.functions.invoke('check-wordpress', {
        body: { url: normalizedUrl },
      });

      if (error) {
        setResult({ is_wordpress: false, api_rest_active: false, ssl_valid: false, detected_plugins: [], site_name: '', permalink_structure: '', error_type: 'not_found' });
        setStatus('error');
        return;
      }

      const checkResult = data as CheckResult;
      setResult(checkResult);

      // Save diagnostic to DB
      if (user?.id) {
        await supabase.from('wordpress_diagnostics').insert({
          user_id: user.id,
          site_id: siteId,
          check_type: 'url_check',
          status: checkResult.is_wordpress && checkResult.api_rest_active ? 'ok' : checkResult.is_wordpress ? 'warning' : 'error',
          message: JSON.stringify({ url: normalizedUrl, ...checkResult }),
          raw_response: checkResult as any,
        } as any);
      }

      if (checkResult.is_wordpress && checkResult.api_rest_active) {
        setStatus('success');
        track('wp_url_check', { result: 'success' });
      } else if (checkResult.is_wordpress && !checkResult.api_rest_active) {
        setStatus('error');
        track('wp_url_check', { result: 'api_disabled' });
      } else {
        setStatus('error');
        track('wp_url_check', { result: 'not_wordpress' });
      }
    } catch {
      setResult({ is_wordpress: false, api_rest_active: false, ssl_valid: false, detected_plugins: [], site_name: '', permalink_structure: '', error_type: 'not_found' });
      setStatus('error');
    }
  };

  const getErrorMessage = () => {
    if (!result) return null;

    if (result.error_type === 'timeout') {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        title: 'No hemos podido conectar con esta dirección',
        description: 'Verifica que la has escrito correctamente y que tu web está activa.',
        canRetry: true,
      };
    }
    if (result.is_wordpress && !result.api_rest_active) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        title: 'La API REST de WordPress parece estar desactivada',
        description: 'Esto suele pasar con plugins de seguridad como Wordfence o iThemes. Es fácil de arreglar.',
        canRetry: true,
        showHelp: true,
      };
    }
    if (!result.is_wordpress) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        title: 'Esta web no parece ser WordPress',
        description: 'Blooglee solo funciona con WordPress por ahora. Verifica la dirección o prueba con otra URL.',
        canRetry: true,
        canSkip: true,
      };
    }
    return null;
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-display font-bold text-foreground">
          {initialUrl ? 'Verificando tu WordPress' : '¿Cuál es la dirección de tu web?'}
        </h2>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
            https://
          </div>
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (status !== 'idle') {
                setStatus('idle');
                setResult(null);
              }
            }}
            placeholder="www.tuempresa.es"
            className="rounded-l-none"
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            disabled={status === 'checking'}
          />
        </div>
        <p className="text-xs text-muted-foreground">Escribe la dirección completa de tu web.</p>

        {status === 'idle' && (
          <Button onClick={handleCheck} disabled={!url.trim()} className="w-full">
            Verificar →
          </Button>
        )}

        {status === 'checking' && (
          <Button disabled className="w-full">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verificando...
          </Button>
        )}
      </div>

      {/* Success */}
      {status === 'success' && result && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  ¡Perfecto! Hemos detectado tu WordPress correctamente.
                </p>
                {result.site_name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Sitio: {decodeHtmlEntities(result.site_name)}
                  </p>
                )}
                {result.detected_plugins.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Plugins detectados: {result.detected_plugins.join(', ')}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => onContinue(normalizeUrl(url))} className="w-full">
              Continuar →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {status === 'error' && errorInfo && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              {errorInfo.icon}
              <div>
                <p className="text-sm font-medium text-foreground">{errorInfo.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{errorInfo.description}</p>
              </div>
            </div>
            {errorInfo.showHelp && (
              <a
                href="https://blooglee.com/help"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Ver cómo solucionarlo →
              </a>
            )}
            <div className="flex gap-2">
              {errorInfo.canRetry && (
                <Button
                  variant="outline"
                  onClick={() => { setStatus('idle'); setResult(null); }}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reintentar
                </Button>
              )}
              {errorInfo.canSkip && onSkip && (
                <Button variant="ghost" onClick={onSkip} className="flex-1">
                  Continuar sin WordPress
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back button */}
      <div className="pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Atrás
        </Button>
      </div>
    </div>
  );
}
