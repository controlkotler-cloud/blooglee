import { LucideIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type LeadMagnetType = 'PDF' | 'Checklist' | 'Plantilla' | 'Calendario';
export type LeadMagnetSector = 'clinicas' | 'agencias' | 'ecommerce' | 'autonomos' | 'general';

export interface LeadMagnet {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  type: LeadMagnetType;
  sector: LeadMagnetSector;
  fileName: string;
}

interface LeadMagnetCardProps {
  leadMagnet: LeadMagnet;
  onDownloadClick: (leadMagnet: LeadMagnet) => void;
}

const typeColors: Record<LeadMagnetType, string> = {
  'PDF': 'bg-violet-100 text-violet-700',
  'Checklist': 'bg-emerald-100 text-emerald-700',
  'Plantilla': 'bg-fuchsia-100 text-fuchsia-700',
  'Calendario': 'bg-orange-100 text-orange-700',
};

export const LeadMagnetCard = ({ leadMagnet, onDownloadClick }: LeadMagnetCardProps) => {
  const { title, description, icon: Icon, type } = leadMagnet;

  return (
    <div className="group p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[type]}`}>
              {type}
            </span>
          </div>
          <h3 className="font-display text-lg font-bold mb-2 group-hover:text-violet-600 transition-colors">
            {title}
          </h3>
          <p className="text-foreground/70 text-sm mb-4">{description}</p>
          <Button 
            onClick={() => onDownloadClick(leadMagnet)}
            variant="outline"
            size="sm"
            className="group-hover:bg-violet-50 group-hover:border-violet-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar gratis
          </Button>
        </div>
      </div>
    </div>
  );
};
