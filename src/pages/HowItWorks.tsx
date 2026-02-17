import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema, HowToSchema } from '@/components/seo';
import { 
  ArrowRight, 
  Globe, 
  Settings, 
  Sparkles, 
  Send,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const howItWorksFAQs = [
  {
    question: '¿Cuánto tiempo tarda en generarse un artículo?',
    answer: 'El proceso de generación tarda aproximadamente 60 segundos. Después puedes revisar, editar si quieres, y publicar con un clic adicional.',
  },
  {
    question: '¿Necesito conocimientos técnicos?',
    answer: 'No. Si sabes publicar en WordPress, sabes usar Blooglee. El proceso es muy intuitivo y no requiere configuraciones técnicas complejas.',
  },
  {
    question: '¿Cómo conecto mi WordPress?',
    answer: 'Necesitas crear un Application Password en tu WordPress (Usuarios → Tu perfil → Application Passwords). Copias la URL, usuario y contraseña de aplicación en Blooglee y listo.',
  },
  {
    question: '¿Puedo revisar el artículo antes de publicar?',
    answer: 'Sí, siempre. Blooglee te muestra una vista previa completa del artículo con título, contenido e imagen. Puedes editarlo o regenerarlo antes de publicar.',
  },
  {
    question: '¿Qué pasa si no me gusta el artículo generado?',
    answer: 'Puedes regenerar el artículo con un clic para obtener una versión diferente. También puedes editar el texto directamente antes de publicar.',
  },
];

const howToSteps = [
  {
    name: 'Conecta tu WordPress',
    text: 'Crea un Application Password en tu WordPress y conéctalo con Blooglee. Solo toma 2 minutos y es una única vez por sitio.',
  },
  {
    name: 'Configura tu sitio',
    text: 'Elige el sector de tu negocio, el idioma (español, catalán o inglés) y la frecuencia de publicación deseada.',
  },
  {
    name: 'Genera tu artículo',
    text: 'Blooglee usa IA avanzada (GPT-5, Gemini) para crear un artículo único de 800-1200 palabras con imagen destacada y SEO optimizado.',
  },
  {
    name: 'Revisa y publica',
    text: 'Revisa la vista previa, edita si quieres, y publica directamente en WordPress con un clic. ¡Listo!',
  },
];

const steps = [
  {
    number: '01',
    icon: Globe,
    title: 'Conecta tu WordPress',
    description: 'Crea un Application Password en tu WordPress (Usuarios → Perfil → Application Passwords). Copia la URL, usuario y contraseña en Blooglee.',
    time: '2 min (una vez)',
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    number: '02',
    icon: Settings,
    title: 'Configura tu sitio',
    description: 'Elige tu sector (salud, retail, tech...), idioma (español, catalán, inglés) y frecuencia de publicación (semanal, quincenal, mensual).',
    time: '1 min (una vez)',
    color: 'from-fuchsia-500 to-pink-500',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Genera tu artículo',
    description: 'Haz clic en "Generar artículo". La IA crea un artículo único de 800-1200 palabras con título, contenido, imagen y meta descripción optimizados para SEO.',
    time: '60 segundos',
    color: 'from-pink-500 to-orange-400',
  },
  {
    number: '04',
    icon: Send,
    title: 'Revisa y publica (o automatiza)',
    description: 'Modo manual: revisa la vista previa y publica con un clic. Modo automático: Blooglee genera y publica por ti sin que tengas que hacer nada.',
    time: 'Opcional',
    color: 'from-orange-400 to-amber-400',
  },
];

export default function HowItWorks() {
  return (
    <PublicLayout>
      <SEOHead 
        title="Cómo Funciona Blooglee"
        description="Conecta tu WordPress, la IA genera artículos con SEO optimizado y publícalos en un clic. Así de fácil funciona Blooglee."
        canonicalUrl="/como-funciona"
        keywords="cómo funciona Blooglee, tutorial Blooglee, publicar WordPress IA, automatizar blog"
      />
      <FAQSchema faqs={howItWorksFAQs} />
      <HowToSchema 
        name="Cómo usar Blooglee para generar artículos de blog"
        description="Guía paso a paso para conectar tu WordPress, configurar Blooglee y publicar artículos generados con IA automáticamente."
        steps={howToSteps}
        totalTime="PT5M"
      />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <Zap className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Cómo funciona</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              4 pasos simples
            </span>
            <br />
            <span className="text-foreground">para tu blog en piloto automático</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            Conectar tu WordPress, generar artículos y publicar 
            <strong className="text-foreground"> toma menos de 5 minutos</strong>. Sin conocimientos técnicos.
          </p>

          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-emerald-50 border border-emerald-200">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">Primera vez: ~5 min · Después: 0 min (automático)</span>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl p-8 sm:p-10">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Number and Icon */}
                  <div className="flex items-center gap-4">
                    <span className={`text-6xl font-display font-bold bg-gradient-to-br ${step.color} bg-clip-text text-transparent`}>
                      {step.number}
                    </span>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="font-display text-2xl font-bold">{step.title}</h2>
                      <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
                        {step.time}
                      </span>
                    </div>
                    <p className="text-foreground/70 text-lg">{step.description}</p>
                  </div>
                </div>
              </div>
              
              {/* Connector */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute left-12 -bottom-4 w-0.5 h-8 bg-gradient-to-b from-violet-300 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Summary */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-3xl border border-violet-200 p-8 sm:p-12">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">En resumen</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <div className="font-display text-lg font-bold">Conectas WordPress</div>
              <div className="text-sm text-foreground/60">Una sola vez</div>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <div className="font-display text-lg font-bold">Configuras sector</div>
              <div className="text-sm text-foreground/60">Una sola vez</div>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-10 h-10 text-violet-500 mx-auto mb-3" />
              <div className="font-display text-lg font-bold">Modo automático</div>
              <div className="text-sm text-foreground/60">0 min, publica solo</div>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-10 h-10 text-violet-500 mx-auto mb-3" />
              <div className="font-display text-lg font-bold">O modo manual</div>
              <div className="text-sm text-foreground/60">~2 min revisar</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Preguntas frecuentes</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {howItWorksFAQs.map((faq, i) => (
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
              ¿Listo para empezar?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Crea tu cuenta gratis y genera tu primer artículo en menos de 5 minutos.
            </p>
            <Button asChild size="lg" className="bg-white text-violet-600 hover:bg-white/90">
              <Link to="/waitlist">
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
