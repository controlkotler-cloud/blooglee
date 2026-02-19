import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_LABELS = ['Negocio', 'Estilo', 'Contenido', 'Publicación', 'Tema', 'Generando', '¡Listo!'];

export function ProgressBar({ currentStep, totalSteps = 5 }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center w-full mb-8">
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
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                    isCompleted && 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white',
                    isActive && 'ring-2 ring-violet-500 ring-offset-2 ring-offset-violet-50 dark:ring-offset-background bg-white dark:bg-muted text-violet-600 dark:text-violet-400 font-bold',
                    !isCompleted && !isActive && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? '✓' : step}
                </div>
                <span
                  className={cn(
                    'text-[10px] mt-1.5 font-medium whitespace-nowrap',
                    isActive && 'text-violet-600 dark:text-violet-400',
                    isCompleted && 'text-violet-500',
                    !isActive && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {STEP_LABELS[i]}
                </span>
              </div>

              {/* Connector line */}
              {step < totalSteps && (
                <div
                  className={cn(
                    'w-8 sm:w-12 h-0.5 mx-1 mt-[-14px] transition-all duration-300',
                    currentStep > step
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                      : 'bg-muted'
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
