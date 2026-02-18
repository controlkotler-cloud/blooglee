import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { WordPressSetup } from '@/components/wordpress/WordPressSetup';
import { useWordPressConfig } from '@/hooks/useWordPressConfigSaas';
import { usePublishToWordPressSaas } from '@/hooks/useArticlesSaas';
import { track } from '@/lib/analytics';
import { CheckCircle2, ExternalLink, ArrowRight, Loader2, Send } from 'lucide-react';
import type { OnboardingStepData } from '@/hooks/useOnboarding';
import type { ArticleContent } from '@/hooks/useArticlesSaas';

interface WordPressOnboardingStepProps {
  onFinish: () => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

type Phase = 'setup' | 'connected' | 'publishing' | 'published';

export function WordPressOnboardingStep({ onFinish, stepData, siteId }: WordPressOnboardingStepProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('setup');
  const [publishUrl, setPublishUrl] = useState<string | null>(null);

  const articleId = stepData?.step5?.article_id as string | undefined;
  const { data: wpConfig } = useWordPressConfig(siteId || '');
  const publishMutation = usePublishToWordPressSaas();

  // If WP was just connected via the setup wizard, move to connected phase
  const handleSetupComplete = async () => {
    // Mark wordpress_connect as completed in checklist
    if (user?.id && siteId) {
      await supabase
        .from('onboarding_checklist')
        .update({ status: 'completed', completed_at: new Date().toISOString() } as any)
        .eq('user_id', user.id)
        .eq('site_id', siteId)
        .eq('step_key', 'wordpress_connect');
    }

    track('onboarding_wp_connected');
    queryClient.invalidateQueries({ queryKey: ['wordpress-config'] });
    setPhase('connected');
  };

  const handlePublish = async () => {
    if (!articleId || !siteId) return;

    setPhase('publishing');

    try {
      // Load the article content
      const { data: article } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (!article) throw new Error('Artículo no encontrado');

      const content = article.content_spanish as unknown as ArticleContent | null;
      if (!content) throw new Error('Sin contenido del artículo');

      const result = await publishMutation.mutateAsync({
        site_id: siteId,
        title: content.title,
        seo_title: content.seo_title,
        content: content.content,
        slug: content.slug,
        status: 'publish',
        image_url: article.image_url || undefined,
        image_alt: content.title,
        meta_description: content.meta_description,
        excerpt: content.excerpt || content.meta_description,
        focus_keyword: content.focus_keyword,
        lang: 'es',
      });

      if (result.success) {
        // Save wp_post_url
        if (result.post_url) {
          await supabase
            .from('articles')
            .update({ wp_post_url: result.post_url })
            .eq('id', articleId);
          setPublishUrl(result.post_url);
        }

        // Mark first_publish as completed
        if (user?.id) {
          await supabase
            .from('onboarding_checklist')
            .update({ status: 'completed', completed_at: new Date().toISOString() } as any)
            .eq('user_id', user.id)
            .eq('site_id', siteId)
            .eq('step_key', 'first_publish');
        }

        track('onboarding_first_publish_completed');
        setPhase('published');
      } else {
        throw new Error(result.error || 'Error al publicar');
      }
    } catch (err: any) {
      console.error('Publish error:', err);
      toast.error(err.message || 'Error al publicar el artículo');
      setPhase('connected'); // Go back to allow retry
    }
  };

  const handleGoToDashboard = async () => {
    await onFinish();
    navigate('/dashboard');
  };

  // Setup phase — embed the WordPressSetup wizard
  if (phase === 'setup' && siteId) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="text-center space-y-2 mb-4">
          <h2 className="text-xl font-display font-bold text-foreground">
            Conecta tu WordPress
          </h2>
          <p className="text-sm text-muted-foreground">
            Conecta tu blog para publicar artículos directamente.
          </p>
        </div>

        <WordPressSetup
          siteId={siteId}
          onClose={handleGoToDashboard}
          onComplete={handleSetupComplete}
        />
      </div>
    );
  }

  // Connected — offer to publish
  if (phase === 'connected') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 py-4">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            ✅ ¡WordPress conectado!
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Ya puedes publicar tu artículo directamente en tu blog. ¿Quieres publicarlo ahora?
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handlePublish}
            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white gap-2"
            size="lg"
          >
            <Send className="w-4 h-4" />
            Publicar en mi blog →
          </Button>

          <div className="text-center">
            <button
              onClick={handleGoToDashboard}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-1"
            >
              Publicar más tarde
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Publishing
  if (phase === 'publishing') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 py-8">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-display font-bold text-foreground">
            Publicando tu artículo...
          </h2>
          <p className="text-sm text-muted-foreground">
            Esto solo tardará unos segundos.
          </p>
        </div>
      </div>
    );
  }

  // Published
  if (phase === 'published') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 py-4">
        <div className="text-center space-y-3">
          <div className="text-5xl">🚀</div>
          <h2 className="text-xl font-display font-bold text-foreground">
            ¡Artículo publicado!
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tu primer artículo ya está en tu blog. ¡Felicidades!
          </p>
        </div>

        {publishUrl && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <a
              href={publishUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Ver artículo en tu blog
            </a>
          </div>
        )}

        <Button
          onClick={handleGoToDashboard}
          className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
          size="lg"
        >
          Ir al dashboard →
        </Button>
      </div>
    );
  }

  // Fallback
  return null;
}
