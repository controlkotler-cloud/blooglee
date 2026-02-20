import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, LayoutGrid, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type ViewMode = 'cards' | 'table';
export type SortOption = 'name-asc' | 'name-desc' | 'activity' | 'articles' | 'wordpress';
export type FilterOption = 'all' | 'no-wp' | 'wp-connected' | 'no-articles';

interface FilterCount {
  noWp: number;
  wpConnected: number;
  noArticles: number;
}

interface SitesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterCounts: FilterCount;
  totalSites: number;
}

const FILTERS: { key: FilterOption; label: string; countKey?: keyof FilterCount }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'no-wp', label: 'Sin WordPress', countKey: 'noWp' },
  { key: 'wp-connected', label: 'WP Conectado', countKey: 'wpConnected' },
  { key: 'no-articles', label: 'Sin artículos', countKey: 'noArticles' },
];

export function SitesToolbar({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  filterCounts,
  totalSites,
}: SitesToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Row 1: Search (full-width on mobile) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sitio..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort + view toggle — hidden on mobile (view forced to cards) */}
        <div className="hidden sm:flex items-center gap-2 sm:ml-auto">
          <Select value={sortOption} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nombre A-Z</SelectItem>
              <SelectItem value="name-desc">Nombre Z-A</SelectItem>
              <SelectItem value="activity">Última actividad</SelectItem>
              <SelectItem value="articles">Artículos (más a menos)</SelectItem>
              <SelectItem value="wordpress">Estado WordPress</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => onViewModeChange('cards')}
              title="Vista cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => onViewModeChange('table')}
              title="Vista tabla"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile-only sort (no view toggle) */}
        <div className="sm:hidden">
          <Select value={sortOption} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-full h-10 text-sm">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nombre A-Z</SelectItem>
              <SelectItem value="name-desc">Nombre Z-A</SelectItem>
              <SelectItem value="activity">Última actividad</SelectItem>
              <SelectItem value="articles">Artículos (más a menos)</SelectItem>
              <SelectItem value="wordpress">Estado WordPress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Filter chips — horizontal scroll on mobile */}
      {totalSites > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
          {FILTERS.map(({ key, label, countKey }) => {
            const count = countKey ? filterCounts[countKey] : totalSites;
            const isActive = activeFilter === key;
            const isDisabled = key !== 'all' && count === 0;

            return (
              <button
                key={key}
                onClick={() => !isDisabled && onFilterChange(key)}
                disabled={isDisabled}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[36px]
                  ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDisabled
                      ? 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer'
                  }
                `}
              >
                {label}
                {key !== 'all' && (
                  <span className={`text-[10px] ${isActive ? 'opacity-80' : ''}`}>({count})</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
