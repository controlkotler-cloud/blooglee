import { useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { OnboardingNavButtons } from '../OnboardingNavButtons';
import type { OnboardingStepData } from '@/hooks/useOnboarding';

const TONES = [
  { value: 'friendly', icon: '🤝', label: 'Cercano y amigable', desc: 'Como hablar con un vecino. Tuteo, lenguaje sencillo.' },
  { value: 'professional', icon: '👔', label: 'Profesional', desc: 'Formal pero accesible. Usted, sin jerga excesiva.' },
  { value: 'expert', icon: '🎓', label: 'Experto', desc: 'Técnico y detallado. Posiciónate como autoridad en tu sector.' },
  { value: 'educational', icon: '💬', label: 'Divulgativo', desc: 'Explica temas complejos de forma sencilla. Ideal para salud, legal, finanzas.' },
];

const SECTOR_TONE_MAP: Record<string, string> = {
  farmacia: 'friendly', peluqueria: 'friendly', restaurante: 'friendly',
  clinica_dental: 'professional', asesoria: 'professional', inmobiliaria: 'professional',
  gimnasio: 'friendly', ecommerce: 'friendly', marketing: 'friendly',
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

      if (!audience.trim()) {
        track('onboarding_step_skipped', { step: 2, field: 'audience' });
      }

      if (siteId) {
        await supabase
          .from('sites')
          .update({ tone, target_audience: audience.trim() || null })
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
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
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
                className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all duration-200 min-h-[130px] ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/40 hover:shadow-sm'
                }`}
              >
                {isRecommended && (
                  <span className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[11px] font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2.5 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    Recomendado
                  </span>
                )}
                {isSelected && !isRecommended && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </span>
                )}
                <span className="text-[28px] mb-1 mt-1">{t.icon}</span>
                <span className="text-sm font-semibold text-foreground">{t.label}</span>
                <span className="text-xs text-muted-foreground leading-snug">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audience */}
      <div className="space-y-1.5">
        <Label htmlFor="audience" className="text-sm font-medium">
          Tu audiencia ideal
        </Label>
        <Textarea
          id="audience"
          rows={2}
          placeholder={audiencePlaceholder}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="text-base resize-none rounded-lg"
          maxLength={200}
        />
        <p className="text-[13px] text-muted-foreground">Opcional · Puedes añadirlo después</p>
      </div>

      {/* Navigation */}
      <OnboardingNavButtons
        onNext={handleNext}
        onBack={onBack}
        nextDisabled={!canProceed}
        isSaving={isSaving}
      />
    </div>
  );
}
