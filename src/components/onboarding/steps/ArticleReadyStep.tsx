import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Rocket } from 'lucide-react';
import type { OnboardingStepData } from '@/hooks/useOnboarding';
import type { ArticleContent } from '@/hooks/useArticlesSaas';

interface ArticleReadyStepProps {
  onFinish: () => void;
  onConnectWordPress?: () => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

const CHECKLIST_ITEMS = [
  { step_key: 'business_setup', status: 'completed' },
  { step_key: 'style_setup', status: 'completed' },
  { step_key: 'first_article', status: 'completed' },
  { step_key: 'wordpress_connect', status: 'pending' },
  { step_key: 'first_publish', status: 'pending' },
  { step_key: 'content_profile', status: 'pending' },
  { step_key: 'auto_publish', status: 'pending' },
];

// CSS confetti particles
const CONFETTI_COLORS = ['#8B5CF6', '#D946EF', '#F97316', '#22C55E', '#3B82F6', '#EAB308'];

function ConfettiParticles() {
  const [visible, setVisible] = useState(true);
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1.5}s`,
      duration: `${1.5 + Math.random() * 1.5}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 4 + Math.random() * 6,
    })),
  []);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

export function ArticleReadyStep({ onFinish, onConnectWordPress, stepData, siteId }: ArticleReadyStepProps) {
  const { user } = useAuth();
  const [article, setArticle] = useState<{
    content_spanish: ArticleContent | null;
    image_url: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const articleId = stepData?.step5?.article_id as string | undefined;

  useEffect(() => {
    if (!articleId) { setIsLoading(false); return; }
    const load = async () => {
      const { data } = await supabase.from('articles').select('content_spanish, image_url').eq('id', articleId).single();
      if (data) setArticle({ content_spanish: data.content_spanish as unknown as ArticleContent | null, image_url: data.image_url });
      setIsLoading(false);
    };
    load();
  }, [articleId]);

  const content = article?.content_spanish;
  const wordCount = content?.content ? content.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  const handleComplete = async () => {
    if (user?.id && siteId) {
      const items = CHECKLIST_ITEMS.map((item) => ({
        user_id: user.id,
        site_id: siteId,
        step_key: item.step_key,
        status: item.status,
        completed_at: item.status === 'completed' ? new Date().toISOString() : null,
      }));
      const { error } = await supabase.from('onboarding_checklist').insert(items as any);
      if (error) console.error('Error creating checklist:', error);
    }
    if (onConnectWordPress) onConnectWordPress();
  };

  return (
    <div className="relative space-y-5 sm:space-y-6 py-2">
      <ConfettiParticles />

      {/* Celebration header */}
      <div className="relative z-10 text-center space-y-2 sm:space-y-3">
        <div className="text-4xl sm:text-5xl animate-bounce-in">🎉</div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          ¡Tu primer artículo está listo!
        </h2>
        {content?.title && (
          <p className="text-sm sm:text-base font-medium text-foreground italic max-w-lg mx-auto leading-snug">
            &ldquo;{content.title}&rdquo;
          </p>
        )}
        {wordCount > 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            📝 {wordCount.toLocaleString()} palabras · ⏱️ {readTime} min de lectura
          </p>
        )}
      </div>

      {/* Article preview */}
      <ScrollArea className="relative z-10 h-[260px] sm:h-[320px] rounded-xl border border-border bg-card p-1 animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
        <div className="p-3 sm:p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : content ? (
            <>
              {article?.image_url && (
                <img src={article.image_url} alt={content.title} className="w-full max-h-48 object-cover rounded-lg" />
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.content }} />
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">No se pudo cargar la vista previa del artículo.</p>
          )}
        </div>
      </ScrollArea>

      {/* CTA */}
      <div className="relative z-10 space-y-3 pt-1 sm:pt-2">
        <Button
          onClick={handleComplete}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white gap-2 rounded-lg shadow-md"
          size="lg"
        >
          <Rocket className="w-5 h-5" />
          Conectar WordPress y publicar
        </Button>
        <p className="text-xs text-center text-muted-foreground py-2 sm:py-0">
          No te preocupes, nada se publicará hasta que tú lo decidas.
        </p>
      </div>
    </div>
  );
}
