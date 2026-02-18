import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChecklistItemProps {
  stepKey: string;
  title: string;
  description: string;
  status: string;
  isCurrentStep: boolean;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
}

export function ChecklistItem({
  title,
  description,
  status,
  isCurrentStep,
  actionLabel,
  onAction,
  disabled,
}: ChecklistItemProps) {
  const isCompleted = status === 'completed';

  const content = (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
        isCompleted
          ? 'bg-card border-border'
          : isCurrentStep
          ? 'bg-primary/5 border-primary/30'
          : 'bg-muted/30 border-border/50'
      }`}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : isCurrentStep ? (
          <CircleDot className="w-5 h-5 text-primary" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground/40" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            isCompleted
              ? 'text-foreground'
              : isCurrentStep
              ? 'text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          {title}
        </p>
        <p
          className={`text-xs mt-0.5 ${
            isCompleted || isCurrentStep ? 'text-muted-foreground' : 'text-muted-foreground/60'
          }`}
        >
          {description}
        </p>
      </div>

      {/* Action */}
      {actionLabel && onAction && (
        <Button
          size="sm"
          variant={isCurrentStep ? 'default' : 'outline'}
          onClick={onAction}
          disabled={disabled}
          className={
            isCurrentStep
              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shrink-0'
              : 'shrink-0'
          }
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );

  if (disabled && !isCompleted) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>Completa los pasos anteriores</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
