import { Building2, Users, BookOpen } from 'lucide-react';

interface AudienceTabsProps {
  selected: string;
  onSelect: (audience: string) => void;
  counts?: { empresas?: number; agencias?: number };
}

export function AudienceTabs({ selected, onSelect, counts }: AudienceTabsProps) {
  const tabs = [
    { 
      id: 'todos', 
      label: 'Todos', 
      icon: BookOpen, 
      count: (counts?.empresas || 0) + (counts?.agencias || 0),
      gradient: 'from-violet-500 to-fuchsia-500'
    },
    { 
      id: 'empresas', 
      label: 'Para Empresas', 
      mobileLabel: 'Empresas',
      icon: Building2, 
      count: counts?.empresas || 0,
      gradient: 'from-violet-500 to-violet-600'
    },
    { 
      id: 'agencias', 
      label: 'Para Agencias', 
      mobileLabel: 'Agencias',
      icon: Users, 
      count: counts?.agencias || 0,
      gradient: 'from-fuchsia-500 to-fuchsia-600'
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isSelected = selected === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
              whitespace-nowrap transition-all duration-200 min-w-fit
              ${isSelected 
                ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg shadow-violet-500/25` 
                : 'bg-white/70 text-foreground/70 hover:bg-white hover:text-foreground border border-white/50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.mobileLabel || tab.label}</span>
            {tab.count > 0 && (
              <span className={`
                px-1.5 py-0.5 rounded-full text-xs
                ${isSelected ? 'bg-white/20' : 'bg-foreground/10'}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
