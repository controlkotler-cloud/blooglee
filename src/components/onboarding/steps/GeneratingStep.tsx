import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import type { OnboardingStepData } from '@/hooks/useOnboarding';

const TIPS = [
  '📈 Los negocios con blog reciben un 55% más de visitas.',
  '📍 El contenido local posiciona mejor en Google.',
  '🔄 Publicar regularmente mejora tu autoridad online.',
  '💪 Un artículo de blog trabaja para ti 24/7.',
];

const TONE_LABELS: Record<string, string> = {
  friendly: 'Cercano',
  professional: 'Profesional',
  expert: 'Experto',
  educational: 'Divulgativo',
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
  const generatedRef = useRef(false);

  const topic = (stepData?.step3?.selected_topic as string) ?? 'Tu artículo';
  const businessName = (stepData?.step1?.business_name as string) ?? 'tu negocio';
  const tone = (stepData?.step2?.tone as string) ?? '';
  const toneLabel = TONE_LABELS[tone] || tone;

  // Tip rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
        setTipVisible(true);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Generate article
  useEffect(() => {
    if (generatedRef.current || !siteId) return;
    generatedRef.current = true;
    generateArticle();
  }, [siteId]);

  const generateArticle = async () => {
    setStatus('generating');

    try {
      const now = new Date();
      const { data, error } = await supabase.functions.invoke('generate-article-saas', {
        body: {
          siteId,
          topic,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      });

      if (error) throw error;

      const articleId = data?.articleId || data?.article_id || data?.id;
      if (articleId) {
        await saveStepData('step5', { article_id: articleId });
      }

      setStatus('done');
      setTimeout(() => onNext(), 1200);
    } catch (err) {
      console.error('Article generation failed:', err);
      setStatus('error');
      generatedRef.current = false;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-3xl">✨</p>
        <h2 className="text-xl font-display font-bold text-foreground">
          {status === 'done' ? '¡Artículo generado!' : status === 'error' ? 'Algo ha fallado' : 'Estamos escribiendo tu artículo...'}
        </h2>
        {status === 'generating' && (
          <>
            <p className="text-base font-medium text-foreground italic max-w-md mx-auto">
              &ldquo;{topic}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground">
              Para: {businessName} · Tono: {toneLabel}
            </p>
          </>
        )}
      </div>

      {/* Central content */}
      <div className="rounded-xl bg-muted/50 border border-border p-6 min-h-[180px] flex items-center justify-center">
        {status === 'generating' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Esto tarda unos 30-60 segundos ⏱️
            </p>
          </div>
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
            <Button
              onClick={generateArticle}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {/* Rotating tips */}
      {status === 'generating' && (
        <div className="h-10 flex items-center justify-center">
          <p
            className={`text-sm text-muted-foreground text-center transition-opacity duration-300 ${
              tipVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {TIPS[tipIndex]}
          </p>
        </div>
      )}
    </div>
  );
}
