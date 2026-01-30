import { Link } from 'react-router-dom';
import { Building2, Users, ArrowRight } from 'lucide-react';

interface AudienceCardsProps {
  counts?: { empresas?: number; agencias?: number };
}

export function AudienceCards({ counts }: AudienceCardsProps) {
  const cards = [
    {
      id: 'empresas',
      title: 'Para empresas',
      icon: Building2,
      description: 'Marketing digital, SEO, automatización y estrategias para hacer crecer tu negocio.',
      gradient: 'from-violet-500 to-violet-600',
      bgGradient: 'from-violet-50 to-fuchsia-50',
      borderColor: 'border-violet-200',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      count: counts?.empresas || 0,
    },
    {
      id: 'agencias',
      title: 'Para agencias',
      icon: Users,
      description: 'Escalabilidad, gestión multi-cliente, workflows y herramientas para equipos.',
      gradient: 'from-fuchsia-500 to-fuchsia-600',
      bgGradient: 'from-fuchsia-50 to-orange-50',
      borderColor: 'border-fuchsia-200',
      iconBg: 'bg-fuchsia-100',
      iconColor: 'text-fuchsia-600',
      count: counts?.agencias || 0,
    },
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              to={`/blog?audiencia=${card.id}`}
              className={`
                relative p-6 sm:p-8 rounded-2xl border-2 text-left transition-all duration-300
                bg-gradient-to-br ${card.bgGradient} ${card.borderColor}
                hover:shadow-xl hover:scale-[1.02] hover:border-opacity-100
                group cursor-pointer block
              `}
            >
              {/* Icon */}
              <div className={`
                w-14 h-14 rounded-xl ${card.iconBg} ${card.iconColor}
                flex items-center justify-center mb-4
                group-hover:scale-110 transition-transform
              `}>
                <Icon className="w-7 h-7" />
              </div>

              {/* Title */}
              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-foreground/60 text-sm sm:text-base mb-4 line-clamp-2">
                {card.description}
              </p>

              {/* CTA */}
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className={`bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                  Ver artículos
                </span>
                {card.count > 0 && (
                  <span className="text-foreground/40">({card.count})</span>
                )}
                <ArrowRight className={`w-4 h-4 ${card.iconColor} group-hover:translate-x-1 transition-transform`} />
              </div>

              {/* Decorative gradient blob */}
              <div className={`
                absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20
                bg-gradient-to-br ${card.gradient} blur-2xl
                group-hover:opacity-30 transition-opacity
              `} />
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-foreground/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gradient-to-r from-violet-50 via-background to-violet-50 px-4 text-sm text-foreground/50">
            O explora todo el contenido
          </span>
        </div>
      </div>
    </div>
  );
}
