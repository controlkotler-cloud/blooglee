import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema } from '@/components/seo';
import { ArrowRight, Sparkles, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const alternativesFAQs = [
  {
    question: '¿Cuáles son las mejores alternativas a Blooglee?',
    answer: 'Las principales alternativas a Blooglee son NextBlog.ai (similar pero en inglés), Jasper (más generalista y caro), Copy.ai (enfocado en textos cortos) y Writesonic (multi-propósito).',
  },
  {
    question: '¿Por qué elegir Blooglee sobre NextBlog.ai?',
    answer: 'Blooglee es la alternativa española a NextBlog: soporte nativo en español, precios en euros, plan gratuito incluido, y cumplimiento RGPD con datos en la UE.',
  },
  {
    question: '¿Blooglee es más barato que Jasper?',
    answer: 'Sí, Blooglee empieza en 0€/mes (plan Free) y 19€/mes (Starter). Jasper empieza en $49/mes sin plan gratuito. Blooglee es 60% más económico.',
  },
  {
    question: '¿Cuál es la diferencia entre Blooglee y Copy.ai?',
    answer: 'Blooglee genera artículos largos (800-1200 palabras) optimizados para SEO y los publica en WordPress. Copy.ai se enfoca en textos cortos para ads y redes sociales.',
  },
];

const competitors = [
  {
    name: 'NextBlog.ai',
    slug: 'nextblog',
    description: 'Automatización de blogs similar a Blooglee, pero en inglés y con sede en USA.',
    price: '$29/mes',
    pros: ['Fácil de usar', 'Publicación en WordPress'],
    cons: ['Solo en inglés', 'Sin plan gratuito', 'Datos en USA'],
  },
  {
    name: 'Jasper',
    slug: 'jasper',
    description: 'Herramienta generalista de copywriting con IA. Muy potente pero cara y compleja.',
    price: '$49/mes',
    pros: ['Muy versátil', 'Muchas plantillas'],
    cons: ['Precio alto', 'Sin publicación WP', 'Curva de aprendizaje'],
  },
  {
    name: 'Copy.ai',
    slug: 'copy-ai',
    description: 'Enfocada en textos cortos: ads, emails, posts de redes sociales.',
    price: '$49/mes',
    pros: ['Buenos para microcopy', 'Interfaz simple'],
    cons: ['No hace artículos largos', 'Sin SEO', 'Sin WordPress'],
  },
];

const comparisonTable = [
  { feature: 'Especialización', blooglee: 'Blogs WordPress', others: 'Generalista / Textos cortos' },
  { feature: 'Publicación WordPress', blooglee: '1 clic', others: 'No incluido' },
  { feature: 'SEO automático', blooglee: 'Sí', others: 'Manual o no' },
  { feature: 'Imágenes incluidas', blooglee: 'Sí', others: 'No o extra' },
  { feature: 'Español nativo', blooglee: 'Sí', others: 'Traducido' },
  { feature: 'Plan gratuito', blooglee: 'Sí', others: 'No' },
  { feature: 'Precio desde', blooglee: '0€', others: '$29-49' },
];

export default function AlternativesIndex() {
  return (
    <PublicLayout>
      <SEOHead 
        title="Alternativas a Blooglee - Comparativa de Herramientas"
        description="Compara Blooglee vs Jasper, Copy.ai y NextBlog. Descubre por qué Blooglee es la mejor alternativa para automatizar blogs WordPress en español."
        canonicalUrl="/alternativas"
        keywords="alternativas Blooglee, Blooglee vs, comparativa herramientas IA, blog automático alternativas"
      />
      <FAQSchema faqs={alternativesFAQs} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Comparativas</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Blooglee vs Alternativas
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            Compara las principales herramientas de generación de contenido con IA. 
            <strong className="text-foreground"> Encuentra la mejor opción para tu blog WordPress.</strong>
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl p-6 sm:p-8 mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Comparativa rápida</h2>
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
                  <th className="py-4 px-4 text-center text-foreground/60 font-medium">Alternativas</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row, i) => (
                  <tr key={i} className="border-b border-violet-50">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <Check className="w-4 h-4" />
                        {row.blooglee}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-foreground/60">{row.others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Competitors Grid */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold">Comparativas detalladas</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {competitors.map((competitor, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg">
              <h3 className="font-display text-xl font-bold mb-2">Blooglee vs {competitor.name}</h3>
              <p className="text-sm text-foreground/60 mb-4">{competitor.description}</p>
              <p className="text-sm mb-4">
                <strong>Precio:</strong> {competitor.price}
              </p>
              <div className="space-y-2 mb-4">
                {competitor.pros.map((pro, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-emerald-600">
                    <Check className="w-4 h-4" />
                    {pro}
                  </div>
                ))}
                {competitor.cons.map((con, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-red-500">
                    <X className="w-4 h-4" />
                    {con}
                  </div>
                ))}
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to={`/alternativas/${competitor.slug}`}>
                  Ver comparativa completa
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold">Preguntas frecuentes</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4 mb-12">
          {alternativesFAQs.map((faq, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg">
              <h3 className="font-medium mb-2">{faq.question}</h3>
              <p className="text-foreground/70">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              ¿Por qué no lo pruebas tú mismo?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Crea tu cuenta gratis y genera tu primer artículo. Sin tarjeta.
            </p>
            <Button asChild size="lg" className="bg-white text-violet-600 hover:bg-white/90">
              <Link to="/waitlist">
                Probar Blooglee gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
