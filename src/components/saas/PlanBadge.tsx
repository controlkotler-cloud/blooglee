import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlanType = 'free' | 'starter' | 'pro' | 'agency';

interface PlanBadgeProps {
  plan: PlanType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const planConfig: Record<PlanType, { label: string; className: string }> = {
  free: {
    label: 'Free',
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
  starter: {
    label: 'Starter',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  },
  pro: {
    label: 'Pro',
    className: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  },
  agency: {
    label: 'Agency',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export function PlanBadge({ plan, size = 'md', showIcon = true }: PlanBadgeProps) {
  const config = planConfig[plan];
  const isPaid = plan !== 'free';

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.className,
        sizeClasses[size]
      )}
    >
      {showIcon && isPaid && (
        <Crown className={cn(iconSizes[size], 'mr-1')} />
      )}
      {config.label}
    </Badge>
  );
}
