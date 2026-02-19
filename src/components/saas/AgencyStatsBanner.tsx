import { Globe, Link2, AlertTriangle, FileText } from 'lucide-react';
import type { FilterOption } from './SitesToolbar';

interface AgencyStatsBannerProps {
  totalSites: number;
  wpConnected: number;
  wpDisconnected: number;
  articlesThisMonth: number;
  sitesNeedingAttention: number;
  onFilterClick: (filter: FilterOption) => void;
}

export function AgencyStatsBanner({
  totalSites,
  wpConnected,
  wpDisconnected,
  articlesThisMonth,
  sitesNeedingAttention,
  onFilterClick,
}: AgencyStatsBannerProps) {
  if (totalSites <= 3) return null;

  const stats = [
    {
      icon: Globe,
      label: 'sitios totales',
      value: totalSites,
      color: 'text-primary',
    },
    {
      icon: Link2,
      label: 'con WordPress',
      value: wpConnected,
      color: 'text-emerald-600',
      filter: 'wp-connected' as FilterOption,
    },
    {
      icon: Link2,
      label: 'sin WordPress',
      value: wpDisconnected,
      color: 'text-amber-600',
      filter: 'no-wp' as FilterOption,
      highlight: wpDisconnected > 0,
    },
    {
      icon: FileText,
      label: 'artículos este mes',
      value: articlesThisMonth,
      color: 'text-blue-600',
    },
    {
      icon: AlertTriangle,
      label: 'necesitan atención',
      value: sitesNeedingAttention,
      color: 'text-orange-600',
      highlight: sitesNeedingAttention > 0,
    },
  ];

  return (
    <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-muted/50 border text-sm">
      {stats.map((stat) => {
        const isClickable = !!stat.filter;
        const Wrapper = isClickable ? 'button' : 'div';
        return (
          <Wrapper
            key={stat.label}
            className={`flex items-center gap-1.5 ${isClickable ? 'hover:underline cursor-pointer' : ''} ${stat.highlight ? 'font-medium' : ''}`}
            onClick={isClickable ? () => onFilterClick(stat.filter!) : undefined}
          >
            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            <span className="font-semibold">{stat.value}</span>
            <span className="text-muted-foreground">{stat.label}</span>
          </Wrapper>
        );
      })}
    </div>
  );
}
