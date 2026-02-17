import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema, ReviewSchema } from '@/components/seo';
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Megaphone,
  Users,
  Star,
  Briefcase,
  BarChart3,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadMagnetCard } from '@/components/marketing/LeadMagnetCard';
import { LeadMagnetModal } from '@/components/marketing/LeadMagnetModal';
import { useLeadMagnetDownload } from '@/hooks/useLeadMagnetDownload';
import { getLeadMagnetsForSector } from '@/data/leadMagnets';

const agenciasFAQs = [
  {
    question: '¿Puedo gestionar múltiples clientes con Blooglee?',
    answer: 'Sí, el plan Agencia permite gestionar hasta 10 sitios web desde un único dashboard. Cada sitio tiene su configuración independiente de sector, frecuencia y estilo de contenido.',
  },
  {
    question: '¿Blooglee ofrece white-label para agencias?',
    answer: 'Sí, el plan Agencia incluye opción white-label. El contenido no menciona a Blooglee y puedes presentarlo como producción propia a tus clientes.',
  },
  {
    question: '¿Cómo factura Blooglee a agencias?',
    answer: 'Emitimos facturas con IVA para empresas españolas. Para empresas de la UE con NIF intracomunitario válido, el IVA es 0%. Pago mensual o anual con 20% de descuento.',
  },
  {
    question: '¿Puedo generar contenido para diferentes sectores?',
    answer: 'Sí, cada sitio puede tener su propio sector configurado: salud, tecnología, retail, servicios, etc. La IA adapta el tono y vocabulario a cada industria.',
  },
  {
    question: '¿Qué ROI puedo esperar usando Blooglee?',
    answer: 'Nuestras agencias clientes ahorran un promedio de 40 horas/mes en producción de contenido, reduciendo costes operativos un 70% comparado con redactores freelance.',
  },
  {
    question: '¿Hay API para integraciones personalizadas?',
    answer: 'Sí, el plan Agencia incluye acceso a la API para automatizaciones avanzadas y integraciones con tus herramientas de gestión de proyectos.',
  },
];

const agenciaReviews = [
  {
    author: 'Laura Sánchez',
    role: 'Account Director',
    company: 'Agencia Momentum',
    rating: 5,
    reviewBody: 'Gestionamos 8 clientes con Blooglee. Hemos reducido los costes de producción de contenido un 70% y podemos aceptar más proyectos sin ampliar el equipo.',
    datePublished: '2026-01-15',
  },
  {
    author: 'Pablo Fernández',
    role: 'CEO',
    company: 'Digital Growth Agency',
    rating: 5,
    reviewBody: 'Blooglee nos permite escalar el servicio de content marketing sin sacrificar calidad. El white-label es perfecto para mantener nuestra marca.',
    datePublished: '2026-01-10',
  },
];

const stats = [
  { value: '-70%', label: 'Costes producción', description: 'Vs redactores' },
  { value: '40h', label: 'Ahorro mensual', description: 'Por agencia' },
  { value: '10', label: 'Sitios incluidos', description: 'Plan Agencia' },
];

const benefits = [
  {
    icon: Layers,
    title: 'Gestión multi-cliente',
    description: 'Dashboard centralizado para gestionar hasta 10 sitios con configuraciones independientes.',
  },
  {
    icon: Briefcase,
    title: 'White-label incluido',
    description: 'Presenta el contenido como producción propia. Sin menciones a Blooglee.',
  },
  {
    icon: BarChart3,
    title: 'Escalabilidad garantizada',
    description: 'Acepta más proyectos sin ampliar equipo ni aumentar costes operativos.',
  },
  {
    icon: Clock,
    title: 'Entregas puntuales',
    description: 'Nunca más retrasos en entregas. Genera contenido en segundos, cuando lo necesites.',
  },
];

export default function Agencias() {
  const { isModalOpen, selectedLeadMagnet, openDownloadModal, closeModal } = useLeadMagnetDownload();
  const sectorLeadMagnets = getLeadMagnetsForSector('agencias');

  return (
    <PublicLayout>
      <SEOHead 
        title="Blog Automático para Agencias de Marketing"
        description="Automatiza el blog de tus clientes con Blooglee. Gestiona múltiples webs WordPress desde un dashboard. Ideal para agencias de marketing digital."
        canonicalUrl="/para/agencias-marketing"
        keywords="contenido agencias marketing, automatizar blogs clientes, white-label blog, producción contenido agencias"
      />
      <FAQSchema faqs={agenciasFAQs} />
      <ReviewSchema reviews={agenciaReviews} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <Megaphone className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Para Agencias</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Escala tu producción de contenido
            </span>
            <br />
            <span className="text-foreground">sin ampliar el equipo</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            Gestiona el content marketing de todos tus clientes desde un solo dashboard. 
            <strong className="text-foreground"> White-label incluido, entregas siempre a tiempo.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90">
              <Link to="/auth">
                Probar gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">Ver plan Agencia</Link>
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

      {/* Benefits Grid */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Por qué las agencias eligen Blooglee
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg">
              <benefit.icon className="w-10 h-10 text-fuchsia-500 mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">{benefit.title}</h3>
              <p className="text-foreground/70">{benefit.description}</p>
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
                El cuello de botella del content marketing
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Los redactores freelance tienen límites de capacidad</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Contratar un equipo interno es costoso y lento</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Los clientes esperan entregas puntuales y consistentes</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-4 text-violet-600">
                Blooglee escala contigo
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Artículos ilimitados por 149€/mes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">10 sitios de clientes desde un dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Entregas en segundos, nunca más retrasos</span>
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
            Lo que dicen las agencias
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {agenciaReviews.map((review, i) => (
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
            Recursos gratuitos para agencias
          </h2>
          <p className="text-foreground/60">Descarga plantillas para escalar tu producción de contenido</p>
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
          {agenciasFAQs.map((faq, i) => (
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
              Escala tu agencia sin límites
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Plan Agencia: 10 sitios, artículos ilimitados, white-label incluido.
            </p>
            <Button asChild size="lg" className="bg-white text-violet-600 hover:bg-white/90">
              <Link to="/auth">
                Empezar ahora
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
