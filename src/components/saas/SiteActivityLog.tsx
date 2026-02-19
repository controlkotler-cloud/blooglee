import { Loader2, Sparkles, Globe, Settings, AlertTriangle, Upload, FileText, History } from 'lucide-react';
import { useSiteActivityLog, type ActivityLogEntry } from '@/hooks/useSiteActivityLog';
import { cn } from '@/lib/utils';

interface SiteActivityLogProps {
  siteId: string;
  siteName: string;
}

function getActionIcon(actionType: string) {
  switch (actionType) {
    case 'article_generated': return <Sparkles className="w-4 h-4 text-primary" />;
    case 'article_published': return <Upload className="w-4 h-4 text-emerald-500" />;
    case 'wp_connected': return <Globe className="w-4 h-4 text-emerald-500" />;
    case 'wp_verified': return <Globe className="w-4 h-4 text-emerald-500" />;
    case 'wp_error': return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'wp_disconnected': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'settings_updated': return <Settings className="w-4 h-4 text-blue-500" />;
    default: return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
}

function getActionColor(actionType: string): string {
  switch (actionType) {
    case 'article_generated':
    case 'article_published':
    case 'wp_connected':
    case 'wp_verified':
      return 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30';
    case 'wp_error':
    case 'wp_disconnected':
      return 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30';
    default:
      return 'border-border bg-muted/30';
  }
}

function formatDateTime(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function SiteActivityLog({ siteId, siteName }: SiteActivityLogProps) {
  const { data: entries = [], isLoading } = useSiteActivityLog(siteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <History className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-medium mb-1">Sin actividad todavía</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Aquí aparecerá un registro de toda la actividad de <strong>{siteName}</strong>: artículos generados, publicaciones, cambios de configuración y más.
        </p>
      </div>
    );
  }

  // Group entries by date
  const grouped = entries.reduce<Record<string, ActivityLogEntry[]>>((acc, entry) => {
    const dateKey = new Date(entry.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dateLabel, dayEntries]) => (
        <div key={dateLabel}>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            {dateLabel}
          </h4>
          <div className="relative pl-6 space-y-3">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

            {dayEntries.map((entry) => {
              const { time } = formatDateTime(entry.created_at);
              const metadata = entry.metadata as Record<string, unknown>;
              const wpUrl = metadata?.wp_post_url as string | undefined;

              return (
                <div key={entry.id} className="relative flex gap-3">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-2.5 w-[9px] h-[9px] rounded-full border-2 border-background bg-border z-10" />

                  <div className={cn("flex-1 rounded-lg border p-3", getActionColor(entry.action_type))}>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{getActionIcon(entry.action_type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{entry.description}</p>
                        {wpUrl && (
                          <a
                            href={wpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-1 inline-block"
                          >
                            Ver en WordPress →
                          </a>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap flex-shrink-0">
                        {time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
