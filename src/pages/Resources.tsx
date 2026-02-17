import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema } from '@/components/seo';
import { 
  ArrowRight, 
  FileText, 
  Calendar, 
  CheckSquare, 
  BookOpen,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadMagnetCard } from '@/components/marketing/LeadMagnetCard';
import { LeadMagnetModal } from '@/components/marketing/LeadMagnetModal';
import { useLeadMagnetDownload } from '@/hooks/useLeadMagnetDownload';
import { genericLeadMagnets } from '@/data/leadMagnets';

const resourcesFAQs = [
  {
    question: '¿Los recursos son gratuitos?',
    answer: 'Sí, todos los recursos de esta página son gratuitos. Solo te pedimos tu email para enviarte el recurso y mantenerte informado de novedades.',
  },
  {
    question: '¿Puedo usar las plantillas para mis clientes?',
    answer: 'Sí, puedes usar todas las plantillas y guías libremente, incluso para clientes de tu agencia. No requieren atribución.',
  },
  {
    question: '¿Cada cuánto actualizáis los recursos?',
    answer: 'Actualizamos los recursos regularmente para reflejar las últimas tendencias de SEO y content marketing. Los calendarios se actualizan cada año.',
  },
  {
    question: '¿Hay recursos específicos para mi sector?',
    answer: 'Sí, tenemos calendarios editoriales e ideas de posts específicos para clínicas, agencias, ecommerce y autónomos. Visita la página de tu sector para descargarlos.',
  },
];

const guides = [
  {
    icon: FileText,
    title: 'Guía SEO para WordPress 2026',
    description: 'Todo lo que necesitas saber para optimizar tu WordPress para buscadores: desde la configuración técnica hasta la creación de contenido.',
    link: '/blog/como-mejorar-seo-contenido-automatizado',
    type: 'Guía',
    readTime: '15 min lectura',
  },
  {
    icon: Calendar,
    title: 'Cómo crear un calendario editorial',
    description: 'Aprende a planificar tu estrategia de contenido mes a mes. Con ejemplos prácticos y plantillas.',
    link: '/blog/contenido-regular-mejora-posicionamiento',
    type: 'Artículo',
    readTime: '8 min lectura',
  },
  {
    icon: CheckSquare,
    title: 'Los beneficios de automatizar contenido',
    description: 'Descubre cómo la automatización puede multiplicar tu productividad sin sacrificar calidad.',
    link: '/blog/5-beneficios-automatizar-creacion-contenido',
    type: 'Artículo',
    readTime: '6 min lectura',
  },
  {
    icon: BookOpen,
    title: 'Guía de conexión WordPress',
    description: 'Tutorial paso a paso para conectar tu WordPress con Blooglee usando Application Passwords.',
    link: '/blog/guia-conectar-wordpress-blooglee',
    type: 'Tutorial',
    readTime: '5 min lectura',
  },
];

export default function Resources() {
  const { isModalOpen, selectedLeadMagnet, openDownloadModal, closeModal } = useLeadMagnetDownload();

  return (
    <PublicLayout>
      <SEOHead 
        title="Centro de Recursos - Guías, Plantillas y Descargables"
        description="Recursos gratuitos de Blooglee: guías de SEO, plantillas de marketing de contenidos y herramientas para automatizar tu blog WordPress."
        canonicalUrl="/recursos"
        keywords="recursos content marketing, calendario editorial 2026, checklist SEO, plantillas blog, guías marketing digital"
      />
      <FAQSchema faqs={resourcesFAQs} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Recursos Gratuitos</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Centro de Recursos
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            Plantillas, calendarios y herramientas gratuitas para dominar el content marketing.
            <strong className="text-foreground"> Descarga, aplica y crece.</strong>
          </p>
        </div>
      </section>

      {/* Lead Magnets Grid */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">Descargables Gratuitos</h2>
          <p className="text-foreground/60">Herramientas prácticas para tu estrategia de contenido</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {genericLeadMagnets.map((leadMagnet) => (
            <LeadMagnetCard
              key={leadMagnet.id}
              leadMagnet={leadMagnet}
              onDownloadClick={openDownloadModal}
            />
          ))}
        </div>
      </section>

      {/* Sector-specific callout */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="bg-gradient-to-r from-violet-50 via-fuchsia-50 to-orange-50 rounded-3xl border border-violet-200/50 p-8 sm:p-12">
          <div className="text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">¿Buscas recursos para tu sector?</h2>
            <p className="text-foreground/70 mb-8 max-w-xl mx-auto">
              Tenemos calendarios editoriales e ideas de posts específicos para cada industria.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline">
                <Link to="/para/clinicas">Para clínicas</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/para/agencias-marketing">Para agencias</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/para/tiendas-online">Para ecommerce</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/para/autonomos">Para autónomos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">Guías y Artículos</h2>
          <p className="text-foreground/60">Aprende sobre SEO, WordPress y content marketing</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {guides.map((guide, i) => (
            <Link
              key={i}
              to={guide.link}
              className="group p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                  <guide.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-violet-100 text-violet-700">
                      {guide.type}
                    </span>
                    <span className="text-xs text-foreground/50">{guide.readTime}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2 group-hover:text-violet-600 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-foreground/70 text-sm">{guide.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link to="/blog">
              Ver todos los artículos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Preguntas frecuentes</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {resourcesFAQs.map((faq, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg">
              <h3 className="font-medium mb-2">{faq.question}</h3>
              <p className="text-foreground/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12 pb-20">
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              ¿Listo para automatizar tu blog?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Prueba Blooglee gratis y genera tu primer artículo en menos de 5 minutos.
            </p>
            <Button asChild size="lg" className="bg-white text-violet-600 hover:bg-white/90">
              <Link to="/auth">
                Crear cuenta gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Lead Magnet Modal */}
      <LeadMagnetModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        leadMagnet={selectedLeadMagnet}
      />
    </PublicLayout>
  );
}
