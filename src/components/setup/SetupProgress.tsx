import { Progress } from '@/components/ui/progress';

interface SetupProgressProps {
  percentage: number;
}

export function SetupProgress({ percentage }: SetupProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progreso de configuración</span>
        <span className="font-semibold text-foreground">{percentage}% completado</span>
      </div>
      <Progress value={percentage} className="h-3" />
    </div>
  );
}
