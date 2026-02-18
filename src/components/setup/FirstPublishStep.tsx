import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePublishToWordPressSaas } from '@/hooks/useArticlesSaas';
import type { Article, ArticleContent } from '@/hooks/useArticlesSaas';
import { Loader2, ExternalLink, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface FirstPublishStepProps {
  siteId: string;
  onComplete: () => void;
  onBack: () => void;
}

export function FirstPublishStep({ siteId, onComplete, onBack }: FirstPublishStepProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const publishMutation = usePublishToWordPressSaas();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishOption, setPublishOption] = useState<'immediate' | 'scheduled' | 'draft'>('immediate');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ url?: string } | null>(null);

  // Load the first article for this site (from the wizard)
  useEffect(() => {
    if (!user?.id) return;

    const loadArticle = async () => {
      // First try to get article_id from onboarding_progress
      const { data: progress } = await supabase
        .from('onboarding_progress')
        .select('step_data')
        .eq('user_id', user.id)
        .eq('site_id', siteId)
        .limit(1);

      let articleId: string | undefined;
      if (progress?.[0]?.step_data) {
        const stepData = progress[0].step_data as Record<string, any>;
        articleId = stepData?.step5?.article_id;
      }

      let query = supabase
        .from('articles')
        .select('*')
        .eq('site_id', siteId)
        .eq('user_id', user.id);

      if (articleId) {
        query = query.eq('id', articleId);
      }

      const { data } = await query.order('generated_at', { ascending: false }).limit(1);

      if (data?.[0]) {
        setArticle(data[0] as unknown as Article);
      }
      setLoading(false);
    };

    loadArticle();
  }, [user?.id, siteId]);

  const handlePublish = async () => {
    if (!article) return;

    const content = article.content_spanish as unknown as ArticleContent | null;
    if (!content) return;

    setIsPublishing(true);

    try {
      const statusMap = {
        immediate: 'publish' as const,
        scheduled: 'future' as const,
        draft: 'draft' as const,
      };

      let publishDate: string | undefined;
      if (publishOption === 'scheduled') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        publishDate = tomorrow.toISOString();
      }

      const result = await publishMutation.mutateAsync({
        site_id: siteId,
        title: content.title,
        seo_title: content.seo_title,
        content: content.content,
        slug: content.slug,
        status: statusMap[publishOption],
        date: publishDate,
        image_url: article.image_url || undefined,
        image_alt: content.title,
        meta_description: content.meta_description,
        excerpt: content.excerpt || content.meta_description,
        focus_keyword: content.focus_keyword,
        lang: 'es',
      });

      if (result.success && result.post_url) {
        // Update article with wp_post_url
        await supabase
          .from('articles')
          .update({ wp_post_url: result.post_url })
          .eq('id', article.id);

        queryClient.invalidateQueries({ queryKey: ['articles'] });
        setPublishResult({ url: result.post_url });
      } else {
        setPublishResult({ url: result.post_url });
      }
    } catch {
      // Error handled by mutation
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const content = article?.content_spanish as unknown as ArticleContent | null;

  // Success state
  if (publishResult) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="text-5xl animate-in zoom-in duration-500">🎉</div>
          <h2 className="text-xl font-display font-bold text-foreground">
            ¡Tu primer artículo está publicado!
          </h2>
        </div>

        {publishResult.url && (
          <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium">Puedes verlo en:</span>
              </div>
              <a
                href={publishResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm break-all"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                {publishResult.url}
              </a>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          {publishResult.url && (
            <Button variant="outline" className="flex-1" asChild>
              <a href={publishResult.url} target="_blank" rel="noopener noreferrer">
                Ver en mi blog →
              </a>
            </Button>
          )}
          <Button onClick={onComplete} className="flex-1">
            Continuar →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-display font-bold text-foreground">
          ¡Hora de publicar tu primer artículo! 🚀
        </h2>
      </div>

      {content && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground">"{content.title}"</p>
            {content.meta_description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {content.meta_description}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <Label className="text-sm font-medium">¿Cómo quieres publicarlo?</Label>
        <RadioGroup value={publishOption} onValueChange={(v) => setPublishOption(v as any)}>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="immediate" id="pub-immediate" className="mt-0.5" />
              <div>
                <Label htmlFor="pub-immediate" className="cursor-pointer font-medium text-sm">
                  Publicar ahora
                </Label>
                <p className="text-xs text-muted-foreground">Aparecerá en tu blog inmediatamente</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="scheduled" id="pub-scheduled" className="mt-0.5" />
              <div>
                <Label htmlFor="pub-scheduled" className="cursor-pointer font-medium text-sm">
                  Programar para mañana a las 10:00
                </Label>
                <p className="text-xs text-muted-foreground">Se publicará automáticamente mañana</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="draft" id="pub-draft" className="mt-0.5" />
              <div>
                <Label htmlFor="pub-draft" className="cursor-pointer font-medium text-sm">
                  Guardar como borrador en WordPress
                </Label>
                <p className="text-xs text-muted-foreground">Lo revisarás y publicarás tú manualmente</p>
              </div>
            </label>
          </div>
        </RadioGroup>
      </div>

      <Button onClick={handlePublish} className="w-full" disabled={isPublishing || !article}>
        {isPublishing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Publicando...
          </>
        ) : (
          'Publicar →'
        )}
      </Button>

      <div className="pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Atrás
        </Button>
      </div>
    </div>
  );
}
