import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import type { OnboardingStepData } from '@/hooks/useOnboarding';

const TONES = [
  {
    value: 'friendly',
    icon: '🤝',
    label: 'Cercano y amigable',
    desc: 'Como hablar con un vecino. Tuteo, lenguaje sencillo.',
  },
  {
    value: 'professional',
    icon: '👔',
    label: 'Profesional',
    desc: 'Formal pero accesible. Usted, sin jerga excesiva.',
  },
  {
    value: 'expert',
    icon: '🎓',
    label: 'Experto',
    desc: 'Técnico y detallado. Para posicionarte como autoridad en tu sector.',
  },
  {
    value: 'educational',
    icon: '💬',
    label: 'Divulgativo',
    desc: 'Explica temas complejos de forma sencilla. Ideal para salud, legal, finanzas.',
  },
];

const SECTOR_TONE_MAP: Record<string, string> = {
  farmacia: 'friendly',
  peluqueria: 'friendly',
  restaurante: 'friendly',
  clinica_dental: 'professional',
  asesoria: 'professional',
  inmobiliaria: 'professional',
  gimnasio: 'friendly',
  ecommerce: 'friendly',
  marketing: 'friendly',
  veterinaria: 'educational',
};

const SECTOR_AUDIENCE_PLACEHOLDER: Record<string, string> = {
  farmacia: 'Ej: Personas de 40-70 años preocupadas por su salud',
  restaurante: 'Ej: Familias y parejas de la zona que buscan dónde comer',
  clinica_dental: 'Ej: Adultos de 25-55 años que buscan dentista de confianza',
  gimnasio: 'Ej: Personas de 20-45 años que quieren ponerse en forma',
};

interface ToneStepProps {
  onNext: () => void;
  onBack: () => void;
  saveStepData: (key: string, data: object) => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

export function ToneStep({ onNext, onBack, saveStepData, stepData, siteId }: ToneStepProps) {
  const sector = stepData?.step1?.sector ?? '';
  const recommendedTone = SECTOR_TONE_MAP[sector] ?? '';

  const [tone, setTone] = useState(stepData?.step2?.tone ?? recommendedTone);
  const [audience, setAudience] = useState(stepData?.step2?.audience ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const audiencePlaceholder = useMemo(
    () => SECTOR_AUDIENCE_PLACEHOLDER[sector] ?? 'Describe brevemente a tu cliente ideal (opcional)',
    [sector]
  );

  const canProceed = tone.length > 0;

  const handleNext = async () => {
    if (!canProceed) return;
    setIsSaving(true);

    try {
      const data = { tone, audience: audience.trim() };
      await saveStepData('step2', data);

      // Track if audience was skipped
      if (!audience.trim()) {
        track('onboarding_step_skipped', { step: 2, field: 'audience' });
      }

      // Update site tone + target_audience
      if (siteId) {
        await supabase
          .from('sites')
          .update({
            tone,
            target_audience: audience.trim() || null,
          })
          .eq('id', siteId);
      }

      onNext();
    } catch (err) {
      console.error('Error in ToneStep:', err);
      toast.error('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          ¿Cómo quieres que suene tu blog?
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Elige el estilo que mejor represente a tu negocio. Podrás cambiarlo cuando quieras.
        </p>
      </div>

      {/* Tone cards */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tono de voz <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TONES.map((t) => {
            const isSelected = tone === t.value;
            const isRecommended = recommendedTone === t.value;

            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={`relative flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] ${
                  isSelected
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-sm'
                    : 'border-border hover:border-violet-300'
                }`}
              >
                {isRecommended && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    Recomendado
                  </span>
                )}
                <span className="text-2xl">{t.icon}</span>
                <span className="text-sm font-semibold">{t.label}</span>
                <span className="text-xs text-muted-foreground leading-snug">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audience */}
      <div className="space-y-2">
        <Label htmlFor="audience" className="text-sm font-medium">
          Tu audiencia ideal
        </Label>
        <Textarea
          id="audience"
          rows={2}
          placeholder={audiencePlaceholder}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="text-base resize-none"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">Opcional · Puedes añadirlo después</p>
      </div>

      {/* Buttons */}
      <div className="pt-4 border-t flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 px-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed || isSaving}
          className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white gap-2"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
