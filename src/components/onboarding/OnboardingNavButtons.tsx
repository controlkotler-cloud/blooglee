import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface OnboardingNavButtonsProps {
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isSaving?: boolean;
  nextIcon?: ReactNode;
}

export function OnboardingNavButtons({
  onNext,
  onBack,
  nextLabel = 'Siguiente',
  nextDisabled = false,
  isSaving = false,
  nextIcon,
}: OnboardingNavButtonsProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-6 px-6 pt-4 pb-5 mt-6 bg-gradient-to-t from-white via-white to-white/80 dark:from-background dark:via-background dark:to-background/80 border-t border-border/50">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="h-11 min-w-[120px] px-6 gap-2 text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={nextDisabled || isSaving}
          className="flex-1 h-11 min-w-[160px] text-base font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white gap-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              {nextLabel}
              {nextIcon || <ArrowRight className="w-4 h-4" />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
