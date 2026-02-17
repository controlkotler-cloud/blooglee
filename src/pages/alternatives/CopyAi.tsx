import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema } from '@/components/seo';
import { ArrowRight, FileText, Search, Image, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const copyaiFAQs = [
  {
    question: '¿Cuál es la principal diferencia entre Blooglee y Copy.ai?',
    answer: 'Blooglee genera artículos largos (800-1200 palabras) optimizados para SEO y los publica en WordPress. Copy.ai se enfoca en textos cortos: ads, emails, posts de redes sociales.',
  },
  {
    question: '¿Copy.ai puede crear artículos de blog?',
    answer: 'Copy.ai tiene plantillas para blogs, pero está optimizado para textos cortos. Los artículos que genera suelen ser más breves y requieren más edición para SEO. Blooglee está especializado en artículos largos listos para publicar.',
  },
  {
    question: '¿Copy.ai tiene integración con WordPress?',
    answer: 'No, Copy.ai no publica directamente en WordPress. Debes copiar el contenido y pegarlo manualmente. Blooglee publica con un clic.',
  },
  {
    question: '¿Cuál incluye imágenes?',
    answer: 'Blooglee incluye imagen destacada libre de derechos en cada artículo. Copy.ai no incluye imágenes, debes buscarlas por tu cuenta.',
  },
  {
    question: '¿Cuál es mejor para SEO?',
    answer: 'Blooglee optimiza automáticamente para SEO: meta títulos, descripciones, slugs, estructura de encabezados. Copy.ai no tiene optimización SEO integrada.',
  },
];

const comparisonData = [
  { feature: 'Tipo de contenido', blooglee: 'Artículos largos (800-1200 palabras)', copyai: 'Textos cortos (ads, emails, social)' },
  { feature: 'Optimización SEO', blooglee: 'Automática y completa', copyai: 'No incluida' },
  { feature: 'Publicación WordPress', blooglee: 'Sí, 1 clic', copyai: 'No' },
  { feature: 'Imágenes incluidas', blooglee: 'Sí, con créditos', copyai: 'No' },
  { feature: 'Plan gratuito', blooglee: 'Sí', copyai: 'Limitado' },
  { feature: 'Precio', blooglee: 'Desde 19€/mes', copyai: 'Desde $49/mes' },
  { feature: 'Español nativo', blooglee: 'Sí', copyai: 'Traducido' },
  { feature: 'Casos de uso', blooglee: 'Blogs, content marketing', copyai: 'Ads, emails, social media' },
];

const advantages = [
  {
    icon: FileText,
    title: 'Artículos largos',
    description: 'Blooglee genera 800-1200 palabras estructuradas. Copy.ai hace textos cortos que no sirven para SEO.',
  },
  {
    icon: Search,
    title: 'SEO incluido',
    description: 'Meta títulos, descripciones, slugs optimizados automáticamente. Copy.ai no tiene SEO.',
  },
  {
    icon: Image,
    title: 'Imágenes incluidas',
    description: 'Cada artículo incluye imagen destacada libre de derechos. Con Copy.ai buscas tú las imágenes.',
  },
  {
    icon: Globe,
    title: 'Publicación directa',
    description: 'Publica en WordPress con 1 clic. Copy.ai requiere copiar y pegar manualmente.',
  },
];

export default function CopyAiComparison() {
  return (
    <PublicLayout>
      <SEOHead 
        title="Blooglee vs Copy.ai - Comparativa Completa 2026"
        description="Blooglee vs Copy.ai: ¿cuál genera mejor contenido en español? Comparativa de funcionalidades, precios y publicación en WordPress."
        canonicalUrl="/alternativas/copy-ai"
        keywords="Blooglee vs Copy.ai, alternativa Copy.ai, comparativa Copy.ai, herramienta blog IA"
      />
      <FAQSchema faqs={copyaiFAQs} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <Link to="/alternativas" className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 mb-6">
            ← Volver a alternativas
          </Link>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Blooglee vs Copy.ai
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            Copy.ai es ideal para textos cortos de marketing. 
            <strong className="text-foreground"> Blooglee está diseñado para artículos de blog largos con SEO.</strong>
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
                  <th className="py-4 px-4 text-center text-foreground/60 font-medium">Copy.ai</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="border-b border-violet-50">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center font-semibold text-violet-600">{row.blooglee}</td>
                    <td className="py-4 px-4 text-center text-foreground/60">{row.copyai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Advantages */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold">Por qué elegir Blooglee para blogs</h2>
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
            <strong>Blooglee y Copy.ai son productos diferentes</strong> para necesidades diferentes. 
            Si necesitas <strong>artículos de blog para SEO</strong> con publicación en WordPress, elige Blooglee. 
            Si necesitas <strong>textos cortos para ads, emails o redes sociales</strong>, Copy.ai puede ser útil. 
            Muchos usuarios usan ambos para diferentes propósitos.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90">
              <Link to="/auth">
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
          {copyaiFAQs.map((faq, i) => (
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
