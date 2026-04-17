import { AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PublishFrequency =
  | "monthly"
  | "biweekly"
  | "weekly"
  | "daily"
  | "daily_weekdays";

export type UserPlan = "free" | "starter" | "pro" | "agency";

interface FrequencyAdvisorProps {
  plan: UserPlan;
  frequency: PublishFrequency | string;
  /** ISO date string de cuándo se registró el dominio (RDAP). Null = no se pudo obtener. */
  domainRegisteredAt?: string | null;
  className?: string;
}

type Severity = "danger" | "warning" | "info" | "success";

interface Advice {
  severity: Severity;
  title: string;
  body: string;
  bullets?: string[];
}

function monthsSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  if (isNaN(then)) return Number.POSITIVE_INFINITY;
  const diffMs = Date.now() - then;
  return diffMs / (1000 * 60 * 60 * 24 * 30.44);
}

function buildAdvice(
  plan: UserPlan,
  frequency: string,
  domainRegisteredAt?: string | null,
): Advice | null {
  const isDaily = frequency === "daily" || frequency === "daily_weekdays";
  const isWeekly = frequency === "weekly";
  const ageMonths = domainRegisteredAt ? monthsSince(domainRegisteredAt) : null;

  // Free plan: ya hay mensaje en otro sitio, no duplicar
  if (plan === "free") return null;

  // Starter: su techo es weekly (4/mes), zona segura
  if (plan === "starter") {
    if (isWeekly) {
      return {
        severity: "success",
        title: "Frecuencia ideal para crecer en SEO",
        body:
          "4 artículos al mes es el ritmo recomendado para la mayoría de dominios. Google favorece la consistencia sobre el volumen.",
      };
    }
    return null;
  }

  // Pro / Agency con diario: análisis según edad del dominio
  if ((plan === "pro" || plan === "agency") && isDaily) {
    // Dominio muy joven → peligro alto
    if (ageMonths !== null && ageMonths < 6) {
      return {
        severity: "danger",
        title: "Publicar a diario con un dominio tan nuevo puede perjudicar tu SEO",
        body: `Tu dominio tiene ~${Math.floor(
          ageMonths,
        )} meses. Google penaliza la publicación masiva en dominios con poca autoridad (patrón típico de content farms). Recomendamos:`,
        bullets: [
          "1-2 artículos a la semana durante los primeros 6 meses",
          "Sube a 3-4/semana cuando empieces a ver tráfico orgánico estable",
          "Reserva el diario para cuando el dominio tenga más de 12 meses y backlinks",
        ],
      };
    }
    // Dominio medio → advertencia moderada
    if (ageMonths !== null && ageMonths < 12) {
      return {
        severity: "warning",
        title: "Frecuencia diaria: ve con cuidado",
        body: `Tu dominio tiene ~${Math.floor(
          ageMonths,
        )} meses. Puedes publicar diario, pero Google indexará mejor si mantienes 3-4/semana hasta cumplir el año con tráfico estable.`,
      };
    }
    // Dominio maduro o edad desconocida → aviso informativo
    return {
      severity: "info",
      title: "Asegúrate de que tu dominio tiene autoridad suficiente",
      body:
        "Publicar a diario funciona bien en dominios con más de 12 meses, tráfico orgánico establecido y algunos backlinks. Si no es tu caso, considera 3-4/semana.",
      bullets: [
        "Dominios nuevos: 1-2/semana",
        "Dominios de 6-12 meses: 3-4/semana",
        "Dominios maduros con tráfico: diario sin problema",
      ],
    };
  }

  // Pro / Agency con weekly o biweekly: confirmación positiva suave
  if ((plan === "pro" || plan === "agency") && (isWeekly || frequency === "biweekly")) {
    return {
      severity: "success",
      title: "Frecuencia equilibrada",
      body:
        "Buena elección para crecer orgánicamente sin disparar señales de content farm. Podrás subir la frecuencia cuando tu dominio gane autoridad.",
    };
  }

  return null;
}

const severityStyles: Record<
  Severity,
  { container: string; icon: LucideIcon; iconColor: string }
> = {
  danger: {
    container:
      "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    container:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    container:
      "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
    icon: Info,
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  success: {
    container:
      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
};

export function FrequencyAdvisor({
  plan,
  frequency,
  domainRegisteredAt,
  className,
}: FrequencyAdvisorProps) {
  const advice = buildAdvice(plan as UserPlan, frequency, domainRegisteredAt);
  if (!advice) return null;

  const { container, icon: Icon, iconColor } = severityStyles[advice.severity];

  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-sm",
        container,
        className,
      )}
      role="status"
    >
      <div className="flex gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", iconColor)} aria-hidden="true" />
        <div className="space-y-2 flex-1">
          <p className="font-semibold leading-tight">{advice.title}</p>
          <p className="leading-relaxed opacity-90">{advice.body}</p>
          {advice.bullets && advice.bullets.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 opacity-90">
              {advice.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
