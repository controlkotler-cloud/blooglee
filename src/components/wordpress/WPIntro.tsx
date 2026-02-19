import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, ArrowRight, Mail, Loader2, Globe } from 'lucide-react';

interface WPIntroProps {
  blogUrl?: string;
  onHasWordPress: () => void;
  /** Called when WordPress is auto-detected on the blogUrl — skips url_check */
  onWordPressDetected?: (url: string) => void;
  onSkip: () => void;
}

interface CheckResult {
  is_wordpress: boolean;
  api_rest_active: boolean;
  detected_plugins: string[];
  site_name: string;
  error_type: string | null;
}

type DetectionStatus = 'idle' | 'checking' | 'detected' | 'not_detected';

export function WPIntro({ blogUrl, onHasWordPress, onWordPressDetected, onSkip }: WPIntroProps) {
  const [showNoPanel, setShowNoPanel] = useState(false);
  const [detection, setDetection] = useState<DetectionStatus>('idle');
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  // Auto-detect WordPress from blogUrl on mount
  useEffect(() => {
    if (!blogUrl) return;

    let cancelled = false;
    const normalizedUrl = blogUrl.trim().replace(/\/+$/, '').replace(/^(?!https?:\/\/)/, 'https://');

    setDetection('checking');

    supabase.functions.invoke('check-wordpress', { body: { url: normalizedUrl } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setDetection('not_detected');
          return;
        }
        const result = data as CheckResult;
        setCheckResult(result);
        setDetection(result.is_wordpress && result.api_rest_active ? 'detected' : 'not_detected');
      })
      .catch(() => {
        if (!cancelled) setDetection('not_detected');
      });

    return () => { cancelled = true; };
  }, [blogUrl]);

  // WordPress auto-detected
  if (detection === 'detected' && checkResult && blogUrl) {
    const normalizedUrl = blogUrl.trim().replace(/\/+$/, '').replace(/^(?!https?:\/\/)/, 'https://');
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-display font-bold text-foreground">
            Conectar tu WordPress
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Para que Blooglee pueda publicar artículos en tu blog, necesitamos conectarnos a tu WordPress.
          </p>
        </div>

        <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  ¡Hemos detectado WordPress en tu web!
                </p>
                {checkResult.site_name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Sitio: {checkResult.site_name}
                  </p>
                )}
                {checkResult.detected_plugins.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Plugins: {checkResult.detected_plugins.join(', ')}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => onWordPressDetected?.(normalizedUrl) ?? onHasWordPress()}
              className="w-full"
            >
              Conectar WordPress →
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Ahora no, lo haré más tarde
          </button>
        </div>
      </div>
    );
  }

  // Checking spinner
  if (detection === 'checking') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-display font-bold text-foreground">
            Conectar tu WordPress
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Comprobando si tu web usa WordPress...
          </p>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Not detected or no blogUrl — ask simple question
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-display font-bold text-foreground">
          Conectar tu WordPress
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Para que Blooglee pueda publicar artículos en tu blog, necesitamos conectarnos a tu WordPress.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground text-center">¿Tienes un blog en WordPress?</p>

        <div className="grid gap-3">
          {/* Yes */}
          <button
            onClick={onHasWordPress}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-card text-left transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <Globe className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Sí, tengo un blog</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
          </button>

          {/* No */}
          <button
            onClick={() => setShowNoPanel(true)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              showNoPanel
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">No tengo blog</p>
            </div>
          </button>
        </div>
      </div>

      {/* No blog panel */}
      {showNoPanel && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-foreground">
              ¡No te preocupes! Blooglee funciona con WordPress. Si todavía no tienes blog, puedes pedir a tu empresa de hosting o tu informático que instale WordPress.
            </p>
            <p className="text-sm text-muted-foreground">
              Si necesitas ayuda, escríbenos a{' '}
              <a href="mailto:soporte@blooglee.com" className="text-primary hover:underline inline-flex items-center gap-1">
                <Mail className="w-3 h-3" />
                soporte@blooglee.com
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              Mientras tanto, puedes seguir usando Blooglee para generar artículos y guardarlos como borradores.
            </p>
            <Button variant="outline" onClick={onSkip} className="w-full">
              Continuar sin WordPress →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
