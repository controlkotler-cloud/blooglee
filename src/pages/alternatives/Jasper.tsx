import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema } from '@/components/seo';
import { ArrowRight, Target, Wallet, Zap, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const jasperFAQs = [
  {
    question: '¿Cuál es la principal diferencia entre Blooglee y Jasper?',
    answer: 'Blooglee está especializado en blogs WordPress con publicación directa. Jasper es una herramienta generalista de copywriting para múltiples formatos (ads, emails, social, etc.).',
  },
  {
    question: '¿Jasper publica directamente en WordPress?',
    answer: 'No, Jasper no tiene integración de publicación con WordPress. Debes copiar el contenido manualmente. Blooglee publica con un clic directamente en tu WordPress.',
  },
  {
    question: '¿Cuánto cuesta Jasper comparado con Blooglee?',
    answer: 'Jasper empieza en $49/mes sin plan gratuito. Blooglee empieza en 0€ (plan Free) y 19€/mes (Starter). Blooglee es un 60% más económico para blogs.',
  },
  {
    question: '¿Jasper incluye imágenes para los artículos?',
    answer: 'Jasper Art es un producto separado con coste adicional. Blooglee incluye imágenes destacadas de bancos libres de derechos en todos los planes.',
  },
  {
    question: '¿Cuál tiene menos curva de aprendizaje?',
    answer: 'Blooglee es más sencillo: conectas WordPress, generas y publicas. Jasper tiene más opciones y plantillas, lo que requiere tiempo para dominar.',
  },
];

const comparisonData = [
  { feature: 'Especialización', blooglee: 'Blogs WordPress', jasper: 'Copywriting general' },
  { feature: 'Publicación WordPress', blooglee: 'Sí, 1 clic', jasper: 'No incluido' },
  { feature: 'Plan gratuito', blooglee: 'Sí', jasper: 'No' },
  { feature: 'Precio inicial', blooglee: '19€/mes', jasper: '$49/mes' },
  { feature: 'Imágenes incluidas', blooglee: 'Sí', jasper: 'Extra (Jasper Art)' },
  { feature: 'SEO automático', blooglee: 'Sí', jasper: 'Manual' },
  { feature: 'Curva aprendizaje', blooglee: 'Muy baja', jasper: 'Media-alta' },
  { feature: 'Español nativo', blooglee: 'Sí', jasper: 'Traducido' },
  { feature: 'Plantillas', blooglee: 'Blogs optimizadas', jasper: '50+ tipos' },
];

const advantages = [
  {
    icon: Target,
    title: 'Especializado en blogs',
    description: 'Blooglee hace una cosa y la hace muy bien: artículos de blog para WordPress optimizados para SEO.',
  },
  {
    icon: MousePointer,
    title: 'Publicación 1-clic',
    description: 'Jasper requiere copiar y pegar. Blooglee publica directamente en tu WordPress con un clic.',
  },
  {
    icon: Wallet,
    title: '60% más barato',
    description: 'Plan Starter 19€ vs Jasper $49. Imágenes incluidas sin coste extra como Jasper Art.',
  },
  {
    icon: Zap,
    title: 'Sin curva de aprendizaje',
    description: 'Jasper tiene muchas opciones que abruman. Blooglee: conectas, generas, publicas. Así de simple.',
  },
];

export default function JasperComparison() {
  return (
    <PublicLayout>
      <SEOHead 
        title="Blooglee vs Jasper - Comparativa Completa 2026"
        description="Blooglee vs Jasper: comparativa en español. Automatización de blogs WordPress con IA, precios y funcionalidades frente a frente."
        canonicalUrl="/alternativas/jasper"
        keywords="Blooglee vs Jasper, alternativa Jasper, comparativa Jasper AI, herramienta blog IA"
      />
      <FAQSchema faqs={jasperFAQs} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <Link to="/alternativas" className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 mb-6">
            ← Volver a alternativas
          </Link>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Blooglee vs Jasper
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            Jasper es una herramienta de copywriting generalista muy potente. 
            <strong className="text-foreground"> Blooglee está especializado en blogs WordPress con publicación directa.</strong>
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl p-6 sm:p-8 mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Comparativa detallada</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-violet-100">
                  <th className="py-4 px-4 text-left text-foreground/60 font-medium">Característica</th>
                  <th className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold">
                      Blooglee
                    </span>
                  </th>
                  <th className="py-4 px-4 text-center text-foreground/60 font-medium">Jasper</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="border-b border-violet-50">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center font-semibold text-violet-600">{row.blooglee}</td>
                    <td className="py-4 px-4 text-center text-foreground/60">{row.jasper}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Advantages */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold">Por qué elegir Blooglee</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {advantages.map((advantage, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg">
              <advantage.icon className="w-10 h-10 text-fuchsia-500 mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">{advantage.title}</h3>
              <p className="text-foreground/70">{advantage.description}</p>
            </div>
          ))}
        </div>

        {/* Verdict */}
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-3xl border border-violet-200 p-8 sm:p-12 mb-12">
          <h2 className="font-display text-2xl font-bold mb-4 text-center">Veredicto</h2>
          <p className="text-center text-foreground/80 max-w-2xl mx-auto mb-6">
            Si solo necesitas <strong>artículos de blog para WordPress</strong>, Blooglee es la mejor opción: 
            más barato, más simple y con publicación directa. Jasper es mejor si necesitas una herramienta generalista 
            para múltiples tipos de contenido (ads, emails, social media) y tienes presupuesto para $49+/mes.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90">
              <Link to="/waitlist">
                Probar Blooglee gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold">Preguntas frecuentes</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {jasperFAQs.map((faq, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg">
              <h3 className="font-medium mb-2">{faq.question}</h3>
              <p className="text-foreground/70">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
