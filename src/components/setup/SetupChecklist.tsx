import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChecklist } from '@/hooks/useChecklist';
import { useProfile } from '@/hooks/useProfile';
import { useSites, useUpdateSite, type Site } from '@/hooks/useSites';
import { useAllArticlesSaas, type ArticleContent } from '@/hooks/useArticlesSaas';
import { useWordPressConfigsBatch } from '@/hooks/useWordPressConfigSaas';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SetupProgress } from './SetupProgress';
import { ChecklistItem } from './ChecklistItem';
import { FirstPublishStep } from './FirstPublishStep';
import { ContentProfileStep } from './ContentProfileStep';
import { AutoPublishStep } from './AutoPublishStep';
import { WordPressSetup } from '@/components/wordpress/WordPressSetup';
import { MessageCircle, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const TONE_LABELS: Record<string, string> = {
  friendly: 'Cercano',
  professional: 'Profesional',
  expert: 'Experto',
  educational: 'Divulgativo',
};

const MOOD_LABELS: Record<string, string> = {
  'warm and welcoming': 'Cálido',
  'bold and modern': 'Moderno',
  'elegant and refined': 'Elegante',
  'playful and energetic': 'Divertido',
  'calm and natural': 'Natural',
};

type ActiveStep = null | 'wordpress_connect' | 'first_publish' | 'content_profile' | 'auto_publish';

interface SetupChecklistProps {
  site: Site;
}

export function SetupChecklist({ site }: SetupChecklistProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateSiteMutation = useUpdateSite();
  const [activeStep, setActiveStep] = useState<ActiveStep>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: articles = [] } = useAllArticlesSaas(currentMonth, currentYear);
  const { data: wpConfigsMap = {} } = useWordPressConfigsBatch([site.id]);

  const {
    checklistItems,
    progressPercentage,
    getNextPendingStep,
    updateStep,
    isLoading,
  } = useChecklist(site.id);

  const hasWordPress = !!wpConfigsMap[site.id];
  const nextPending = getNextPendingStep();
  const siteArticle = articles.find(a => a.site_id === site.id);
  const articleTitle = siteArticle
    ? (siteArticle.content_spanish as unknown as ArticleContent | null)?.title ?? siteArticle.topic
    : null;

  const userName = profile?.email?.split('@')[0] ?? '';

  if (isLoading || checklistItems.length === 0) return null;

  // Check if all steps are completed
  const allComplete = checklistItems.every(i => i.status === 'completed');

  const markChecklistComplete = async () => {
    if (!user?.id) return;
    await supabase
      .from('onboarding_progress')
      .update({ checklist_completed: true })
      .eq('user_id', user.id)
      .eq('site_id', site.id);
  };

  const getItemConfig = (stepKey: string) => {
    switch (stepKey) {
      case 'business_setup':
        return {
          title: 'Tu negocio configurado',
          description: `${site.name}${site.location ? ` · ${site.location}` : ''}${site.tone ? ` · Tono ${TONE_LABELS[site.tone] ?? site.tone}` : ''}`,
          actionLabel: 'Editar',
          onAction: () => navigate(`/site/${site.id}?tab=settings`),
        };
      case 'style_setup':
        return {
          title: 'Tu estilo definido',
          description: `Mood: ${MOOD_LABELS[site.mood ?? ''] ?? site.mood ?? 'Sin definir'} · Paleta: ${site.color_palette ?? 'sin definir'}`,
          actionLabel: 'Editar',
          onAction: () => navigate(`/site/${site.id}?tab=settings`),
        };
      case 'first_article':
        return {
          title: 'Tu primer artículo generado',
          description: articleTitle ? `"${articleTitle}"` : 'Artículo generado',
          actionLabel: 'Ver artículo',
          onAction: () => navigate(`/site/${site.id}`),
        };
      case 'wordpress_connect':
        return {
          title: 'Conectar tu WordPress',
          description: hasWordPress
            ? 'WordPress conectado ✓'
            : 'Sin esto, no podemos publicar en tu blog. Tarda unos 5 minutos.',
          actionLabel: hasWordPress ? 'Configurar' : 'Conectar WordPress →',
          onAction: () => setActiveStep('wordpress_connect'),
        };
      case 'first_publish':
        return {
          title: 'Publicar tu primer artículo',
          description: 'Publica el artículo que hemos generado.',
          actionLabel: 'Publicar →',
          onAction: () => setActiveStep('first_publish'),
          disabled: !hasWordPress,
        };
      case 'content_profile':
        return {
          title: 'Personalizar tu contenido',
          description: 'Ajusta los temas y el estilo de tus artículos.',
          actionLabel: 'Personalizar',
          onAction: () => setActiveStep('content_profile'),
        };
      case 'auto_publish':
        return {
          title: 'Activar publicación automática',
          description: 'Blooglee publicará artículos por ti.',
          actionLabel: 'Activar →',
          onAction: () => setActiveStep('auto_publish'),
          disabled: !hasWordPress,
        };
      default:
        return { title: stepKey, description: '' };
    }
  };

  // Render active step sub-screens
  if (activeStep === 'wordpress_connect') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <WordPressSetup
          siteId={site.id}
          onClose={() => setActiveStep(null)}
          onComplete={() => {
            setActiveStep(null);
            updateStep('wordpress_connect', 'completed');
          }}
        />
      </div>
    );
  }

  if (activeStep === 'first_publish') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <FirstPublishStep
          siteId={site.id}
          onComplete={() => {
            updateStep('first_publish', 'completed');
            setActiveStep(null);
          }}
          onBack={() => setActiveStep(null)}
        />
      </div>
    );
  }

  if (activeStep === 'content_profile') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <ContentProfileStep
          site={site}
          onSave={async (data) => {
            // Update site with content profile data
            await updateSiteMutation.mutateAsync({
              id: site.id,
              content_pillars: data.content_pillars,
              avoid_topics: data.avoid_topics,
              // notes go to target_audience as additional context
              target_audience: data.notes || site.target_audience || undefined,
            });
            updateStep('content_profile', 'completed', { content_pillars: data.content_pillars, avoid_topics: data.avoid_topics });
            toast.success('Perfil de contenido guardado');
            setActiveStep(null);
          }}
          onSkip={() => {
            updateStep('content_profile', 'completed');
            setActiveStep(null);
          }}
          onBack={() => setActiveStep(null)}
        />
      </div>
    );
  }

  if (activeStep === 'auto_publish') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <AutoPublishStep
          onActivate={async (config) => {
            // Map frequency to sites table format
            const frequencyMap: Record<string, string> = {
              weekly: 'weekly',
              biweekly: 'biweekly',
              fortnightly: 'fortnightly',
              monthly: 'monthly',
            };

            await updateSiteMutation.mutateAsync({
              id: site.id,
              publish_frequency: frequencyMap[config.frequency] ?? 'weekly',
              publish_day_of_week: config.dayOfWeek,
              publish_hour_utc: config.hourUtc,
              auto_generate: true,
              include_featured_image: config.includeFeaturedImage,
            });

            updateStep('auto_publish', 'completed', {
              frequency: config.frequency,
              review_mode: config.reviewMode,
            });

            // Check if all steps are now completed
            const pendingAfter = checklistItems.filter(
              i => i.status === 'pending' && i.step_key !== 'auto_publish'
            );
            if (pendingAfter.length === 0) {
              await markChecklistComplete();
            }

            toast.success('Publicación automática activada');
            // Don't go back — the component shows its own success state
          }}
          onBack={() => setActiveStep(null)}
        />
      </div>
    );
  }

  // Celebration banner when all complete
  if (allComplete) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-500">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center space-y-4">
            <PartyPopper className="w-12 h-12 mx-auto text-primary" />
            <h2 className="text-xl font-display font-bold text-foreground">
              🎉 ¡Todo configurado! Blooglee está trabajando para ti.
            </h2>
            <p className="text-sm text-muted-foreground">
              Tu blog se actualizará automáticamente. Puedes ver y gestionar tus artículos desde el dashboard.
            </p>
            <Button
              onClick={async () => {
                await markChecklistComplete();
                // Force a page reload to show normal dashboard
                window.location.reload();
              }}
            >
              Ir al dashboard →
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-xl font-display font-bold text-foreground">
          ¡Buen trabajo{userName ? `, ${userName}` : ''}! Ya casi está todo listo.
        </h2>
        <p className="text-sm text-muted-foreground">
          Completa estos pasos para que Blooglee empiece a publicar automáticamente en tu blog.
        </p>
      </div>

      <SetupProgress percentage={progressPercentage} />

      <div className="space-y-2">
        {checklistItems.map((item) => {
          const config = getItemConfig(item.step_key);
          const isCurrent = nextPending === item.step_key;

          return (
            <ChecklistItem
              key={item.id}
              stepKey={item.step_key}
              title={config.title}
              description={config.description}
              status={item.status}
              isCurrentStep={isCurrent}
              actionLabel={config.actionLabel}
              onAction={config.onAction}
              disabled={'disabled' in config ? config.disabled : undefined}
            />
          );
        })}
      </div>

      <div className="text-center pt-2">
        <a
          href="https://wa.me/34600000000"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          ¿Necesitas ayuda? 💬 Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}
