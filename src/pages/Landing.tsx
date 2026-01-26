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
import { LiquidBlobs } from '@/components/saas/LiquidBlobs';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { SEOHead } from '@/components/seo';
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

const testimonials = [
  {
    name: "María García",
    role: "Directora de Marketing",
    company: "Clínica Estética Luna",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    quote: "Blooglee ha transformado nuestra estrategia de contenido. Nuestro tráfico orgánico creció un 340%.",
    rating: 5,
  },
  {
    name: "Carlos Rodríguez",
    role: "CEO",
    company: "FitLife Studios",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    quote: "La calidad del contenido es impresionante. Mis clientes piensan que tengo un equipo de redactores.",
    rating: 5,
  },
  {
    name: "Ana Martínez",
    role: "Propietaria",
    company: "Salón Belle",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    quote: "Como dueña de un salón, no tenía tiempo para el blog. Ahora tengo contenido profesional cada semana.",
    rating: 5,
  },
];

const stats = [
  { value: "10K+", label: "Artículos" },
  { value: "500+", label: "Empresas" },
  { value: "98%", label: "Satisfacción" },
  { value: "4.9★", label: "Valoración" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50/50 to-orange-50/30 overflow-hidden">
      <SEOHead 
        canonicalUrl="/"
        description="Genera y publica artículos para tu blog WordPress automáticamente con IA. Ideal para empresas y agencias de marketing. Prueba gratis."
        keywords="blog automático, generación contenido IA, WordPress, marketing contenidos, SEO, artículos automáticos, Blooglee"
      />
      {/* LIQUID BLOBS BACKGROUND */}
      <LiquidBlobs variant="hero" />

      {/* Unified Navigation */}
      <PublicNavbar />

      {/* Hero Section - Mobile First */}
      <section className="relative pt-28 pb-12 sm:pt-32 sm:pb-16 lg:pt-44 lg:pb-24 px-4 sm:px-6">
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
                  to="/auth" 
                  className="group relative px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-white text-base sm:text-lg overflow-hidden shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-fuchsia-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative flex items-center justify-center gap-2">
                    Prueba gratis · 1 sitio + 1 post
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <button className="group px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-foreground bg-white/80 backdrop-blur-sm border border-violet-200/50 hover:bg-white hover:border-violet-300 transition-all shadow-lg flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 text-violet-500 group-hover:scale-110 transition-transform" />
                  Ver demo
                </button>
              </div>

              {/* Social proof - Simplified on mobile */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start">
              <div className="flex -space-x-2 sm:-space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="Usuario de Blooglee"
                      loading="lazy"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 sm:border-3 border-white object-cover shadow-md"
                    />
                  ))}
                </div>
                <div className="text-sm text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-foreground/60 text-xs sm:text-sm">+500 empresas confían en nosotros</span>
                </div>
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

      {/* Testimonials Section - Horizontal scroll on mobile */}
      <section id="testimonials" className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 z-10">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border border-orange-200/50 shadow-lg mb-4 sm:mb-6">
              <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span className="text-xs sm:text-sm font-medium text-orange-600">Testimonios</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Lo que dicen nuestros{' '}
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                clientes
              </span>
            </h2>
          </div>

          {/* Horizontal scroll on mobile, grid on larger screens */}
          <div className="flex overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory">
            {testimonials.map((testimonial, i) => (
              <div 
                key={i}
                className="flex-shrink-0 w-[85vw] sm:w-auto snap-center group relative p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2"
              >
                {/* Rating */}
                <div className="flex gap-1 mb-3 sm:mb-5">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-foreground/80 mb-5 sm:mb-8 leading-relaxed text-base sm:text-lg">
                  "{testimonial.quote}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl object-cover shadow-lg"
                  />
                  <div>
                    <div className="font-display font-bold text-sm sm:text-base text-foreground">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-foreground/60">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                  to="/auth" 
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

      {/* Unified Footer */}
      <PublicFooter />
    </div>
  );
};

export default Landing;
