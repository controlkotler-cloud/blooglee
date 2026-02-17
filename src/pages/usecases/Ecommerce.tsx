import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema, ReviewSchema } from '@/components/seo';
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  ShoppingCart,
  Users,
  Star,
  Package,
  Search,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadMagnetCard } from '@/components/marketing/LeadMagnetCard';
import { LeadMagnetModal } from '@/components/marketing/LeadMagnetModal';
import { useLeadMagnetDownload } from '@/hooks/useLeadMagnetDownload';
import { getLeadMagnetsForSector } from '@/data/leadMagnets';

const ecommerceFAQs = [
  {
    question: '¿Blooglee funciona con WooCommerce?',
    answer: 'Sí, Blooglee es 100% compatible con WooCommerce. Publica artículos en el blog de tu tienda online para atraer tráfico orgánico y convertir visitantes en clientes.',
  },
  {
    question: '¿Qué tipo de contenido genera para e-commerce?',
    answer: 'Blooglee genera guías de compra, comparativas de productos, tendencias del sector, tutoriales de uso y contenido de temporada (Black Friday, Navidad, rebajas).',
  },
  {
    question: '¿El contenido menciona mis productos?',
    answer: 'Puedes configurar temas personalizados que incluyan categorías de productos de tu tienda. Blooglee adaptará el contenido para ser relevante para tu catálogo.',
  },
  {
    question: '¿Cómo ayuda el blog a vender más?',
    answer: 'Un blog con contenido SEO optimizado atrae tráfico orgánico cualificado. Usuarios que buscan "mejores auriculares bluetooth" llegan a tu guía y descubren tus productos.',
  },
  {
    question: '¿Puedo generar contenido de temporada automáticamente?',
    answer: 'Sí, Blooglee detecta eventos comerciales (Black Friday, Navidad, San Valentín) y sugiere temas relevantes para maximizar el tráfico en fechas clave.',
  },
];

const ecommerceReviews = [
  {
    author: 'Elena Martín',
    role: 'CEO',
    company: 'TechGadgets.es',
    rating: 5,
    reviewBody: 'Nuestro blog pasó de 0 a 50 artículos en 6 meses. El tráfico orgánico creció un 280% y las ventas desde el blog representan ya el 15% del total.',
    datePublished: '2026-01-15',
  },
  {
    author: 'David López',
    role: 'Fundador',
    company: 'Deportes Plus Online',
    rating: 5,
    reviewBody: 'Las guías de compra que genera Blooglee posicionan muy bien. Ahora aparecemos en búsquedas como "mejores zapatillas running" y convertimos ese tráfico en ventas.',
    datePublished: '2026-01-10',
  },
];

const stats = [
  { value: '+280%', label: 'Tráfico orgánico', description: 'En 6 meses' },
  { value: '15%', label: 'Ventas desde blog', description: 'Conversión media' },
  { value: '+50', label: 'Artículos SEO', description: 'Posicionados' },
];

const contentTypes = [
  {
    icon: Search,
    title: 'Guías de compra',
    description: '"Mejores portátiles para estudiantes 2026" - Contenido que captura búsquedas de intención comercial.',
  },
  {
    icon: Package,
    title: 'Comparativas de productos',
    description: '"iPhone 16 vs Samsung S26" - Artículos que ayudan a decidir y convierten.',
  },
  {
    icon: TrendingUp,
    title: 'Tendencias y novedades',
    description: 'Contenido sobre nuevos productos y tendencias del sector para posicionar como experto.',
  },
  {
    icon: DollarSign,
    title: 'Contenido de temporada',
    description: 'Black Friday, Navidad, rebajas - Genera tráfico extra en fechas comerciales clave.',
  },
];

export default function Ecommerce() {
  const { isModalOpen, selectedLeadMagnet, openDownloadModal, closeModal } = useLeadMagnetDownload();
  const sectorLeadMagnets = getLeadMagnetsForSector('ecommerce');

  return (
    <PublicLayout>
      <SEOHead 
        title="Blog Automático para Tiendas Online"
        description="Blog automático para ecommerce. Genera artículos de producto con IA y atrae tráfico orgánico a tu tienda online WordPress."
        canonicalUrl="/para/tiendas-online"
        keywords="blog ecommerce, contenido tienda online, SEO WooCommerce, marketing contenidos ecommerce"
      />
      <FAQSchema faqs={ecommerceFAQs} />
      <ReviewSchema reviews={ecommerceReviews} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <ShoppingCart className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Para E-commerce</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Tu tienda online necesita un blog
            </span>
            <br />
            <span className="text-foreground">que venda</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            El 68% de las compras online empiezan con una búsqueda en Google. 
            <strong className="text-foreground"> Blooglee genera contenido que atrae compradores a tu tienda.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90">
              <Link to="/auth">
                Probar gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">Ver precios</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg">
                <div className="font-display text-3xl font-bold text-violet-600 mb-1">{stat.value}</div>
                <div className="font-medium text-foreground">{stat.label}</div>
                <div className="text-sm text-foreground/60">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Types */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Contenido que convierte visitantes en compradores
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contentTypes.map((type, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg">
              <type.icon className="w-10 h-10 text-fuchsia-500 mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">{type.title}</h3>
              <p className="text-foreground/70">{type.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl p-8 sm:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                El problema del e-commerce
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Dependes de Google Ads para conseguir tráfico</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Los competidores posicionan mejor en orgánico</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">El coste por clic sube cada año</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-4 text-violet-600">
                Blooglee reduce tu dependencia de ads
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Tráfico orgánico gratuito y sostenible</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Guías de compra que convierten visitantes en clientes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Compatible con WooCommerce, Shopify, Prestashop</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Tiendas online que ya usan Blooglee
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {ecommerceReviews.map((review, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-foreground/80 mb-4 italic">"{review.reviewBody}"</p>
              <div>
                <div className="font-medium">{review.author}</div>
                <div className="text-sm text-foreground/60">{review.role}, {review.company}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lead Magnets Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Recursos gratuitos para e-commerce
          </h2>
          <p className="text-foreground/60">Descarga calendarios y guías para vender más con tu blog</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {sectorLeadMagnets.map((leadMagnet) => (
            <LeadMagnetCard
              key={leadMagnet.id}
              leadMagnet={leadMagnet}
              onDownloadClick={openDownloadModal}
            />
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Preguntas frecuentes
          </h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {ecommerceFAQs.map((faq, i) => (
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
              Vende más con contenido SEO
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Prueba Blooglee gratis y genera tu primera guía de compra.
            </p>
            <Button asChild size="lg" className="bg-white text-violet-600 hover:bg-white/90">
              <Link to="/auth">
                Empezar gratis
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
