import { useState, useEffect, useRef } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useColorPalette } from '@/hooks/useColorPalette';
import { OnboardingLayout } from './OnboardingLayout';
import { ProgressBar } from './ProgressBar';
import { BusinessStep } from './steps/BusinessStep';
import { ToneStep } from './steps/ToneStep';
import { MoodStep } from './steps/MoodStep';
import { TopicStep } from './steps/TopicStep';
import { GeneratingStep } from './steps/GeneratingStep';
import { ArticleReadyStep } from './steps/ArticleReadyStep';
import { WordPressOnboardingStep } from './steps/WordPressOnboardingStep';
import { track } from '@/lib/analytics';

const STEP_NAMES: Record<number, string> = {
  1: 'business',
  2: 'tone',
  3: 'mood',
  4: 'topic',
  5: 'generating',
  6: 'article_ready',
  7: 'wordpress_setup',
};

/**
 * Maps internal steps (1-7) to progress bar points (1-5):
 * step 1 → point 1 (Negocio)
 * step 2,3 → point 2 (Estilo) — tono + mood visual
 * step 4 → point 3 (Tema)
 * step 5 → point 4 (Generando)
 * step 6,7 → point 5 (¡Listo!)
 */
function mapStepToProgressPoint(step: number): number {
  if (step <= 1) return 1;
  if (step <= 3) return 2;
  if (step === 4) return 3;
  if (step === 5) return 4;
  return 5;
}

export function OnboardingWizard() {
  const {
    currentStep,
    stepData,
    isLoading,
    siteId,
    saveStepData,
    nextStep,
    prevStep,
    createProgress,
    completeWizard,
  } = useOnboarding();

  const wizardStartRef = useRef<number>(Date.now());
  const trackedStartRef = useRef(false);
  const prevStepRef = useRef<number | null>(null);

  const { colors, extractionStatus } = useColorPalette();

  // Track wizard started (once)
  useEffect(() => {
    if (!isLoading && !trackedStartRef.current) {
      trackedStartRef.current = true;
      track('onboarding_wizard_started');
    }
  }, [isLoading]);

  // Track step completion when step changes
  useEffect(() => {
    if (isLoading || prevStepRef.current === null) {
      prevStepRef.current = currentStep;
      return;
    }
    const prev = prevStepRef.current;
    prevStepRef.current = currentStep;
    if (currentStep > prev) {
      track('onboarding_step_completed', { step: prev, step_name: STEP_NAMES[prev] ?? `step_${prev}` });
    }
  }, [currentStep, isLoading]);

  // Track color palette extraction results
  useEffect(() => {
    if (extractionStatus === 'done' && colors.length > 0) {
      track('onboarding_color_palette_extracted', { colors_count: colors.length, source: 'firecrawl' });
    } else if (extractionStatus === 'failed') {
      track('onboarding_color_palette_failed', { reason: 'firecrawl_error' });
    }
  }, [extractionStatus, colors.length]);

  const handleCompleteWizard = async () => {
    const totalDuration = Math.round((Date.now() - wizardStartRef.current) / 1000);
    track('onboarding_wizard_completed', { total_duration_seconds: totalDuration });
    await completeWizard();
  };

  if (isLoading) {
    return (
      <OnboardingLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </OnboardingLayout>
    );
  }

  const progressPoint = mapStepToProgressPoint(currentStep);

  return (
    <OnboardingLayout>
      <ProgressBar currentStep={progressPoint} totalSteps={5} />

      {currentStep === 1 && (
        <BusinessStep
          onNext={nextStep}
          saveStepData={saveStepData}
          createProgress={createProgress}
          initialData={stepData.step1}
        />
      )}
      {currentStep === 2 && (
        <ToneStep
          onNext={nextStep}
          onBack={prevStep}
          saveStepData={saveStepData}
          stepData={stepData}
          siteId={siteId}
        />
      )}
      {currentStep === 3 && (
        <MoodStep
          onNext={nextStep}
          onBack={prevStep}
          saveStepData={saveStepData}
          stepData={stepData}
          siteId={siteId}
          colors={colors}
          extractionStatus={extractionStatus}
        />
      )}
      {currentStep === 4 && (
        <TopicStep onNext={nextStep} onBack={prevStep} saveStepData={saveStepData} stepData={stepData} />
      )}
      {currentStep === 5 && (
        <GeneratingStep
          onNext={nextStep}
          saveStepData={saveStepData}
          stepData={stepData}
          siteId={siteId}
        />
      )}
      {currentStep === 6 && (
        <ArticleReadyStep
          onFinish={handleCompleteWizard}
          onConnectWordPress={() => {
            // Advance to step 7 (WordPress setup) without completing the wizard yet
            nextStep();
          }}
          stepData={stepData}
          siteId={siteId}
        />
      )}
      {currentStep === 7 && (
        <WordPressOnboardingStep
          onFinish={handleCompleteWizard}
          stepData={stepData}
          siteId={siteId}
        />
      )}
    </OnboardingLayout>
  );
}
