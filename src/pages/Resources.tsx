import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema } from '@/components/seo';
import { 
  ArrowRight, 
  FileText, 
  Calendar, 
  CheckSquare, 
  BookOpen,
  Download,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const resourcesFAQs = [
  {
    question: '¿Los recursos son gratuitos?',
    answer: 'Sí, todos los recursos de esta página son gratuitos y accesibles para cualquier persona, sea o no usuario de Blooglee.',
  },
  {
    question: '¿Puedo usar las plantillas para mis clientes?',
    answer: 'Sí, puedes usar todas las plantillas y guías libremente, incluso para clientes de tu agencia. No requieren atribución.',
  },
  {
    question: '¿Cada cuánto actualizáis los recursos?',
    answer: 'Actualizamos los recursos regularmente para reflejar las últimas tendencias de SEO y content marketing. Suscríbete a la newsletter para recibir actualizaciones.',
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
    title: 'Plantilla de Calendario Editorial',
    description: 'Organiza tu estrategia de contenido con esta plantilla de calendario editorial. Incluye ejemplos de temas por mes y sector.',
    link: '/blog/contenido-regular-mejora-posicionamiento',
    type: 'Plantilla',
    readTime: '5 min lectura',
  },
  {
    icon: CheckSquare,
    title: 'Checklist de Publicación',
    description: 'Lista de verificación antes de publicar cualquier artículo: SEO on-page, formato, imágenes, enlaces internos y más.',
    link: '/blog/5-beneficios-automatizar-creacion-contenido',
    type: 'Checklist',
    readTime: '3 min lectura',
  },
  {
    icon: BookOpen,
    title: 'Guía de Conexión WordPress',
    description: 'Tutorial paso a paso para conectar tu WordPress con Blooglee usando Application Passwords. Con capturas de pantalla.',
    link: '/blog/guia-conectar-wordpress-blooglee',
    type: 'Tutorial',
    readTime: '5 min lectura',
  },
];

const blogPosts = [
  {
    title: '¿Qué es Blooglee? Guía completa',
    description: 'Todo sobre Blooglee: qué es, cómo funciona, precios y por qué empresas españolas lo eligen.',
    link: '/blog/que-es-blooglee',
    category: 'Producto',
  },
  {
    title: 'Blooglee vs Alternativas: Comparativa',
    description: 'Comparamos Blooglee con NextBlog, Jasper y Copy.ai. Precios, características y veredicto.',
    link: '/blog/blooglee-vs-alternativas-comparativa',
    category: 'Comparativa',
  },
  {
    title: 'AEO: El futuro del SEO con IA',
    description: 'Qué es Answer Engine Optimization y cómo preparar tu contenido para aparecer en ChatGPT y Perplexity.',
    link: '/blog/aeo-seo-optimizar-contenido-ia',
    category: 'Tendencias',
  },
  {
    title: 'Mejores herramientas IA para WordPress',
    description: 'Las 5 mejores herramientas de inteligencia artificial para crear contenido en WordPress en 2026.',
    link: '/blog/mejores-herramientas-contenido-ia-wordpress',
    category: 'Herramientas',
  },
];

export default function Resources() {
  return (
    <PublicLayout>
      <SEOHead 
        title="Centro de Recursos - Guías y Plantillas"
        description="Guías, plantillas y recursos gratuitos para content marketing y SEO. Calendario editorial, checklist de publicación, tutoriales y más."
        canonicalUrl="/recursos"
        keywords="recursos content marketing, guías SEO, plantillas blog, checklist publicación, calendario editorial"
      />
      <FAQSchema faqs={resourcesFAQs} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Recursos</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Centro de Recursos
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            Guías, plantillas y herramientas gratuitas para dominar el content marketing y SEO.
            <strong className="text-foreground"> Aprende de expertos y aplica estrategias probadas.</strong>
          </p>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">Guías y Plantillas</h2>
          <p className="text-foreground/60">Recursos prácticos para tu estrategia de contenido</p>
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
                <ExternalLink className="w-5 h-5 text-foreground/30 group-hover:text-violet-500 transition-colors flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Blog Posts */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">Artículos del Blog</h2>
          <p className="text-foreground/60">Aprende sobre SEO, IA y content marketing</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogPosts.map((post, i) => (
            <Link
              key={i}
              to={post.link}
              className="group p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 mb-3 inline-block">
                {post.category}
              </span>
              <h3 className="font-display text-lg font-bold mb-2 group-hover:text-violet-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-foreground/70 text-sm">{post.description}</p>
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

      {/* Newsletter Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-3xl border border-violet-200 p-8 sm:p-12 text-center">
          <Download className="w-12 h-12 text-violet-500 mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">Recibe recursos exclusivos</h2>
          <p className="text-foreground/70 mb-6 max-w-xl mx-auto">
            Suscríbete a nuestra newsletter y recibe guías exclusivas, plantillas y las últimas tendencias de content marketing directamente en tu email.
          </p>
          <Button asChild>
            <Link to="/contact">
              Suscribirse a la newsletter
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
    </PublicLayout>
  );
}
