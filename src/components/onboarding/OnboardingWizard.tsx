import { useState, useEffect, useRef } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useColorPalette } from '@/hooks/useColorPalette';
import { OnboardingLayout } from './OnboardingLayout';
import { ProgressBar } from './ProgressBar';
import { StepTransition } from './StepTransition';
import { BusinessStep } from './steps/BusinessStep';
import { ToneStep } from './steps/ToneStep';
import { MoodStep } from './steps/MoodStep';
import { ContentPrefsStep } from './steps/ContentPrefsStep';
import { SchedulingStep } from './steps/SchedulingStep';
import { TopicStep } from './steps/TopicStep';
import { GeneratingStep } from './steps/GeneratingStep';
import { ArticleReadyStep } from './steps/ArticleReadyStep';
import { WordPressOnboardingStep } from './steps/WordPressOnboardingStep';
import { track } from '@/lib/analytics';

const STEP_NAMES: Record<number, string> = {
  1: 'business', 2: 'tone', 3: 'mood', 4: 'content_prefs',
  5: 'scheduling', 6: 'topic', 7: 'generating', 8: 'article_ready', 9: 'wordpress_setup',
};

function mapStepToProgressPoint(step: number): number {
  if (step <= 1) return 1;
  if (step <= 3) return 2;
  if (step === 4) return 3;
  if (step === 5) return 4;
  if (step === 6) return 5;
  if (step === 7) return 6;
  return 7;
}

export function OnboardingWizard() {
  const {
    currentStep, stepData, isLoading, siteId,
    saveStepData, nextStep, prevStep, createProgress, completeWizard,
  } = useOnboarding();

  const wizardStartRef = useRef<number>(Date.now());
  const trackedStartRef = useRef(false);
  const prevStepRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const { colors, extractionStatus } = useColorPalette();

  // Track wizard started (once)
  useEffect(() => {
    if (!isLoading && !trackedStartRef.current) {
      trackedStartRef.current = true;
      track('onboarding_wizard_started');
    }
  }, [isLoading]);

  // Track step completion + direction
  useEffect(() => {
    if (isLoading || prevStepRef.current === null) {
      prevStepRef.current = currentStep;
      return;
    }
    const prev = prevStepRef.current;
    prevStepRef.current = currentStep;
    setDirection(currentStep > prev ? 'forward' : 'backward');
    if (currentStep > prev) {
      track('onboarding_step_completed', { step: prev, step_name: STEP_NAMES[prev] ?? `step_${prev}` });
    }
  }, [currentStep, isLoading]);

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BusinessStep onNext={nextStep} saveStepData={saveStepData} createProgress={createProgress} initialData={stepData.step1} />;
      case 2:
        return <ToneStep onNext={nextStep} onBack={prevStep} saveStepData={saveStepData} stepData={stepData} siteId={siteId} />;
      case 3:
        return <MoodStep onNext={nextStep} onBack={prevStep} saveStepData={saveStepData} stepData={stepData} siteId={siteId} colors={colors} extractionStatus={extractionStatus} />;
      case 4:
        return <ContentPrefsStep onNext={nextStep} onBack={prevStep} saveStepData={saveStepData} stepData={stepData} siteId={siteId} />;
      case 5:
        return <SchedulingStep onNext={nextStep} onBack={prevStep} saveStepData={saveStepData} stepData={stepData} siteId={siteId} />;
      case 6:
        return <TopicStep onNext={nextStep} onBack={prevStep} saveStepData={saveStepData} stepData={stepData} />;
      case 7:
        return <GeneratingStep onNext={nextStep} saveStepData={saveStepData} stepData={stepData} siteId={siteId} />;
      case 8:
        return <ArticleReadyStep onFinish={handleCompleteWizard} onConnectWordPress={() => nextStep()} stepData={stepData} siteId={siteId} />;
      case 9:
        return <WordPressOnboardingStep onFinish={handleCompleteWizard} stepData={stepData} siteId={siteId} />;
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout>
      <ProgressBar currentStep={progressPoint} totalSteps={7} />
      <StepTransition stepKey={currentStep} direction={direction}>
        {renderStep()}
      </StepTransition>
    </OnboardingLayout>
  );
}
