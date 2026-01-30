import { 
  Calendar, 
  Lightbulb, 
  CheckSquare, 
  FileText,
  Stethoscope,
  Briefcase,
  ShoppingCart,
  User
} from 'lucide-react';
import type { LeadMagnet } from '@/components/marketing/LeadMagnetCard';

// Generic lead magnets (available on /recursos)
export const genericLeadMagnets: LeadMagnet[] = [
  {
    id: 'calendario-general',
    title: 'Calendario Editorial 2026',
    description: 'Planifica todo tu año de contenidos con fechas clave, eventos estacionales y temas sugeridos por mes.',
    icon: Calendar,
    type: 'Calendario',
    sector: 'general',
    fileName: 'calendario-editorial-2026.pdf',
  },
  {
    id: 'ideas-general',
    title: '50 Ideas de Posts para tu Blog',
    description: 'Una lista curada de temas que funcionan para cualquier sector. Nunca más te quedarás sin inspiración.',
    icon: Lightbulb,
    type: 'PDF',
    sector: 'general',
    fileName: '50-ideas-posts-blog.pdf',
  },
  {
    id: 'checklist-seo',
    title: 'Checklist SEO On-Page',
    description: 'Los 25 puntos que debes revisar antes de publicar cualquier artículo. Maximiza tu posicionamiento.',
    icon: CheckSquare,
    type: 'Checklist',
    sector: 'general',
    fileName: 'checklist-seo-on-page.pdf',
  },
  {
    id: 'plantilla-tareas',
    title: 'Plantilla: Tareas para Redactar un Post',
    description: 'Todas las tareas necesarias para crear un artículo de calidad. Compara el tiempo manual vs Blooglee.',
    icon: FileText,
    type: 'Plantilla',
    sector: 'general',
    fileName: 'plantilla-tareas-redactar.pdf',
  },
];

// Sector-specific lead magnets
export const sectorLeadMagnets: Record<string, LeadMagnet[]> = {
  clinicas: [
    {
      id: 'calendario-clinicas',
      title: 'Calendario Editorial 2026 para Clínicas',
      description: 'Fechas clave del sector salud: días mundiales, temporadas de tratamientos y temas médicos por mes.',
      icon: Stethoscope,
      type: 'Calendario',
      sector: 'clinicas',
      fileName: 'calendario-editorial-clinicas-2026.pdf',
    },
    {
      id: 'ideas-clinicas',
      title: '50 Ideas de Posts para Clínicas',
      description: 'Temas probados: tratamientos estéticos, cuidados de la piel, salud dental, fisioterapia y más.',
      icon: Lightbulb,
      type: 'PDF',
      sector: 'clinicas',
      fileName: '50-ideas-posts-clinicas.pdf',
    },
  ],
  agencias: [
    {
      id: 'calendario-agencias',
      title: 'Calendario Editorial 2026 para Agencias',
      description: 'Planifica contenido para múltiples clientes. Incluye fechas comerciales y estrategias por temporada.',
      icon: Briefcase,
      type: 'Calendario',
      sector: 'agencias',
      fileName: 'calendario-editorial-agencias-2026.pdf',
    },
    {
      id: 'ideas-agencias',
      title: '50 Ideas de Posts para Agencias',
      description: 'Contenido que puedes adaptar para clientes de cualquier sector. Escala tu producción de contenidos.',
      icon: Lightbulb,
      type: 'PDF',
      sector: 'agencias',
      fileName: '50-ideas-posts-agencias.pdf',
    },
  ],
  ecommerce: [
    {
      id: 'calendario-ecommerce',
      title: 'Calendario Editorial 2026 para Ecommerce',
      description: 'Black Friday, rebajas, San Valentín... Todas las fechas comerciales para maximizar ventas.',
      icon: ShoppingCart,
      type: 'Calendario',
      sector: 'ecommerce',
      fileName: 'calendario-editorial-ecommerce-2026.pdf',
    },
    {
      id: 'ideas-ecommerce',
      title: '50 Ideas de Posts para Tiendas Online',
      description: 'Guías de compra, comparativas de productos, tendencias... Contenido que convierte visitantes en clientes.',
      icon: Lightbulb,
      type: 'PDF',
      sector: 'ecommerce',
      fileName: '50-ideas-posts-ecommerce.pdf',
    },
  ],
  autonomos: [
    {
      id: 'calendario-autonomos',
      title: 'Calendario Editorial 2026 para Autónomos',
      description: 'Fechas fiscales, eventos del sector y temas que posicionan tu marca personal.',
      icon: User,
      type: 'Calendario',
      sector: 'autonomos',
      fileName: 'calendario-editorial-autonomos-2026.pdf',
    },
    {
      id: 'ideas-autonomos',
      title: '50 Ideas de Posts para Autónomos',
      description: 'Contenido que muestra tu expertise: casos de éxito, tutoriales, consejos del sector.',
      icon: Lightbulb,
      type: 'PDF',
      sector: 'autonomos',
      fileName: '50-ideas-posts-autonomos.pdf',
    },
  ],
};

// Get lead magnets for a specific sector (includes generic ones)
export function getLeadMagnetsForSector(sector: string): LeadMagnet[] {
  const sectorMagnets = sectorLeadMagnets[sector] || [];
  // Return sector-specific first, then generic tools (checklist, plantilla)
  return [
    ...sectorMagnets,
    genericLeadMagnets.find(m => m.id === 'checklist-seo')!,
    genericLeadMagnets.find(m => m.id === 'plantilla-tareas')!,
  ].filter(Boolean);
}

// Get all lead magnets
export function getAllLeadMagnets(): LeadMagnet[] {
  return [
    ...genericLeadMagnets,
    ...Object.values(sectorLeadMagnets).flat(),
  ];
}
