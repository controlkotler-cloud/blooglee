import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { OnboardingNavButtons } from "../OnboardingNavButtons";
import type { OnboardingStepData } from "@/hooks/useOnboarding";

const TOPIC_EMOJIS = ["📋", "🌿", "💊"];

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
  const [customTopic, setCustomTopic] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const businessName = stepData?.step1?.business_name ?? "tu negocio";

  useEffect(() => {
    if (stepData?.step3?.topic_options && Array.isArray(stepData.step3.topic_options)) {
      const cached = stepData.step3.topic_options as unknown as Topic[];
      if (cached.length > 0 && cached[0]?.title) {
        setTopics(cached);
        setIsLoading(false);
        if (stepData.step3.selected_topic) {
          const idx = cached.findIndex((t) => t.title === stepData.step3!.selected_topic);
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
      const { data, error } = await supabase.functions.invoke("suggest-topics", {
        body: {
          sector: stepData?.step1?.sector ?? "",
          business_type: stepData?.step1?.business_type ?? "",
          location: stepData?.step1?.location ?? "",
          audience: stepData?.step2?.audience ?? "",
          custom_topic: stepData?.step2?.custom_topic ?? "",
          content_goal: stepData?.step2?.content_goal ?? "",
          content_pillars: stepData?.step2?.content_pillars ?? [],
          priority_topics: stepData?.step_content_prefs?.priority_topics ?? "",
          avoid_topics: stepData?.step_content_prefs?.avoid_topics ?? "",
          angle_to_avoid: stepData?.step_content_prefs?.angle_to_avoid ?? "",
          tone: stepData?.step2?.tone ?? "",
        },
      });
      if (error) throw error;
      if (data?.topics && Array.isArray(data.topics)) setTopics(data.topics);
    } catch (err) {
      console.error("Error fetching topics:", err);
      toast.error("No pudimos generar temas. Escribe el tuyo propio.");
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
        : "";

  const canProceed = selectedTopic.length > 0;

  const handleSelectTopic = (idx: number) => {
    setSelectedIndex(idx);
    setCustomMode(false);
    setCustomTopic("");
  };
  const handleCustomMode = () => {
    setCustomMode(true);
    setSelectedIndex(null);
  };

  const handleNext = async () => {
    if (!canProceed) return;
    setIsSaving(true);
    try {
      await saveStepData("step3", { selected_topic: selectedTopic, topic_options: topics });
      track("onboarding_topic_selected", { type: customMode ? "custom" : "suggested" });
      onNext();
    } catch (err) {
      console.error("Error in TopicStep:", err);
      toast.error("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Elige el tema de tu primer artículo
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Hemos pensado estos temas para <span className="font-medium text-foreground">{businessName}</span>. ¡Elige el
          que más te guste!
        </p>
      </div>

      {/* Topic cards */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Tema del artículo <span className="text-destructive">*</span>
        </Label>
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
                    className={`w-full flex items-start gap-3 p-3 sm:p-4 rounded-xl border-2 text-left transition-all duration-200 min-h-[60px] sm:min-h-[80px] ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/40 hover:shadow-sm"
                    }`}
                  >
                    <span className="text-[24px] sm:text-[28px] mt-0.5 shrink-0">{TOPIC_EMOJIS[idx] ?? "📝"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug text-foreground">{topic.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">{topic.description}</p>
                    </div>
                    {isSelected && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center mt-1 animate-checkmark-pop">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Custom topic */}
              <button
                type="button"
                onClick={handleCustomMode}
                className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 border-dashed text-left transition-all duration-200 min-h-[48px] ${
                  customMode ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <Pencil className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">✏️ Prefiero escribir mi propio tema...</span>
              </button>

              {customMode && (
                <div className="pl-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    autoFocus
                    placeholder="Escribe el título de tu artículo"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    maxLength={150}
                    className="text-base h-12 sm:h-11 rounded-lg"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <OnboardingNavButtons
        onNext={handleNext}
        onBack={onBack}
        nextLabel="Generar artículo"
        nextDisabled={!canProceed || isLoading}
        isSaving={isSaving}
      />
    </div>
  );
}
