import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema } from '@/components/seo';
import { ArrowRight, Check, X, Globe, Shield, Wallet, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

const nextblogFAQs = [
  {
    question: '¿Cuál es la principal diferencia entre Blooglee y NextBlog.ai?',
    answer: 'Blooglee es la alternativa española a NextBlog: soporte nativo en español, precios en euros, plan gratuito incluido, datos almacenados en la UE (RGPD), y facturación española con IVA.',
  },
  {
    question: '¿NextBlog.ai tiene plan gratuito?',
    answer: 'No, NextBlog.ai no ofrece plan gratuito. Su plan más básico empieza en $29/mes. Blooglee ofrece un plan Free que incluye 1 sitio y 1 artículo sin coste.',
  },
  {
    question: '¿Cuál es más barato, Blooglee o NextBlog?',
    answer: 'Blooglee es más económico: Plan Starter 19€/mes vs NextBlog $29/mes (~27€). Además, Blooglee tiene plan gratuito y descuento anual del 20%.',
  },
  {
    question: '¿NextBlog.ai funciona en español?',
    answer: 'NextBlog.ai es una plataforma estadounidense enfocada en inglés. Aunque puede generar contenido en español, la interfaz y el soporte son en inglés. Blooglee es nativo en español.',
  },
  {
    question: '¿Dónde se almacenan los datos?',
    answer: 'NextBlog almacena datos en servidores de Estados Unidos. Blooglee almacena todos los datos en la Unión Europea, cumpliendo con RGPD.',
  },
];

const comparisonData = [
  { feature: 'Idioma principal', blooglee: 'Español nativo', nextblog: 'Inglés' },
  { feature: 'Soporte', blooglee: 'Español', nextblog: 'Inglés' },
  { feature: 'Plan gratuito', blooglee: 'Sí (1 artículo)', nextblog: 'No' },
  { feature: 'Precio inicial', blooglee: '19€/mes', nextblog: '$29/mes (~27€)' },
  { feature: 'Ubicación datos', blooglee: 'UE (RGPD)', nextblog: 'USA' },
  { feature: 'Catalán', blooglee: 'Sí', nextblog: 'No' },
  { feature: 'Factura española', blooglee: 'Sí (con IVA)', nextblog: 'No' },
  { feature: 'Publicación WordPress', blooglee: 'Sí', nextblog: 'Sí' },
  { feature: 'Imágenes incluidas', blooglee: 'Sí', nextblog: 'Sí' },
  { feature: 'SEO optimizado', blooglee: 'Sí', nextblog: 'Sí' },
];

const advantages = [
  {
    icon: Languages,
    title: 'Español nativo',
    description: 'Blooglee genera contenido en español de España con calidad nativa, no traducido. También soporta catalán.',
  },
  {
    icon: Wallet,
    title: 'Más económico',
    description: 'Plan Starter a 19€/mes vs $29 de NextBlog. Plan gratuito incluido para probar sin compromiso.',
  },
  {
    icon: Shield,
    title: 'RGPD cumplido',
    description: 'Datos almacenados en la UE. Facturación española con IVA. Ideal para empresas españolas.',
  },
  {
    icon: Globe,
    title: 'Soporte local',
    description: 'Atención al cliente en español. Respuesta rápida en tu idioma y zona horaria.',
  },
];

export default function NextBlogComparison() {
  return (
    <PublicLayout>
      <SEOHead 
        title="Blooglee vs NextBlog.ai - Comparativa Completa 2026"
        description="Blooglee vs NextBlog: comparativa detallada. Descubre las diferencias en funcionalidades, precios y publicación automática en WordPress."
        canonicalUrl="/alternativas/nextblog"
        keywords="Blooglee vs NextBlog, alternativa NextBlog español, comparativa NextBlog, blog automático España"
      />
      <FAQSchema faqs={nextblogFAQs} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <Link to="/alternativas" className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 mb-6">
            ← Volver a alternativas
          </Link>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Blooglee vs NextBlog.ai
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">
            NextBlog.ai es una herramienta estadounidense similar a Blooglee. 
            <strong className="text-foreground"> Blooglee es la alternativa española con mejor precio y soporte local.</strong>
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
                  <th className="py-4 px-4 text-center text-foreground/60 font-medium">NextBlog.ai</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="border-b border-violet-50">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center font-semibold text-violet-600">{row.blooglee}</td>
                    <td className="py-4 px-4 text-center text-foreground/60">{row.nextblog}</td>
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
            Si tu mercado es España o Latinoamérica, <strong>Blooglee es la mejor opción</strong>. 
            Ofrece mejor precio (19€ vs $29), plan gratuito para probar, soporte en español, 
            y cumplimiento RGPD con datos en la UE. NextBlog puede ser mejor si tu audiencia es exclusivamente anglófona.
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
          {nextblogFAQs.map((faq, i) => (
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
