import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Rocket, ArrowRight } from 'lucide-react';
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

export function ArticleReadyStep({ onFinish, onConnectWordPress, stepData, siteId }: ArticleReadyStepProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<{
    content_spanish: ArticleContent | null;
    image_url: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const articleId = stepData?.step5?.article_id as string | undefined;
  const topic = (stepData?.step3?.selected_topic as string) ?? '';

  // Load article
  useEffect(() => {
    if (!articleId) { setIsLoading(false); return; }

    const load = async () => {
      const { data } = await supabase
        .from('articles')
        .select('content_spanish, image_url')
        .eq('id', articleId)
        .single();

      if (data) {
        setArticle({
          content_spanish: data.content_spanish as unknown as ArticleContent | null,
          image_url: data.image_url,
        });
      }
      setIsLoading(false);
    };
    load();
  }, [articleId]);

  const content = article?.content_spanish;
  const wordCount = content?.content
    ? content.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
    : 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  const handleComplete = async (goToWordPress: boolean) => {
    // Create checklist items
    if (user?.id && siteId) {
      const items = CHECKLIST_ITEMS.map((item) => ({
        user_id: user.id,
        site_id: siteId,
        step_key: item.step_key,
        status: item.status,
        completed_at: item.status === 'completed' ? new Date().toISOString() : null,
      }));

      const { error } = await supabase.from('onboarding_checklist').insert(items as any);
      if (error) {
        console.error('Error creating checklist:', error);
      }
    }

    if (goToWordPress && onConnectWordPress) {
      // Stay in the wizard, advance to WordPress step
      onConnectWordPress();
    } else {
      await onFinish();
      navigate('/dashboard');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 py-2">
      {/* Celebration header */}
      <div className="text-center space-y-3">
        <div className="text-5xl animate-in zoom-in duration-500">🎉</div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          ¡Tu primer artículo está listo!
        </h2>
        {content?.title && (
          <p className="text-base font-medium text-foreground italic max-w-lg mx-auto">
            &ldquo;{content.title}&rdquo;
          </p>
        )}
        {wordCount > 0 && (
          <p className="text-sm text-muted-foreground">
            📝 {wordCount.toLocaleString()} palabras · ⏱️ {readTime} min de lectura
          </p>
        )}
      </div>

      {/* Article preview */}
      <ScrollArea className="h-[280px] rounded-xl border border-border bg-muted/30 p-1">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : content ? (
            <>
              {article?.image_url && (
                <img
                  src={article.image_url}
                  alt={content.title}
                  className="w-full max-h-48 object-cover rounded-lg"
                />
              )}
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content.content }}
              />
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No se pudo cargar la vista previa del artículo.
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="space-y-4 pt-2">
        {/* Primary: WordPress */}
        <button
          onClick={() => handleComplete(true)}
          className="w-full p-4 rounded-xl border-2 border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-left transition-all hover:shadow-md group"
        >
          <div className="flex items-start gap-3">
            <Rocket className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Publicar en mi WordPress</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conecta tu WordPress y publica este artículo en tu blog.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shrink-0"
              tabIndex={-1}
            >
              Conectar WordPress
            </Button>
          </div>
        </button>

        {/* Secondary: Dashboard */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">o</p>
          <button
            onClick={() => handleComplete(false)}
            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
          >
            Ir al dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <p className="text-xs text-muted-foreground">
            Puedes publicar este artículo más tarde. Lo guardaremos para ti.
          </p>
        </div>
      </div>
    </div>
  );
}
