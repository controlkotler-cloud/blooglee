import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sparkles,
  FileText,
  Settings,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpDown,
} from 'lucide-react';
import type { Site } from '@/hooks/useSites';
import type { WordPressConfig } from '@/hooks/useWordPressConfigSaas';

interface SiteRowData {
  site: Site;
  articleCount: number;
  wpConfig: WordPressConfig | null;
  lastArticleDate: string | null;
  needsAttention: boolean;
}

interface SitesTableViewProps {
  sites: SiteRowData[];
  onGenerateArticle: (siteId: string) => void;
  onViewArticles: (siteId: string) => void;
  onEditSite: (siteId: string) => void;
  isGenerating: (siteId: string) => boolean;
}

type SortKey = 'name' | 'sector' | 'location' | 'wordpress' | 'articles' | 'lastArticle';
type SortDir = 'asc' | 'desc';

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 14) return 'Hace 1 semana';
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 60) return 'Hace 1 mes';
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

function isDateOld(dateStr: string | null): boolean {
  if (!dateStr) return true;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return diffMs > 14 * 24 * 60 * 60 * 1000; // 2 weeks
}

export function SitesTableView({
  sites,
  onGenerateArticle,
  onViewArticles,
  onEditSite,
  isGenerating,
}: SitesTableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...sites].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'name':
        return a.site.name.localeCompare(b.site.name) * dir;
      case 'sector':
        return (a.site.sector || '').localeCompare(b.site.sector || '') * dir;
      case 'location':
        return (a.site.location || '').localeCompare(b.site.location || '') * dir;
      case 'wordpress':
        return ((a.wpConfig ? 0 : 1) - (b.wpConfig ? 0 : 1)) * dir;
      case 'articles':
        return (a.articleCount - b.articleCount) * dir;
      case 'lastArticle': {
        const dateA = a.lastArticleDate ? new Date(a.lastArticleDate).getTime() : 0;
        const dateB = b.lastArticleDate ? new Date(b.lastArticleDate).getTime() : 0;
        return (dateA - dateB) * dir;
      }
      default:
        return 0;
    }
  });

  const SortHeader = ({ label, column, className }: { label: string; column: SortKey; className?: string }) => (
    <TableHead
      className={`cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground ${className || ''}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      </div>
    </TableHead>
  );

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortHeader label="Nombre" column="name" />
              <SortHeader label="Sector" column="sector" className="hidden md:table-cell" />
              <SortHeader label="Ubicación" column="location" className="hidden md:table-cell" />
              <SortHeader label="WordPress" column="wordpress" />
              <SortHeader label="Artículos" column="articles" />
              <SortHeader label="Último artículo" column="lastArticle" />
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(({ site, articleCount, wpConfig, lastArticleDate, needsAttention }) => (
              <TableRow
                key={site.id}
                className={needsAttention ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''}
              >
                {/* Name */}
                <TableCell>
                  <button
                    className="font-semibold text-sm hover:text-primary transition-colors text-left"
                    onClick={() => onViewArticles(site.id)}
                  >
                    {site.name}
                  </button>
                </TableCell>

                {/* Sector */}
                <TableCell className="hidden md:table-cell">
                  {site.sector ? (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {site.sector.replace(/_/g, ' ')}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Location */}
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm">{site.location || '—'}</span>
                </TableCell>

                {/* WordPress */}
                <TableCell>
                  {wpConfig ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </TooltipTrigger>
                      <TooltipContent>WP conectado a {wpConfig.site_url}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>Configura WordPress</TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>

                {/* Articles */}
                <TableCell>
                  <span className={`text-sm font-medium ${articleCount === 0 ? 'text-destructive' : ''}`}>
                    {articleCount}
                  </span>
                </TableCell>

                {/* Last article */}
                <TableCell>
                  <span className={`text-sm ${isDateOld(lastArticleDate) ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {formatRelativeDate(lastArticleDate)}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onGenerateArticle(site.id)}
                          disabled={!wpConfig || isGenerating(site.id)}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Generar artículo</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onViewArticles(site.id)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver artículos</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEditSite(site.id)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Configuración</TooltipContent>
                    </Tooltip>

                    {wpConfig && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(wpConfig.site_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ir al WordPress</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
