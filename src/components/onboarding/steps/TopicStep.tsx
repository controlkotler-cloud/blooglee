import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, ArrowLeft, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';
import type { OnboardingStepData } from '@/hooks/useOnboarding';

const TOPIC_EMOJIS = ['📋', '🌿', '💊'];

interface Topic {
  title: string;
  description: string;
}

interface TopicStepProps {
  onNext: () => void;
  onBack: () => void;
  saveStepData: (key: string, data: object) => void;
  stepData?: OnboardingStepData;
}

export function TopicStep({ onNext, onBack, saveStepData, stepData }: TopicStepProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const businessName = stepData?.step1?.business_name ?? 'tu negocio';

  useEffect(() => {
    // If we already have topics from a previous visit, use them
    if (stepData?.step3?.topic_options && Array.isArray(stepData.step3.topic_options)) {
      const cached = stepData.step3.topic_options as unknown as Topic[];
      if (cached.length > 0 && cached[0]?.title) {
        setTopics(cached);
        setIsLoading(false);

        // Restore selection
        if (stepData.step3.selected_topic) {
          const idx = cached.findIndex(t => t.title === stepData.step3!.selected_topic);
          if (idx >= 0) setSelectedIndex(idx);
          else {
            setCustomMode(true);
            setCustomTopic(stepData.step3.selected_topic as string);
          }
        }
        return;
      }
    }

    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-topics', {
        body: {
          sector: stepData?.step1?.sector ?? '',
          location: stepData?.step1?.location ?? '',
          audience: stepData?.step2?.audience ?? '',
          tone: stepData?.step2?.tone ?? '',
        },
      });

      if (error) throw error;
      if (data?.topics && Array.isArray(data.topics)) {
        setTopics(data.topics);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
      toast.error('No pudimos generar temas. Escribe el tuyo propio.');
      setCustomMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTopic =
    customMode && customTopic.trim()
      ? customTopic.trim()
      : selectedIndex !== null && topics[selectedIndex]
        ? topics[selectedIndex].title
        : '';

  const canProceed = selectedTopic.length > 0;

  const handleSelectTopic = (idx: number) => {
    setSelectedIndex(idx);
    setCustomMode(false);
    setCustomTopic('');
  };

  const handleCustomMode = () => {
    setCustomMode(true);
    setSelectedIndex(null);
  };

  const handleNext = async () => {
    if (!canProceed) return;
    setIsSaving(true);

    try {
      const data = {
        selected_topic: selectedTopic,
        topic_options: topics,
      };
      await saveStepData('step3', data);
      track('onboarding_topic_selected', { type: customMode ? 'custom' : 'suggested' });
      onNext();
    } catch (err) {
      console.error('Error in TopicStep:', err);
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
          Elige el tema de tu primer artículo
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Hemos pensado estos temas para <span className="font-medium text-foreground">{businessName}</span>. ¡Elige el que más te guste!
        </p>
      </div>

      {/* Topic cards or skeletons */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tema del artículo <span className="text-destructive">*</span></Label>

        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border-2 border-border space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </>
          ) : (
            <>
              {topics.map((topic, idx) => {
                const isSelected = selectedIndex === idx && !customMode;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectTopic(idx)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.005] ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-sm'
                        : 'border-border hover:border-violet-300'
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{TOPIC_EMOJIS[idx] ?? '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug">{topic.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">{topic.description}</p>
                    </div>
                  </button>
                );
              })}

              {/* Custom topic option */}
              <button
                type="button"
                onClick={handleCustomMode}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed text-left transition-all ${
                  customMode
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-border hover:border-violet-300'
                }`}
              >
                <Pencil className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Prefiero escribir mi propio tema...</span>
              </button>

              {customMode && (
                <div className="pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Input
                    autoFocus
                    placeholder="Escribe el título de tu artículo"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    maxLength={150}
                    className="text-base"
                  />
                </div>
              )}
            </>
          )}
        </div>
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
          disabled={!canProceed || isSaving || isLoading}
          className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white gap-2"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              Generar artículo
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
