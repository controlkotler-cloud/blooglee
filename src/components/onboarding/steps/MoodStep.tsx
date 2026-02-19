import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import { OnboardingNavButtons } from '../OnboardingNavButtons';
import type { OnboardingStepData } from '@/hooks/useOnboarding';

const MOODS = [
  { value: 'warm_and_welcoming', icon: '🌅', label: 'Cercano y cálido', desc: 'Colores cálidos, iluminación suave. Transmite confianza y cercanía.' },
  { value: 'clean_and_clinical', icon: '🏢', label: 'Profesional y limpio', desc: 'Líneas claras, tonos neutros. Transmite seriedad y fiabilidad.' },
  { value: 'energetic', icon: '⚡', label: 'Dinámico y activo', desc: 'Colores vivos, composiciones dinámicas. Transmite energía y movimiento.' },
  { value: 'calm_and_trustworthy', icon: '🌿', label: 'Natural y tranquilo', desc: 'Tonos naturales, espacios abiertos. Transmite calma y equilibrio.' },
];

const SECTOR_MOOD_MAP: Record<string, string> = {
  farmacia: 'warm_and_welcoming', peluqueria: 'warm_and_welcoming',
  clinica_dental: 'clean_and_clinical', asesoria: 'clean_and_clinical',
  inmobiliaria: 'clean_and_clinical', restaurante: 'energetic',
  gimnasio: 'energetic', ecommerce: 'energetic',
  veterinaria: 'calm_and_trustworthy', marketing: 'clean_and_clinical',
};

interface MoodStepProps {
  onNext: () => void;
  onBack: () => void;
  saveStepData: (key: string, data: object) => void;
  stepData?: OnboardingStepData;
  siteId?: string;
  colors?: string[];
  extractionStatus?: 'idle' | 'extracting' | 'done' | 'failed';
}

export function MoodStep({
  onNext, onBack, saveStepData, stepData, siteId,
  colors = [], extractionStatus = 'idle',
}: MoodStepProps) {
  const sector = stepData?.step1?.sector ?? '';
  const recommendedMood = SECTOR_MOOD_MAP[sector] ?? '';

  const [mood, setMood] = useState(stepData?.step2b?.mood ?? recommendedMood);
  const [useBrandColors, setUseBrandColors] = useState(stepData?.step2b?.use_brand_colors ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const hasColors = colors.length > 0 && extractionStatus === 'done';
  const isExtracting = extractionStatus === 'extracting';
  const canProceed = mood.length > 0;

  const handleNext = async () => {
    if (!canProceed) return;
    setIsSaving(true);
    try {
      const data = { mood, use_brand_colors: hasColors ? useBrandColors : false };
      await saveStepData('step2b', data);
      track('onboarding_mood_selected', { mood, pre_selected: mood === recommendedMood });
      if (siteId) {
        await supabase.from('sites').update({ mood, use_brand_colors: hasColors ? useBrandColors : false }).eq('id', siteId);
      }
      onNext();
    } catch (err) {
      console.error('Error in MoodStep:', err);
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
          ¿Qué estilo visual quieres para tus imágenes?
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Cada artículo tendrá una imagen destacada generada por IA. Elige el estilo que mejor encaje con tu marca.
        </p>
      </div>

      {/* Mood cards */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Estilo visual <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOODS.map((m) => {
            const isSelected = mood === m.value;
            const isRecommended = recommendedMood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
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
                <span className="text-[28px] mb-1 mt-1">{m.icon}</span>
                <span className="text-sm font-semibold text-foreground">{m.label}</span>
                <span className="text-xs text-muted-foreground leading-snug">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color palette section */}
      {isExtracting && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 px-4 rounded-lg bg-muted/50">
          <Loader2 className="w-4 h-4 animate-spin" />
          🎨 Detectando los colores de tu web...
        </div>
      )}

      {hasColors && (
        <div className="space-y-3 py-3 px-4 rounded-lg bg-muted/50">
          <p className="text-sm font-medium">🎨 Hemos detectado los colores de tu web:</p>
          <div className="flex items-center gap-3 flex-wrap">
            {colors.map((hex) => (
              <div key={hex} className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: hex }} />
                <span className="text-[10px] text-muted-foreground font-mono">{hex}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="use-brand-colors" checked={useBrandColors} onCheckedChange={(c) => setUseBrandColors(c === true)} />
            <label htmlFor="use-brand-colors" className="text-sm cursor-pointer">Usar mis colores de marca</label>
          </div>
          <p className="text-xs text-muted-foreground">Usaremos estos colores en tus imágenes combinados con el estilo que elijas.</p>
        </div>
      )}

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
