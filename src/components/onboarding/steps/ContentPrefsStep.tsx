import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Languages, Image, Ban, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { OnboardingNavButtons } from '../OnboardingNavButtons';
import { PolylangSetupGuide } from '@/components/saas/PolylangSetupGuide';
import type { OnboardingStepData } from '@/hooks/useOnboarding';

const SECTOR_AVOID_PLACEHOLDER: Record<string, string> = {
  farmacia: 'Ej: medicamentos con receta, diagnósticos médicos, precios de productos',
  clinica_dental: 'Ej: procedimientos quirúrgicos específicos, precios de tratamientos',
  restaurante: 'Ej: recetas con copyright, críticas a competidores',
  peluqueria: 'Ej: productos químicos peligrosos, tratamientos médicos capilares',
  gimnasio: 'Ej: suplementos no regulados, dietas extremas, esteroides',
  veterinaria: 'Ej: automedicación animal, diagnósticos sin consulta',
  inmobiliaria: 'Ej: predicciones de precios, zonas conflictivas',
  asesoria: 'Ej: asesoramiento fiscal específico, evasión fiscal',
  ecommerce: 'Ej: comparaciones directas con competidores, precios de terceros',
  marketing: 'Ej: tácticas de spam, promesas de resultados garantizados',
};

interface ContentPrefsStepProps {
  onNext: () => void;
  onBack: () => void;
  saveStepData: (key: string, data: object) => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

export function ContentPrefsStep({ onNext, onBack, saveStepData, stepData, siteId }: ContentPrefsStepProps) {
  const sector = stepData?.step1?.sector ?? '';
  const websiteUrl = (stepData?.step1?.website_url as string) ?? '';
  const savedPrefs = stepData?.step_content_prefs as Record<string, unknown> | undefined;

  const [catalan, setCatalan] = useState<boolean>((savedPrefs?.catalan as boolean) ?? false);
  const [includeFeaturedImage, setIncludeFeaturedImage] = useState<boolean>((savedPrefs?.include_featured_image as boolean) ?? true);
  const [avoidTopics, setAvoidTopics] = useState<string>((savedPrefs?.avoid_topics as string) ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [polylangGuideOpen, setPolylangGuideOpen] = useState(false);

  const siteOrigin = websiteUrl ? (() => { try { return new URL(websiteUrl).origin; } catch { return undefined; } })() : undefined;

  const avoidPlaceholder = SECTOR_AVOID_PLACEHOLDER[sector] ?? 'Ej: temas polémicos, competidores directos';

  const handleNext = async () => {
    setIsSaving(true);
    try {
      const languages = catalan ? ['spanish', 'catalan'] : ['spanish'];
      const avoidArray = avoidTopics.split(',').map((t) => t.trim()).filter(Boolean);

      await saveStepData('step_content_prefs', { catalan, include_featured_image: includeFeaturedImage, avoid_topics: avoidTopics });
      track('onboarding_content_prefs', { catalan, include_featured_image: includeFeaturedImage, avoid_topics_count: avoidArray.length });

      if (siteId) {
        await supabase.from('sites').update({ languages, include_featured_image: includeFeaturedImage, avoid_topics: avoidArray }).eq('id', siteId);
      }

      onNext();
    } catch (err) {
      console.error('Error in ContentPrefsStep:', err);
      toast.error('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Personaliza tu contenido
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Configura idiomas, imágenes y temas que prefieres evitar. Podrás cambiarlo después.
        </p>
      </div>

      {/* Languages */}
      <div className="space-y-3 p-3 sm:p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Idiomas del blog</Label>
        </div>
        <p className="text-xs text-muted-foreground">El español está siempre incluido. Activa catalán si tu audiencia lo necesita.</p>
        <div className="flex items-center gap-2">
          <Checkbox id="catalan" checked={catalan} onCheckedChange={(checked) => setCatalan(checked === true)} />
          <label htmlFor="catalan" className="text-sm cursor-pointer">Generar también en catalán</label>
        </div>
        {catalan && (
          <>
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <p>
                  Para publicar en dos idiomas necesitas hacer <strong>2 cosas</strong> en tu WordPress:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-1">
                  <li>Instalar el plugin <strong>Polylang</strong> y configurar los idiomas Español (es) y Catalán (ca).</li>
                  <li>Añadir un pequeño código PHP para que la API REST de WordPress acepte el idioma.</li>
                </ol>
                <button
                  type="button"
                  onClick={() => setPolylangGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 underline font-semibold text-amber-900 dark:text-amber-200 hover:text-amber-700 dark:hover:text-amber-100"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Ver guía de configuración paso a paso
                </button>
                <p className="text-[11px] opacity-80">
                  No te preocupes, podrás configurarlo más adelante cuando conectes tu WordPress.
                </p>
              </AlertDescription>
            </Alert>
            <PolylangSetupGuide
              open={polylangGuideOpen}
              onOpenChange={setPolylangGuideOpen}
              siteUrl={siteOrigin}
              onVerify={() => {}}
              isVerifying={false}
              verifyResult={null}
              verifyMessage=""
              hideVerifyButton
            />
          </>
        )}
      </div>

      {/* Featured image */}
      <div className="space-y-3 p-3 sm:p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Imagen destacada</Label>
        </div>
        <p className="text-xs text-muted-foreground">La imagen destacada aparece en la cabecera de tu post y en redes sociales al compartir.</p>
        <div className="flex items-center justify-between">
          <label htmlFor="featured-image" className="text-sm cursor-pointer">Incluir imagen destacada generada por IA</label>
          <Switch id="featured-image" checked={includeFeaturedImage} onCheckedChange={setIncludeFeaturedImage} />
        </div>
      </div>

      {/* Avoid topics */}
      <div className="space-y-3 p-3 sm:p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2">
          <Ban className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Temas a evitar</Label>
        </div>
        <p className="text-xs text-muted-foreground">Indica temas que no quieres que aparezcan en tus artículos, separados por comas.</p>
        <Textarea
          rows={2}
          placeholder={avoidPlaceholder}
          value={avoidTopics}
          onChange={(e) => setAvoidTopics(e.target.value)}
          className="text-base sm:text-sm resize-none rounded-lg min-h-[48px]"
          maxLength={500}
        />
        <p className="text-[13px] text-muted-foreground">Opcional · Separados por comas</p>
      </div>

      {/* Navigation */}
      <OnboardingNavButtons onNext={handleNext} onBack={onBack} isSaving={isSaving} />
    </div>
  );
}
