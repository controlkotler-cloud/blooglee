import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BadgeItem {
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

interface DetailItem {
  label: string;
  value: ReactNode;
}

interface MobileTableCardProps {
  title: string;
  subtitle?: string;
  badges?: BadgeItem[];
  details?: DetailItem[];
  actions?: ReactNode;
  className?: string;
}

export function MobileTableCard({
  title,
  subtitle,
  badges,
  details,
  actions,
  className,
}: MobileTableCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-1 shrink-0">
              {actions}
            </div>
          )}
        </div>

        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {badges.map((badge, idx) => (
              <Badge 
                key={idx} 
                variant={badge.variant || 'secondary'}
                className={cn("text-xs", badge.className)}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        )}

        {details && details.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-border/50">
            {details.map((detail, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{detail.label}:</span>
                <span className="text-xs font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
