import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Globe, 
  FileText, 
  TrendingUp, 
  Clock, 
  Languages,
  CheckCircle2,
  Star,
  Play,
  BarChart3,
  Palette
} from 'lucide-react';
import { ProductMockup } from '@/components/saas/ProductMockup';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { SEOHead, FAQSchema, SoftwareAppSchema } from '@/components/seo';

// FAQs ampliadas para AEO - Optimizadas para ChatGPT, Claude, Perplexity
const landingFAQs = [
  {
    question: '¿Qué es Blooglee?',
    answer: 'Blooglee es una plataforma SaaS española que utiliza inteligencia artificial (Gemini 2.5 Flash de Google) para generar y publicar automáticamente artículos de blog optimizados para SEO en WordPress. Ideal para empresas y agencias de marketing que quieren mantener su blog activo sin dedicar horas a la redacción.',
  },
  {
    question: '¿Cómo funciona la generación automática de contenido de Blooglee?',
    answer: 'Blooglee usa modelos de IA avanzados para generar artículos únicos de 800-2500 palabras según tu configuración. Configuras tu sitio web, eliges el sector y la frecuencia, y Blooglee genera artículos completos con imagen destacada, meta descripciones y estructura SEO optimizada, listos para publicar en WordPress con un clic.',
  },
  {
    question: '¿Blooglee es compatible con mi WordPress?',
    answer: 'Sí, Blooglee funciona con cualquier instalación de WordPress 5.0 o superior que tenga habilitados los Application Passwords (incluidos por defecto desde WordPress 5.6). Es compatible con Yoast SEO, Rank Math y Polylang para publicación multiidioma.',
  },
  {
    question: '¿Cuánto cuesta Blooglee?',
    answer: 'Blooglee ofrece un plan gratuito que incluye 1 sitio y 1 artículo para probar. Los planes de pago empiezan en 19€/mes (Starter: 4 artículos), 49€/mes (Pro: 30 artículos, 3 sitios) y 149€/mes (Agencia: 100 artículos, 10 sitios). Sin permanencia.',
  },
  {
    question: '¿Blooglee genera contenido en varios idiomas?',
    answer: 'Sí, Blooglee genera contenido de calidad nativa en español (España), catalán e inglés. El contenido se adapta culturalmente a cada idioma, no es simple traducción automática.',
  },
  {
    question: '¿Cómo se compara Blooglee con ChatGPT para crear contenido?',
    answer: 'ChatGPT requiere escribir prompts, copiar el texto, formatearlo, buscar imágenes y subirlas manualmente a WordPress. Blooglee automatiza todo: genera artículos optimizados, incluye imagen destacada con créditos, y publica con un clic. Ahorra un 90% del tiempo frente a usar ChatGPT directamente.',
  },
  {
    question: '¿Blooglee funciona con WooCommerce?',
    answer: 'Sí. Si tienes un blog en tu tienda WooCommerce, Blooglee puede publicar artículos sin problemas. Es ideal para crear contenido que atraiga tráfico orgánico a tus productos y mejore el SEO de tu tienda online.',
  },
  {
    question: '¿Puedo usar Blooglee si no sé nada de SEO?',
    answer: 'Sí. Blooglee optimiza automáticamente todos los artículos: meta títulos (<60 caracteres), meta descripciones (<160 caracteres), slugs SEO-friendly y estructura de encabezados H1-H3. No necesitas conocimientos técnicos de SEO.',
  },
  {
    question: '¿Qué pasa si no me gusta el artículo generado?',
    answer: 'Puedes regenerar el artículo con un clic para obtener una versión diferente. También puedes editarlo directamente en Blooglee o en WordPress antes de publicar. Tienes control total sobre el contenido final.',
  },
  {
    question: '¿El contenido de Blooglee es único o duplicado?',
    answer: 'Cada artículo es 100% único, generado específicamente para tu negocio. No hay contenido duplicado, reciclado ni spinning. Puedes verificarlo con cualquier herramienta de detección de plagio.',
  },
  {
    question: '¿Cuántas palabras tienen los artículos de Blooglee?',
    answer: 'Los artículos generados tienen entre 800-2500 palabras según tu configuración (corto, medio o largo), con estructura profesional: título H1 optimizado, introducción, secciones con H2 y H3, y conclusión. Longitud ideal para SEO y engagement.',
  },
  {
    question: '¿Puedo programar publicaciones automáticas en Blooglee?',
    answer: 'Sí. Configuras la frecuencia de publicación (semanal, quincenal, mensual) y Blooglee genera los artículos según tu calendario. Puedes publicar automáticamente o revisar antes de publicar.',
  },
];

// Por qué funciona - Datos reales del producto
const whyItWorks = [
  {
    stat: "60 seg",
    label: "Por artículo",
    description: "Generación completa con imagen y SEO",
    icon: Clock,
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    stat: "100%",
    label: "SEO incluido",
    description: "Meta título, descripción, slug y estructura H1-H3",
    icon: TrendingUp,
    color: "from-fuchsia-500 to-pink-500",
  },
  {
    stat: "3",
    label: "Pasos y listo",
    description: "Conectar → Generar → Publicar en WordPress",
    icon: Zap,
    color: "from-pink-500 to-orange-400",
  },
  {
    stat: "0",
    label: "Curva aprendizaje",
    description: "Si publicas en WordPress, ya sabes usar Blooglee",
    icon: Sparkles,
    color: "from-orange-400 to-amber-400",
  },
];
const features = [
  {
    icon: Sparkles,
    title: "Contenido profesional con IA",
    description: "Artículos de calidad optimizados para SEO con imagen destacada y meta tags incluidos.",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: Globe,
    title: "Publicación en WordPress",
    description: "Conecta tu WordPress una vez y publica artículos en piloto automático.",
    color: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Languages,
    title: "Multi-idioma",
    description: "Genera contenido en español, catalán, inglés y más idiomas.",
    color: "from-pink-500 to-orange-400",
  },
  {
    icon: TrendingUp,
    title: "SEO completo incluido",
    description: "Títulos, meta descripciones y slugs optimizados automáticamente.",
    color: "from-orange-400 to-amber-400",
  },
  {
    icon: Clock,
    title: "Solo configuras una vez",
    description: "Onboarding sencillo. Configura tu sitio y Blooglee hace el resto.",
    color: "from-amber-400 to-yellow-400",
  },
  {
    icon: Palette,
    title: "Adaptado a tu sector",
    description: "Contenido profesional para cualquier industria: salud, retail, servicios, tech y más.",
    color: "from-cyan-400 to-violet-500",
  },
];


// Stats con contexto citable para AEO
const stats = [
  { value: "10K+", label: "Artículos generados", context: "10.000+ artículos generados en 2026" },
  { value: "500+", label: "Empresas activas", context: "500+ empresas confían en Blooglee" },
  { value: "98%", label: "Satisfacción", context: "98% de clientes satisfechos" },
  { value: "4.9★", label: "Valoración media", context: "Valoración media de 4.9/5 estrellas" },
];

const Landing = () => {
  return (
    <PublicLayout>
      <SEOHead 
        canonicalUrl="/"
        description="Blooglee genera artículos de blog con IA y los publica en WordPress automáticamente. Prueba gratis: 1 sitio + 1 artículo. Ideal para empresas y agencias de marketing. 🇪🇸"
        keywords="blog automático, generación contenido IA, WordPress, marketing contenidos, SEO, artículos automáticos, Blooglee, alternativa NextBlog"
      />
      <FAQSchema faqs={landingFAQs} />
      <SoftwareAppSchema />
      {/* Hero Section - Mobile First */}
      <section className="relative pb-12 sm:pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-6">
        <div className="container-custom relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left - Content */}
            <div className="text-center lg:text-left order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg shadow-violet-500/10 mb-6 sm:mb-8">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Potenciado por IA avanzada
                </span>
              </div>
              
              {/* Main heading - Mobile optimized sizes */}
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-5 sm:mb-8">
                Tu blog en{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease_infinite]">
                    piloto
                  </span>
                </span>
                <br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-fuchsia-500 via-orange-400 to-violet-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease_infinite_0.5s]">
                    automático
                  </span>
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-foreground/70 mb-6 sm:mb-10 max-w-lg mx-auto lg:mx-0">
                Configura tu web una vez y genera artículos profesionales con IA para WordPress. 
                <span className="font-semibold text-foreground"> Ideal para empresas y agencias.</span>
              </p>

              {/* CTA Buttons - Stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-12">
                <Link 
                  to="/waitlist" 
                  className="group relative px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-white text-base sm:text-lg overflow-hidden shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-fuchsia-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative flex items-center justify-center gap-2">
                    Prueba gratis · 1 sitio + 1 post
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link to="/como-funciona" className="group px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-foreground bg-white/80 backdrop-blur-sm border border-violet-200/50 hover:bg-white hover:border-violet-300 transition-all shadow-lg flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 text-violet-500 group-hover:scale-110 transition-transform" />
                  Ver demo
                </Link>
              </div>

            </div>

            {/* Right - Product Mockup - Hidden on very small screens, scaled down on mobile */}
            <div className="relative order-2 w-full max-w-md lg:max-w-none mx-auto mt-4 lg:mt-0">
              {/* Glow behind mockup */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-orange-400/20 blur-3xl rounded-full scale-110 hidden sm:block" />
              <div className="transform scale-90 sm:scale-100">
                <ProductMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - 2x2 grid on mobile */}
      <section className="relative py-8 sm:py-12 lg:py-16 px-4 sm:px-6 z-10">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="group relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <div className="relative text-center">
                  <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent mb-0.5 sm:mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-foreground/60 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Single column on mobile */}
      <section id="features" className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 z-10">
        <div className="container-custom">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-4 sm:mb-6">
              <BarChart3 className="w-4 h-4 text-violet-500" />
              <span className="text-xs sm:text-sm font-medium text-violet-600">Características</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Todo para{' '}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
                dominar el SEO
              </span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/60 px-4">
              Automatiza tu estrategia de contenido con herramientas potentes.
            </p>
          </div>

          {/* Features grid - 1 col mobile, 2 col tablet, 3 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group relative p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden"
              >
                {/* Gradient blob on hover */}
                <div className={`absolute -right-16 -top-16 w-32 h-32 rounded-full bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl`} />
                
                <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-foreground/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section - Mobile optimized */}
      <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 z-10">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border border-fuchsia-200/50 shadow-lg mb-4 sm:mb-6">
              <Zap className="w-4 h-4 text-fuchsia-500" />
              <span className="text-xs sm:text-sm font-medium text-fuchsia-600">Cómo funciona</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              De cero a contenido en{' '}
              <span className="bg-gradient-to-r from-fuchsia-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                3 pasos
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 relative">
            {/* Connection line - Hidden on mobile */}
            <div className="hidden md:block absolute top-20 lg:top-24 left-[20%] right-[20%] h-1 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 rounded-full opacity-30" />
            
            {[
              {
                step: "01",
                title: "Conecta tu sitio",
                description: "Añade las credenciales de tu WordPress y elige tu sector. Solo 2 minutos.",
                icon: Globe,
                color: "from-violet-500 to-fuchsia-500",
              },
              {
                step: "02",
                title: "La IA trabaja",
                description: "Blooglee genera artículos únicos con imágenes y SEO optimizado.",
                icon: Sparkles,
                color: "from-fuchsia-500 to-orange-400",
              },
              {
                step: "03",
                title: "Publica y crece",
                description: "Revisa, edita si quieres, y publica. Tu blog crece en automático.",
                icon: TrendingUp,
                color: "from-orange-400 to-amber-400",
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="relative inline-flex mb-5 sm:mb-8">
                  {/* Main icon container - Smaller on mobile */}
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] bg-gradient-to-br ${item.color} flex items-center justify-center shadow-2xl shadow-violet-500/20`}>
                    <item.icon className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white" />
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-white shadow-xl flex items-center justify-center font-display font-bold text-sm sm:text-base lg:text-lg bg-gradient-to-br from-foreground to-foreground/80 text-transparent bg-clip-text border border-gray-100">
                    {item.step}
                  </div>
                  {/* Glow - Smaller on mobile */}
                  <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] bg-gradient-to-br ${item.color} blur-xl sm:blur-2xl opacity-30`} />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-foreground/60 max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Works Section */}
      <section id="why-it-works" className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 z-10">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border border-emerald-200/50 shadow-lg mb-4 sm:mb-6">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs sm:text-sm font-medium text-emerald-600">Por qué funciona</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              La automatización que tu{' '}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                blog necesita
              </span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/60 px-4">
              Sin promesas vacías. Esto es lo que Blooglee hace por ti en cada artículo.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {whyItWorks.map((item, i) => (
              <div 
                key={i}
                className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden"
              >
                {/* Gradient blob on hover */}
                <div className={`absolute -right-16 -top-16 w-32 h-32 rounded-full bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl`} />
                
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="font-display text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-1">
                  {item.stat}
                </div>
                <div className="text-sm sm:text-base font-semibold text-foreground/80 mb-2">
                  {item.label}
                </div>
                <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Feature summary */}
          <div className="mt-8 sm:mt-12 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 shadow-lg">
            <p className="text-center text-sm sm:text-base lg:text-lg text-foreground/70">
              <span className="font-semibold text-foreground">Cada artículo incluye:</span>{' '}
              título H1 optimizado, meta descripción, imagen con licencia libre, 
              estructura de encabezados H2-H3, slug SEO-friendly, enlazado interno y enlaces externos. 
              <span className="font-semibold text-emerald-600"> Todo automático.</span>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile optimized */}
      <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 z-10">
        <div className="container-custom">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[3rem] p-6 sm:p-10 md:p-12 lg:p-24">
            {/* Background with liquid gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400" />
            
            {/* Decorative blobs - Smaller on mobile */}
            <div className="absolute top-0 left-0 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-white/10 rounded-full blur-2xl sm:blur-3xl" />
            <div className="absolute bottom-0 right-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-orange-300/20 rounded-full blur-2xl sm:blur-3xl" />
            
            <div className="relative z-10 text-center">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6">
                ¿Listo para automatizar
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                <span className="text-white/90">tu contenido?</span>
              </h2>
              
              <p className="text-base sm:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto mb-6 sm:mb-8 lg:mb-10 px-2">
                Únete a más de 500 empresas que generan contenido con Blooglee. 
                Empieza gratis, sin tarjeta.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link 
                  to="/waitlist" 
                  className="group px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-5 rounded-full font-bold text-violet-600 text-base sm:text-lg bg-white hover:bg-white/90 transition-all shadow-2xl flex items-center justify-center gap-2"
                >
                  Empezar gratis ahora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 lg:mt-10 text-white/80 text-sm sm:text-base">
                {[
                  "Sin tarjeta de crédito",
                  "Plan gratis disponible",
                  "Cancela cuando quieras",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
};

export default Landing;
