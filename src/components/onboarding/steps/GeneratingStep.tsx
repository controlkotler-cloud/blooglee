import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { track } from '@/lib/analytics';
import type { OnboardingStepData } from '@/hooks/useOnboarding';

const TIPS = [
  '📈 Los negocios con blog reciben un 55% más de visitas.',
  '📍 El contenido local posiciona mejor en Google.',
  '🔄 Publicar regularmente mejora tu autoridad online.',
  '💪 Un artículo de blog trabaja para ti 24/7.',
];

const TONE_LABELS: Record<string, string> = {
  friendly: 'Cercano', professional: 'Profesional', expert: 'Experto', educational: 'Divulgativo',
};

interface GeneratingStepProps {
  onNext: () => void;
  saveStepData: (key: string, data: object) => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

export function GeneratingStep({ onNext, saveStepData, stepData, siteId }: GeneratingStepProps) {
  const [status, setStatus] = useState<'generating' | 'done' | 'error'>('generating');
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const [progress, setProgressValue] = useState(0);
  const generatedRef = useRef(false);
  const startTimeRef = useRef(Date.now());

  const topic = (stepData?.step3?.selected_topic as string) ?? 'Tu artículo';
  const businessName = (stepData?.step1?.business_name as string) ?? 'tu negocio';
  const tone = (stepData?.step2?.tone as string) ?? '';
  const toneLabel = TONE_LABELS[tone] || tone;

  // Simulated progress animation
  useEffect(() => {
    if (status !== 'generating') return;
    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      let p: number;
      if (elapsed < 5) p = (elapsed / 5) * 30;
      else if (elapsed < 20) p = 30 + ((elapsed - 5) / 15) * 40;
      else if (elapsed < 40) p = 70 + ((elapsed - 20) / 20) * 25;
      else p = 95;
      setProgressValue(Math.min(p, 95));
    }, 200);

    return () => clearInterval(interval);
  }, [status]);

  // Tip rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
        setTipVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Generate article (skip if already generated in a previous mount)
  useEffect(() => {
    if (generatedRef.current || !siteId) return;

    // If article was already generated in a previous session, skip to next
    const existingArticleId = stepData?.step5?.article_id;
    if (existingArticleId) {
      generatedRef.current = true;
      setProgressValue(100);
      setStatus('done');
      setTimeout(() => onNext(), 600);
      return;
    }

    generatedRef.current = true;
    generateArticle();
  }, [siteId]);

  const generateArticle = async () => {
    setStatus('generating');
    const startTime = Date.now();
    track('onboarding_article_generation_started');

    try {
      const now = new Date();
      const { data, error } = await supabase.functions.invoke('generate-article-saas', {
        body: { siteId, topic, month: now.getMonth() + 1, year: now.getFullYear() },
      });

      if (error) throw error;

      const articleId = data?.article?.id || data?.articleId || data?.article_id || data?.id;
      if (articleId) await saveStepData('step5', { article_id: articleId });

      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      track('onboarding_article_generation_completed', { duration_seconds: durationSeconds, word_count: data?.word_count ?? 0 });

      setProgressValue(100);
      setStatus('done');
      setTimeout(() => onNext(), 1200);
    } catch (err) {
      console.error('Article generation failed:', err);
      setStatus('error');
      generatedRef.current = false;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 py-2 sm:py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-3xl">✨</p>
        <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">
          {status === 'done' ? '¡Artículo generado!' : status === 'error' ? 'Algo ha fallado' : 'Estamos escribiendo tu artículo...'}
        </h2>
        {status === 'generating' && (
          <>
            <p className="text-base sm:text-lg font-semibold text-foreground italic max-w-md mx-auto leading-snug">
              &ldquo;{topic}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground">
              Para: {businessName} · Tono: {toneLabel}
            </p>
          </>
        )}
      </div>

      {/* Central content */}
      <div className={`rounded-xl bg-muted/50 border border-border p-4 sm:p-6 min-h-[180px] sm:min-h-[200px] flex flex-col items-center justify-center gap-5 transition-colors duration-300 ${status === 'done' ? 'animate-flash-done' : ''}`}>
        {status === 'generating' && (
          <>
            {/* Skeleton writing effect */}
            <div className="w-full max-w-sm space-y-3">
              <div className="h-4 bg-muted-foreground/10 rounded animate-pulse w-full" />
              <div className="h-4 bg-muted-foreground/10 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-muted-foreground/10 rounded animate-pulse w-4/6" />
              <div className="flex items-center gap-0.5 mt-1">
                <div className="h-4 bg-muted-foreground/10 rounded animate-pulse w-2/6" />
                <span className="inline-block w-0.5 h-5 bg-primary animate-[typing-cursor_1s_ease-in-out_infinite]" />
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-sm space-y-1.5">
              <Progress value={progress} className="h-2 [&>div]:transition-[width] [&>div]:duration-1000 [&>div]:ease-linear" />
              <p className="text-xs text-muted-foreground text-center">
                Escribiendo... {Math.round(progress)}%
              </p>
            </div>
          </>
        )}

        {status === 'done' && (
          <div className="text-center space-y-2">
            <p className="text-4xl">🎉</p>
            <p className="text-sm font-medium text-foreground">¡Tu primer artículo está listo!</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Ha habido un problema al generar tu artículo. No te preocupes, vamos a intentarlo de nuevo.
            </p>
            <Button onClick={generateArticle} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {/* Rotating tips */}
      {status === 'generating' && (
        <div className="h-10 flex items-center justify-center">
          <p className={`text-xs sm:text-sm text-muted-foreground text-center transition-opacity duration-400 ${tipVisible ? 'opacity-100' : 'opacity-0'}`}>
            {TIPS[tipIndex]}
          </p>
        </div>
      )}
    </div>
  );
}
