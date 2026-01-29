import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema, ReviewSchema } from '@/components/seo';
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  User,
  Users,
  Star,
  Wallet,
  Target,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const autonomosFAQs = [
  {
    question: '¿Blooglee es asequible para un autónomo?',
    answer: 'Sí, el plan Free es gratuito y el Starter cuesta solo 19€/mes (4 artículos). Es 10 veces más barato que contratar un redactor freelance para la misma cantidad de contenido.',
  },
  {
    question: '¿Necesito conocimientos técnicos para usar Blooglee?',
    answer: 'No. Blooglee está diseñado para ser muy fácil de usar. Si sabes publicar en WordPress, sabes usar Blooglee. El proceso es: conectas tu web, generas artículo, y publicas con un clic.',
  },
  {
    question: '¿Puedo gestionar el blog de mi negocio sin dedicar horas?',
    answer: 'Sí, ese es exactamente el objetivo. Blooglee genera un artículo completo en 60 segundos. Puedes revisar y publicar en menos de 5 minutos a la semana.',
  },
  {
    question: '¿El contenido es relevante para mi sector?',
    answer: 'Sí. Configuras el sector de tu negocio (abogado, arquitecto, consultor, terapeuta, etc.) y Blooglee adapta el vocabulario, tono y temas a tu industria.',
  },
  {
    question: '¿Cómo ayuda el blog a conseguir clientes?',
    answer: 'Un blog activo mejora tu posicionamiento en Google para búsquedas locales. Cuando alguien busca "abogado divorcios Madrid", un blog con artículos relevantes te hace visible.',
  },
];

const autonomoReviews = [
  {
    author: 'José Manuel Torres',
    role: 'Abogado',
    company: 'Despacho Torres',
    rating: 5,
    reviewBody: 'Como abogado autónomo, no tenía tiempo ni presupuesto para un blog. Blooglee me permite publicar artículos legales cada semana por menos de lo que cuesta un café al día.',
    datePublished: '2026-01-15',
  },
  {
    author: 'Lucía Hernández',
    role: 'Psicóloga',
    company: 'Consulta Lucía Hernández',
    rating: 5,
    reviewBody: 'El blog ha sido clave para darme a conocer. Pacientes me encuentran buscando temas como "ansiedad laboral" y llegan a mi consulta desde el blog.',
    datePublished: '2026-01-10',
  },
];

const stats = [
  { value: '19€', label: 'Por mes', description: 'Plan Starter' },
  { value: '5min', label: 'A la semana', description: 'Tiempo invertido' },
  { value: '+60%', label: 'Visibilidad local', description: 'En 3 meses' },
];

const benefits = [
  {
    icon: Wallet,
    title: 'Precio de autónomo',
    description: 'Desde 0€/mes. El plan Starter (19€) cuesta menos que 4 cafés y genera 4 artículos profesionales.',
  },
  {
    icon: Clock,
    title: 'Sin perder tiempo',
    description: '5 minutos a la semana: generas, revisas y publicas. Dedica tu tiempo a lo que importa: tus clientes.',
  },
  {
    icon: Target,
    title: 'Visibilidad local',
    description: 'Aparece en búsquedas locales de tu ciudad. "Arquitecto Barcelona", "Fisio Madrid" - posiciona tu negocio.',
  },
  {
    icon: Briefcase,
    title: 'Imagen profesional',
    description: 'Un blog activo transmite expertise y genera confianza. Compite con empresas grandes desde tu casa.',
  },
];

const sectors = [
  'Abogados', 'Arquitectos', 'Psicólogos', 'Nutricionistas', 'Consultores',
  'Fisioterapeutas', 'Contables', 'Diseñadores', 'Coaches', 'Fotógrafos'
];

export default function Autonomos() {
  return (
    <PublicLayout>
      <SEOHead 
        title="Blog Profesional para Autónomos"
        description="Crea un blog profesional para tu negocio sin dedicar horas. Desde 19€/mes, genera contenido que atrae clientes y mejora tu visibilidad local."
        canonicalUrl="/para/autonomos"
        keywords="blog autónomo, marketing autónomos, SEO freelance, visibilidad negocio local"
      />
      <FAQSchema faqs={autonomosFAQs} />
      <ReviewSchema reviews={autonomoReviews} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <User className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Para Autónomos</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Un blog profesional
            </span>
            <br />
            <span className="text-foreground">sin dedicar horas</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            Como autónomo, tu tiempo vale oro. 
            <strong className="text-foreground"> Blooglee genera contenido profesional por menos de lo que cuesta un café al día.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90">
              <Link to="/auth">
                Empezar gratis
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

      {/* Benefits */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Diseñado para profesionales como tú
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

      {/* Sectors */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl p-8 sm:p-12 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-6">
            Autónomos de todos los sectores
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {sectors.map((sector, i) => (
              <span key={i} className="px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
                {sector}
              </span>
            ))}
          </div>
          <p className="mt-6 text-foreground/70">
            Y muchos más. Blooglee se adapta a cualquier profesión.
          </p>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl p-8 sm:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                El problema del autónomo
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">No tienes tiempo para escribir artículos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Contratar un redactor no cabe en tu presupuesto</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Tu web está estancada y no apareces en Google</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-4 text-violet-600">
                Blooglee: tu solución
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">5 minutos a la semana, no horas</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Desde 19€/mes - menos que 4 cafés</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Posiciona tu negocio en búsquedas locales</span>
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
            Autónomos que ya confían en Blooglee
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {autonomoReviews.map((review, i) => (
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

      {/* FAQ Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Preguntas frecuentes
          </h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {autonomosFAQs.map((faq, i) => (
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
              Tu negocio merece un blog profesional
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Empieza gratis. Sin tarjeta de crédito.
            </p>
            <Button asChild size="lg" className="bg-white text-violet-600 hover:bg-white/90">
              <Link to="/auth">
                Crear mi blog ahora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
