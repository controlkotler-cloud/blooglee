import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_LABELS = ['Negocio', 'Estilo', 'Contenido', 'Publicación', 'Tema', 'Generando', '¡Listo!'];

export function ProgressBar({ currentStep, totalSteps = 5 }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center w-full pt-3 sm:pt-4 pb-5 sm:pb-8 mb-2 sm:mb-4">
      <div className="flex items-center gap-0">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;

          return (
            <div key={step} className="flex items-center">
              {/* Dot + label */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                    isActive ? 'w-7 h-7 sm:w-9 sm:h-9' : 'w-6 h-6 sm:w-8 sm:h-8',
                    isCompleted && 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm',
                    isActive && 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md animate-[onboarding-pulse_2s_ease-in-out_infinite]',
                    !isCompleted && !isActive && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : step}
                </div>
                {/* Labels hidden on mobile */}
                <span
                  className={cn(
                    'hidden sm:block text-xs mt-2 font-medium whitespace-nowrap',
                    isActive && 'text-violet-600 dark:text-violet-400 font-semibold',
                    isCompleted && 'text-foreground/70',
                    !isActive && !isCompleted && 'text-muted-foreground/70'
                  )}
                >
                  {STEP_LABELS[i]}
                </span>
              </div>

              {/* Connector line */}
              {step < totalSteps && (
                <div
                  className={cn(
                    'w-6 sm:w-12 h-[3px] mx-0.5 sm:mx-1 rounded-full transition-all duration-500',
                    // On mobile, no label so no negative margin needed
                    'sm:mt-[-16px]',
                    currentStep > step
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                      : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
