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

/**
 * Maps internal steps (1-6) to progress bar points (1-5):
 * step 1 → point 1 (Negocio)
 * step 2,3 → point 2 (Estilo) — tono + mood visual
 * step 4 → point 3 (Tema)
 * step 5 → point 4 (Generando)
 * step 6 → point 5 (¡Listo!)
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

  const { colors, extractionStatus } = useColorPalette();

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
        <ArticleReadyStep onFinish={completeWizard} stepData={stepData} siteId={siteId} />
      )}
    </OnboardingLayout>
  );
}
