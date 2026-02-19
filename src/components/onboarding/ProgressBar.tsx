import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_LABELS = ['Negocio', 'Estilo', 'Contenido', 'Publicación', 'Tema', 'Generando', '¡Listo!'];

export function ProgressBar({ currentStep, totalSteps = 5 }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center w-full mb-10">
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
                    isActive && 'w-9 h-9',
                    !isActive && 'w-8 h-8',
                    isCompleted && 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm',
                    isActive && 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md animate-[onboarding-pulse_2s_ease-in-out_infinite]',
                    !isCompleted && !isActive && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 font-medium whitespace-nowrap',
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
                    'w-8 sm:w-12 h-[3px] mx-1 mt-[-16px] rounded-full transition-all duration-500',
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
