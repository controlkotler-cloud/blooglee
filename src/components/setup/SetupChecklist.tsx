import { useNavigate } from 'react-router-dom';
import { useChecklist } from '@/hooks/useChecklist';
import { useProfile } from '@/hooks/useProfile';
import { useSites, type Site } from '@/hooks/useSites';
import { useAllArticlesSaas, type ArticleContent } from '@/hooks/useArticlesSaas';
import { useWordPressConfigsBatch } from '@/hooks/useWordPressConfigSaas';
import { SetupProgress } from './SetupProgress';
import { ChecklistItem } from './ChecklistItem';
import { MessageCircle } from 'lucide-react';

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

interface SetupChecklistProps {
  site: Site;
}

export function SetupChecklist({ site }: SetupChecklistProps) {
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: articles = [] } = useAllArticlesSaas(currentMonth, currentYear);
  const { data: wpConfigsMap = {} } = useWordPressConfigsBatch([site.id]);

  const {
    checklistItems,
    progressPercentage,
    getNextPendingStep,
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

  const getItemConfig = (stepKey: string) => {
    const isCurrent = nextPending === stepKey;

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
          description: 'Sin esto, no podemos publicar en tu blog. Tarda unos 5 minutos.',
          actionLabel: 'Conectar WordPress →',
          onAction: () => navigate(`/site/${site.id}?tab=wordpress`),
        };
      case 'first_publish':
        return {
          title: 'Publicar tu primer artículo',
          description: 'Publica el artículo que hemos generado.',
          actionLabel: 'Publicar →',
          onAction: () => navigate(`/site/${site.id}`),
          disabled: !hasWordPress,
        };
      case 'content_profile':
        return {
          title: 'Personalizar tu contenido',
          description: 'Ajusta los temas y el estilo de tus artículos.',
          actionLabel: 'Personalizar',
          onAction: () => navigate(`/site/${site.id}?tab=settings`),
        };
      case 'auto_publish':
        return {
          title: 'Activar publicación automática',
          description: 'Blooglee publicará artículos por ti.',
          actionLabel: 'Activar →',
          onAction: () => navigate(`/site/${site.id}?tab=settings`),
          disabled: !hasWordPress,
        };
      default:
        return {
          title: stepKey,
          description: '',
        };
    }
  };

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
