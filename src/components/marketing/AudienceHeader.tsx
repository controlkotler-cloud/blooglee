import { Link } from 'react-router-dom';
import { Building2, Users, ArrowLeft } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface AudienceHeaderProps {
  audience: 'empresas' | 'agencias';
}

const audienceConfig = {
  empresas: {
    badge: 'BLOG - EMPRESAS',
    title: 'Guías para empresas',
    description: 'Marketing digital, SEO, automatización y estrategias para hacer crecer tu negocio.',
    icon: Building2,
    gradient: 'from-violet-600 via-fuchsia-500 to-orange-400',
    badgeGradient: 'from-violet-500 to-violet-600',
    iconColor: 'text-violet-600',
    breadcrumbLabel: 'Empresas',
  },
  agencias: {
    badge: 'BLOG - AGENCIAS',
    title: 'Guías para agencias',
    description: 'Escalabilidad, gestión multi-cliente, workflows y herramientas para equipos.',
    icon: Users,
    gradient: 'from-fuchsia-600 via-violet-500 to-orange-400',
    badgeGradient: 'from-fuchsia-500 to-fuchsia-600',
    iconColor: 'text-fuchsia-600',
    breadcrumbLabel: 'Agencias',
  },
};

export function AudienceHeader({ audience }: AudienceHeaderProps) {
  const config = audienceConfig[audience];
  const Icon = config.icon;

  return (
    <div className="mb-8">
      {/* Top bar with badge and change link */}
      <div className="flex items-center justify-between mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${config.badgeGradient} text-white shadow-lg`}>
          <Icon className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-wide">{config.badge}</span>
        </div>
        
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cambiar perfil
        </Link>
      </div>

      {/* Main title and description */}
      <div className="mb-6">
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
          <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
            {config.title}
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-foreground/60 max-w-2xl">
          {config.description}
        </p>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Inicio</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/blog">Blog</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{config.breadcrumbLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
