import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema, ReviewSchema } from '@/components/seo';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Heart,
  Stethoscope,
  Users,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadMagnetCard } from '@/components/marketing/LeadMagnetCard';
import { LeadMagnetModal } from '@/components/marketing/LeadMagnetModal';
import { useLeadMagnetDownload } from '@/hooks/useLeadMagnetDownload';
import { getLeadMagnetsForSector } from '@/data/leadMagnets';

const clinicasFAQs = [
  {
    question: '¿Blooglee es adecuado para clínicas de medicina estética?',
    answer: 'Sí, Blooglee está especialmente optimizado para clínicas de medicina estética, dermatología, odontología y salud en general. Genera contenido sobre tratamientos, cuidados y novedades del sector salud.',
  },
  {
    question: '¿El contenido médico generado es fiable?',
    answer: 'Blooglee genera contenido informativo general sobre salud y bienestar. Para información médica específica, siempre recomendamos que un profesional de la salud revise el contenido antes de publicar.',
  },
  {
    question: '¿Puedo generar artículos sobre tratamientos específicos?',
    answer: 'Sí, puedes configurar temas personalizados sobre los tratamientos que ofrece tu clínica: botox, ácido hialurónico, depilación láser, implantes dentales, etc.',
  },
  {
    question: '¿Blooglee ayuda a atraer pacientes locales?',
    answer: 'Sí, el contenido generado está optimizado para SEO local. Puedes configurar tu ubicación para que los artículos mencionen tu ciudad y atraigan pacientes de tu zona.',
  },
  {
    question: '¿Cuántos artículos necesita una clínica al mes?',
    answer: 'Recomendamos entre 4-8 artículos mensuales para clínicas. El plan Starter (4 artículos) es perfecto para empezar, y el Pro (30 artículos) para clínicas con múltiples especialidades.',
  },
];

const clinicaReviews = [
  {
    author: 'Dra. María García',
    role: 'Directora Médica',
    company: 'Clínica Estética Luna',
    rating: 5,
    reviewBody: 'Blooglee ha transformado nuestra presencia digital. Pasamos de 0 a 45 artículos en 6 meses y nuestro tráfico orgánico creció un 340%. Ahora recibimos consultas directas desde el blog.',
    datePublished: '2026-01-15',
  },
  {
    author: 'Dr. Carlos Ruiz',
    role: 'Director',
    company: 'Centro Dermatológico Ruiz',
    rating: 5,
    reviewBody: 'Como dermatólogo, no tenía tiempo para escribir artículos. Blooglee genera contenido de calidad sobre cuidados de la piel que mis pacientes valoran mucho.',
    datePublished: '2026-01-10',
  },
];

const stats = [
  { value: '+340%', label: 'Tráfico orgánico', description: 'En 6 meses' },
  { value: '+45', label: 'Artículos publicados', description: 'Sin esfuerzo' },
  { value: '15h', label: 'Ahorro mensual', description: 'En redacción' },
];

const useCases = [
  {
    title: 'Clínicas de Medicina Estética',
    description: 'Genera contenido sobre tratamientos faciales, corporales, cuidados post-tratamiento y novedades en estética.',
    results: 'Clínica Luna: +340% tráfico orgánico',
  },
  {
    title: 'Clínicas Dentales',
    description: 'Artículos sobre higiene bucal, implantes, ortodoncia y prevención de caries para atraer pacientes.',
    results: 'Centro Dental Plus: +15 pacientes/mes desde el blog',
  },
  {
    title: 'Centros de Fisioterapia',
    description: 'Contenido sobre lesiones deportivas, rehabilitación, ejercicios preventivos y bienestar.',
    results: 'Fisio Barcelona: +200% visibilidad local',
  },
];

export default function Clinicas() {
  const { isModalOpen, selectedLeadMagnet, openDownloadModal, closeModal } = useLeadMagnetDownload();
  const sectorLeadMagnets = getLeadMagnetsForSector('clinicas');

  return (
    <PublicLayout>
      <SEOHead 
        title="Blog Automático para Clínicas"
        description="Genera artículos de blog para tu clínica médica o estética con IA. Atrae pacientes con contenido SEO optimizado. Resultados: +340% tráfico orgánico."
        canonicalUrl="/para/clinicas"
        keywords="blog clínica, contenido clínica estética, marketing clínicas, SEO clínicas médicas, atraer pacientes"
      />
      <FAQSchema faqs={clinicasFAQs} />
      <ReviewSchema reviews={clinicaReviews} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <Stethoscope className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Para Clínicas</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Tu clínica necesita un blog
            </span>
            <br />
            <span className="text-foreground">que atraiga pacientes</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            El 77% de los pacientes investigan online antes de elegir una clínica. 
            <strong className="text-foreground"> Blooglee genera contenido que posiciona tu clínica en Google.</strong>
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

      {/* Problem Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl p-8 sm:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                El problema de las clínicas
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">No hay tiempo para escribir artículos entre consultas</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Contratar un redactor de salud es caro (500€+/mes)</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">La competencia posiciona mejor en Google</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-4 text-violet-600">
                La solución: Blooglee
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Genera artículos en 60 segundos, sin escribir</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">Desde 19€/mes, 10x más barato que un redactor</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <span className="text-foreground/80">SEO optimizado para atraer pacientes locales</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Casos de éxito en el sector salud
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map((useCase, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg">
              <Heart className="w-10 h-10 text-fuchsia-500 mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">{useCase.title}</h3>
              <p className="text-foreground/70 mb-4">{useCase.description}</p>
              <div className="text-sm font-medium text-violet-600 bg-violet-50 rounded-lg px-3 py-2">
                {useCase.results}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Lo que dicen las clínicas
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {clinicaReviews.map((review, i) => (
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
            Recursos gratuitos para clínicas
          </h2>
          <p className="text-foreground/60">Descarga plantillas y guías específicas para el sector salud</p>
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
          {clinicasFAQs.map((faq, i) => (
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
              Empieza a atraer pacientes hoy
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Prueba Blooglee gratis con 1 artículo. Sin tarjeta de crédito.
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
