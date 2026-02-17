import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { Sparkles, Globe, TrendingUp, Languages, ImageIcon, Calendar, Zap, CheckCircle2, ArrowRight, Clock, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead, FAQSchema } from '@/components/seo';

// FAQs ampliadas para AEO - Preguntas sobre funcionalidades
const featuresFAQs = [{
  question: '¿Qué tipo de artículos genera Blooglee?',
  answer: 'Blooglee genera artículos de blog profesionales de 800-1200 palabras, adaptados al sector de cada negocio (salud, retail, servicios, tecnología, etc.). Cada artículo incluye título optimizado para SEO, meta descripción, estructura con encabezados H2-H3, imagen destacada con créditos, y slug SEO-friendly.'
}, {
  question: '¿Las imágenes de Blooglee están libres de derechos?',
  answer: 'Sí, todas las imágenes destacadas incluidas en los artículos de Blooglee provienen de bancos de imágenes libres de derechos (Pexels, Unsplash) o son generadas por IA. Los créditos del fotógrafo se incluyen automáticamente cuando corresponde.'
}, {
  question: '¿Puedo programar publicaciones automáticas en Blooglee?',
  answer: 'Sí, Blooglee permite configurar la frecuencia de publicación (semanal, quincenal, mensual) y genera automáticamente los artículos según el calendario. También puedes publicar manualmente cuando prefieras revisar antes de publicar.'
}, {
  question: '¿Qué modelos de IA utiliza Blooglee?',
  answer: 'Blooglee utiliza los modelos de IA más avanzados disponibles: GPT-5 de OpenAI y Gemini 2.5 de Google. Esto garantiza contenido de alta calidad, coherente y adaptado al contexto de cada negocio.'
}, {
  question: '¿Es compatible con Yoast SEO?',
  answer: 'Sí, Blooglee genera meta títulos y meta descripciones optimizados que Yoast SEO reconoce automáticamente. También es compatible con Rank Math y otros plugins de SEO.'
}, {
  question: '¿Funciona con Polylang para multiidioma?',
  answer: 'Sí, Blooglee es compatible con Polylang y WPML. Puedes generar artículos en español, catalán o inglés y asignarlos al idioma correspondiente en tu WordPress multiidioma.'
}, {
  question: '¿Cómo funciona la integración con WordPress?',
  answer: 'Blooglee se conecta a WordPress mediante Application Passwords (disponibles desde WP 5.6). Configuras la conexión una vez y después publicas con un clic. No requiere instalar ningún plugin.'
}, {
  question: '¿El contenido pasa los detectores de IA?',
  answer: 'El contenido generado por Blooglee es único y de alta calidad. Aunque es generado por IA, está optimizado para ser natural y legible. Puedes editarlo antes de publicar para añadir tu toque personal.'
}];
const features = [{
  icon: Sparkles,
  title: 'Generación automática con IA',
  description: 'Nuestra IA avanzada crea artículos únicos y de calidad profesional adaptados a tu sector y audiencia.',
  benefits: ['Contenido original y único cada vez', 'Adaptado al tono de tu marca', 'Sin límite de creatividad'],
  color: 'from-violet-500 to-fuchsia-500'
}, {
  icon: Globe,
  title: 'Publicación directa en WordPress',
  description: 'Conecta tu WordPress una vez y publica artículos directamente sin copiar ni pegar.',
  benefits: ['Integración en 2 minutos', 'Publicación con un clic', 'Compatible con cualquier tema'],
  color: 'from-fuchsia-500 to-pink-500'
}, {
  icon: TrendingUp,
  title: 'SEO optimizado automáticamente',
  description: 'Cada artículo viene con meta títulos, descripciones y estructura optimizada para buscadores.',
  benefits: ['Meta tags generados automáticamente', 'Estructura de encabezados H1-H3', 'Slugs amigables para SEO'],
  color: 'from-pink-500 to-orange-400'
}, {
  icon: Languages,
  title: 'Múltiples idiomas',
  description: 'Genera contenido en español, catalán, inglés y más idiomas para llegar a más audiencias.',
  benefits: ['Español y catalán incluidos', 'Más idiomas próximamente', 'Traducción de calidad nativa'],
  color: 'from-orange-400 to-amber-400'
}, {
  icon: ImageIcon,
  title: 'Imágenes con créditos incluidos',
  description: 'Cada artículo incluye una imagen destacada de alta calidad con los créditos del fotógrafo.',
  benefits: ['Imágenes libres de derechos', 'Alta resolución', 'Créditos automáticos'],
  color: 'from-amber-400 to-yellow-400'
}, {
  icon: Calendar,
  title: 'Programación de contenido',
  description: 'Configura la frecuencia de publicación y deja que Blooglee genere contenido automáticamente.',
  benefits: ['Frecuencia personalizable', 'Generación automática', 'Sin intervención manual'],
  color: 'from-cyan-400 to-violet-500'
}];
const comparison = [{
  feature: 'Tiempo por artículo',
  manual: '2-4 horas',
  blooglee: '0 min (auto) / 2 min'
}, {
  feature: 'Optimización SEO',
  manual: 'Requiere expertise',
  blooglee: 'Automático'
}, {
  feature: 'Imágenes',
  manual: 'Búsqueda manual',
  blooglee: 'Incluidas'
}, {
  feature: 'Publicación WordPress',
  manual: 'Copiar y pegar',
  blooglee: '1 clic'
}, {
  feature: 'Consistencia',
  manual: 'Variable',
  blooglee: 'Garantizada'
}, {
  feature: 'Coste mensual',
  manual: '500€+ (redactor)',
  blooglee: 'Desde 0€'
}];
const FeaturesPage = () => {
  return <PublicLayout>
      <SEOHead title="Características" description="Descubre las funcionalidades de Blooglee: generación de artículos con IA, publicación automática en WordPress, SEO incluido y soporte multi-idioma. Prueba gratis." canonicalUrl="/features" keywords="características Blooglee, generación IA, WordPress automático, SEO automático, contenido multiidioma" />
      <FAQSchema faqs={featuresFAQs} />
      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <Zap className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Características</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Todo lo que necesitas para{' '}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              automatizar tu blog
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-foreground/60 mb-8">
            Blooglee combina IA avanzada con integración WordPress para crear contenido profesional sin esfuerzo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90">
              <Link to="/auth">
                Empieza gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">Ver precios</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-24">
          {features.map((feature, i) => <div key={i} className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              
              <h3 className="font-display text-xl font-bold mb-3 text-foreground">
                {feature.title}
              </h3>
              
              <p className="text-foreground/60 mb-6">
                {feature.description}
              </p>
              
              <ul className="space-y-2">
                {feature.benefits.map((benefit, j) => <li key={j} className="flex items-center gap-2 text-sm text-foreground/70">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {benefit}
                  </li>)}
              </ul>
            </div>)}
        </div>

        {/* Comparison Section */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/50 shadow-xl p-6 sm:p-8 lg:p-12 mb-16 sm:mb-24">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Blooglee vs{' '}
              <span className="text-foreground/40">hacerlo manualmente</span>
            </h2>
            <p className="text-foreground/60">
              Compara el tiempo y recursos que ahorras con Blooglee
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-violet-100">
                  <th className="py-4 px-4 text-left text-foreground/60 font-medium">Característica</th>
                  <th className="py-4 px-4 text-center text-foreground/60 font-medium">Manual</th>
                  <th className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold">
                      Blooglee
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => <tr key={i} className="border-b border-violet-50">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-foreground/60">{row.manual}</td>
                    <td className="py-4 px-4 text-center font-semibold text-violet-600">{row.blooglee}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 sm:mb-24">
          <div className="text-center p-6 sm:p-8 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
            <Clock className="w-10 h-10 text-violet-500 mx-auto mb-4" />
            <div className="font-display text-3xl sm:text-4xl font-bold text-violet-600 mb-2">95%</div>
            <p className="text-foreground/60">menos tiempo invertido</p>
          </div>
          <div className="text-center p-6 sm:p-8 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
            <DollarSign className="w-10 h-10 text-fuchsia-500 mx-auto mb-4" />
            <div className="font-display text-3xl sm:text-4xl font-bold text-fuchsia-600 mb-2">80%</div>
            <p className="text-foreground/60">ahorro en costes</p>
          </div>
          <div className="text-center p-6 sm:p-8 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl">
            <Users className="w-10 h-10 text-orange-500 mx-auto mb-4" />
            <div className="font-display text-3xl sm:text-4xl font-bold text-orange-600 mb-2">500+</div>
            <p className="text-foreground/60">posts creados </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400" />
          <div className="absolute top-0 left-0 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              ¿Listo para automatizar tu contenido?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Empieza gratis hoy y descubre cómo Blooglee puede transformar tu estrategia de contenido.
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
    </PublicLayout>;
};
export default FeaturesPage;