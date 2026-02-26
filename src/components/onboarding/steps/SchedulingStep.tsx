import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Zap, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { useProfile } from "@/hooks/useProfile";
import { OnboardingNavButtons } from "../OnboardingNavButtons";
import type { OnboardingStepData } from "@/hooks/useOnboarding";

const DAYS_OF_WEEK = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
  { value: "0", label: "Domingo" },
];
const WEEKS_OF_MONTH = [
  { value: "1", label: "Primera semana" },
  { value: "2", label: "Segunda semana" },
  { value: "3", label: "Tercera semana" },
  { value: "4", label: "Cuarta semana" },
];
const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: `${String(i).padStart(2, "0")}:00` }));

function localToUtc(localHour: number): number {
  const now = new Date();
  now.setHours(localHour, 0, 0, 0);
  return now.getUTCHours();
}

interface SchedulingStepProps {
  onNext: () => void;
  onBack: () => void;
  saveStepData: (key: string, data: object) => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

export function SchedulingStep({ onNext, onBack, saveStepData, stepData, siteId }: SchedulingStepProps) {
  const { data: profile } = useProfile();
  const userPlan = profile?.plan ?? "free";
  const isFreePlan = userPlan === "free";
  const saved = stepData?.step_scheduling as Record<string, unknown> | undefined;

  const [autoGenerate, setAutoGenerate] = useState<boolean>((saved?.auto_generate as boolean) ?? true);
  const [frequency, setFrequency] = useState<string>((saved?.frequency as string) ?? "monthly");
  const [dayOfWeek, setDayOfWeek] = useState<string>((saved?.day_of_week as string) ?? "2");
  const [localHour, setLocalHour] = useState<string>((saved?.local_hour as string) ?? "9");
  const [weekOfMonth, setWeekOfMonth] = useState<string>((saved?.week_of_month as string) ?? "1");
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = async () => {
    setIsSaving(true);
    try {
      const utcHour = localToUtc(Number(localHour));
      const effectiveFrequency = frequency;
      const effectiveAutoGenerate = isFreePlan ? false : autoGenerate;

      await saveStepData("step_scheduling", {
        auto_generate: effectiveAutoGenerate,
        frequency: effectiveFrequency,
        day_of_week: dayOfWeek,
        local_hour: localHour,
        week_of_month: weekOfMonth,
      });
      track("onboarding_scheduling", {
        auto_generate: effectiveAutoGenerate,
        frequency: effectiveFrequency,
        plan: userPlan,
      });

      if (siteId) {
        await supabase
          .from("sites")
          .update({
            auto_generate: effectiveAutoGenerate,
            publish_frequency: effectiveFrequency,
            publish_day_of_week: Number(dayOfWeek),
            publish_hour_utc: utcHour,
            publish_week_of_month: effectiveFrequency === "monthly" ? Number(weekOfMonth) : null,
          })
          .eq("id", siteId);
      }

      onNext();
    } catch (err) {
      console.error("Error in SchedulingStep:", err);
      toast.error("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Programación de artículos
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Configura cuándo y cómo se publican tus artículos. Podrás cambiarlo después.
        </p>
      </div>

      {/* Auto-publish */}
      <div className="space-y-3 p-3 sm:p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Publicación automática</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Cuando se genere un artículo, se publicará automáticamente en tu WordPress.
        </p>
        <div className="flex items-center justify-between">
          <label htmlFor="auto-generate" className="text-sm cursor-pointer">
            Publicar automáticamente
          </label>
          <Switch
            id="auto-generate"
            checked={isFreePlan ? false : autoGenerate}
            onCheckedChange={setAutoGenerate}
            disabled={isFreePlan}
          />
        </div>
        {isFreePlan && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            El plan Free no incluye publicación automática. Puedes activarla al pasar a Starter.
          </p>
        )}
      </div>

      {/* Frequency */}
      <div className="space-y-3 p-3 sm:p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Frecuencia de publicación</Label>
        </div>
        <p className="text-xs text-muted-foreground">¿Con qué frecuencia quieres publicar nuevos artículos?</p>
        <RadioGroup value={frequency} onValueChange={setFrequency} className="space-y-2">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="monthly" id="freq-monthly" />
            <label htmlFor="freq-monthly" className="text-sm cursor-pointer">
              Mensual <span className="text-muted-foreground text-xs">· 1 artículo/mes</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="biweekly" id="freq-biweekly" />
            <label htmlFor="freq-biweekly" className="text-sm cursor-pointer">
              Quincenal <span className="text-muted-foreground text-xs">· 2 artículos/mes</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="weekly" id="freq-weekly" />
            <label htmlFor="freq-weekly" className="text-sm cursor-pointer">
              Semanal <span className="text-muted-foreground text-xs">· 4 artículos/mes</span>
            </label>
          </div>
        </RadioGroup>
      </div>

      {/* Day, Week & Hour */}
      <div className="space-y-3 p-3 sm:p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Día y hora preferidos</Label>
        </div>
        <p className="text-xs text-muted-foreground">Elige cuándo prefieres que se publiquen tus artículos.</p>
        <div
          className={`grid gap-3 ${frequency === "monthly" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
        >
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Día de la semana</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className="h-12 sm:h-11 text-base sm:text-sm rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {frequency === "monthly" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Semana del mes</Label>
              <Select value={weekOfMonth} onValueChange={setWeekOfMonth}>
                <SelectTrigger className="h-12 sm:h-11 text-base sm:text-sm rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKS_OF_MONTH.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Hora (tu zona horaria)</Label>
            <Select value={localHour} onValueChange={setLocalHour}>
              <SelectTrigger className="h-12 sm:h-11 text-base sm:text-sm rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <OnboardingNavButtons onNext={handleNext} onBack={onBack} isSaving={isSaving} />
    </div>
  );
}
