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
  Wand2,
  BarChart3,
  Palette
} from 'lucide-react';
import { ProductMockup } from '@/components/saas/ProductMockup';
import { LiquidBlobs } from '@/components/saas/LiquidBlobs';

const features = [
  {
    icon: Sparkles,
    title: "Generación con IA",
    description: "Artículos de 2000+ palabras optimizados para SEO, generados en segundos con inteligencia artificial avanzada.",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: Globe,
    title: "Publicación automática",
    description: "Conecta tu WordPress y publica directamente. Sin copiar y pegar, sin esfuerzo manual.",
    color: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Languages,
    title: "Multi-idioma",
    description: "Genera contenido en español, catalán, inglés y más. Expande tu audiencia sin límites.",
    color: "from-pink-500 to-orange-400",
  },
  {
    icon: TrendingUp,
    title: "SEO optimizado",
    description: "Meta descripciones, títulos H1/H2, y slugs optimizados automáticamente para posicionar.",
    color: "from-orange-400 to-amber-400",
  },
  {
    icon: Clock,
    title: "Programación automática",
    description: "Configura y olvídate. Blooglee genera y publica contenido nuevo cada semana.",
    color: "from-amber-400 to-yellow-400",
  },
  {
    icon: Palette,
    title: "Adaptado a tu sector",
    description: "IA entrenada para tu industria: belleza, salud, fitness, gastronomía y más.",
    color: "from-cyan-400 to-violet-500",
  },
];

const testimonials = [
  {
    name: "María García",
    role: "Directora de Marketing",
    company: "Clínica Estética Luna",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    quote: "Blooglee ha transformado nuestra estrategia de contenido. Pasamos de publicar 1 artículo al mes a 4 por semana. Nuestro tráfico orgánico creció un 340%.",
    rating: 5,
  },
  {
    name: "Carlos Rodríguez",
    role: "CEO",
    company: "FitLife Studios",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    quote: "La calidad del contenido generado es impresionante. Mis clientes piensan que tengo un equipo de redactores. Lo recomiendo 100%.",
    rating: 5,
  },
  {
    name: "Ana Martínez",
    role: "Propietaria",
    company: "Salón Belle",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    quote: "Como dueña de un salón de belleza, no tenía tiempo para el blog. Ahora tengo contenido profesional cada semana sin hacer nada.",
    rating: 5,
  },
];

const stats = [
  { value: "10K+", label: "Artículos generados" },
  { value: "500+", label: "Empresas activas" },
  { value: "98%", label: "Satisfacción" },
  { value: "4.9★", label: "Valoración" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50/50 to-orange-50/30 overflow-hidden">
      {/* LIQUID BLOBS BACKGROUND */}
      <LiquidBlobs variant="hero" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="container-custom">
          <div className="glass-card-strong rounded-full px-6 py-3 flex items-center justify-between shadow-xl">
            <Link to="/" className="flex items-center gap-3 group">
              {/* Logo Blooglee con estilo líquido */}
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow duration-300">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              </div>
              <span className="font-display font-bold text-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 bg-clip-text text-transparent">
                Blooglee
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
                Características
              </a>
              <a href="#testimonials" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
                Testimonios
              </a>
              <a href="#pricing" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
                Precios
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link 
                to="/auth" 
                className="hidden sm:block text-sm font-medium text-foreground/70 hover:text-foreground transition-colors px-4 py-2"
              >
                Iniciar sesión
              </Link>
              <Link 
                to="/auth" 
                className="relative group px-6 py-2.5 rounded-full font-semibold text-white text-sm overflow-hidden"
              >
                {/* Button gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-fuchsia-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative flex items-center gap-2">
                  Empezar gratis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 lg:pt-44 lg:pb-36 px-6">
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg shadow-violet-500/10 mb-8 animate-fade-in-up">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" />
                <span className="text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Potenciado por IA avanzada
                </span>
              </div>
              
              {/* Main heading with liquid gradient text */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] mb-8 animate-fade-in-up delay-100">
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
              
              <p className="text-lg sm:text-xl text-foreground/70 mb-10 max-w-lg mx-auto lg:mx-0 animate-fade-in-up delay-200">
                Genera artículos profesionales con IA, optimizados para SEO, y publícalos automáticamente en tu WordPress. 
                <span className="font-semibold text-foreground"> Sin escribir una sola palabra.</span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12 animate-fade-in-up delay-300">
                <Link 
                  to="/auth" 
                  className="group relative px-8 py-4 rounded-full font-semibold text-white text-lg overflow-hidden shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-fuchsia-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                  <span className="relative flex items-center justify-center gap-2">
                    Empezar gratis
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <button className="group px-8 py-4 rounded-full font-semibold text-foreground bg-white/80 backdrop-blur-sm border border-violet-200/50 hover:bg-white hover:border-violet-300 transition-all shadow-lg flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 text-violet-500 group-hover:scale-110 transition-transform" />
                  Ver demo
                </button>
              </div>

              {/* Social proof */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-in-up delay-400">
                <div className="flex -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-10 h-10 rounded-full border-3 border-white object-cover shadow-md"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-foreground/60">+500 empresas confían en nosotros</span>
                </div>
              </div>
            </div>

            {/* Right - Product Mockup */}
            <div className="relative animate-slide-in-right delay-200">
              {/* Glow behind mockup */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-orange-400/20 blur-3xl rounded-full scale-110" />
              <ProductMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Floating cards */}
      <section className="relative py-16 px-6 z-10">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="group relative p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Gradient border on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity p-[1px]">
                  <div className="w-full h-full rounded-3xl bg-white" />
                </div>
                <div className="relative text-center">
                  <div className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-foreground/60 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 lg:py-32 px-6 z-10">
        <div className="container-custom">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
              <BarChart3 className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-medium text-violet-600">Características</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Todo lo que necesitas para{' '}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
                dominar el SEO
              </span>
            </h2>
            <p className="text-lg text-foreground/60">
              Automatiza tu estrategia de contenido con herramientas potentes y fáciles de usar.
            </p>
          </div>

          {/* Features grid - Bento style */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group relative p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Gradient blob on hover */}
                <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl`} />
                
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-foreground/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="relative py-24 lg:py-32 px-6 z-10">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-fuchsia-200/50 shadow-lg mb-6">
              <Zap className="w-4 h-4 text-fuchsia-500" />
              <span className="text-sm font-medium text-fuchsia-600">Cómo funciona</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              De cero a contenido en{' '}
              <span className="bg-gradient-to-r from-fuchsia-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                3 simples pasos
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-1 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 rounded-full opacity-30" />
            
            {[
              {
                step: "01",
                title: "Conecta tu sitio",
                description: "Añade las credenciales de tu WordPress y elige tu sector. Solo toma 2 minutos.",
                icon: Globe,
                color: "from-violet-500 to-fuchsia-500",
              },
              {
                step: "02",
                title: "La IA trabaja",
                description: "Blooglee genera artículos únicos, con imágenes y SEO optimizado automáticamente.",
                icon: Sparkles,
                color: "from-fuchsia-500 to-orange-400",
              },
              {
                step: "03",
                title: "Publica y crece",
                description: "Revisa, edita si quieres, y publica. Tu blog crece en piloto automático.",
                icon: TrendingUp,
                color: "from-orange-400 to-amber-400",
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="relative inline-flex mb-8">
                  {/* Main icon container */}
                  <div className={`w-36 h-36 rounded-[2.5rem] bg-gradient-to-br ${item.color} flex items-center justify-center shadow-2xl shadow-violet-500/20`}>
                    <item.icon className="w-16 h-16 text-white" />
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-3 -right-3 w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center font-display font-bold text-lg bg-gradient-to-br from-foreground to-foreground/80 text-transparent bg-clip-text border border-gray-100">
                    {item.step}
                  </div>
                  {/* Glow */}
                  <div className={`absolute inset-0 rounded-[2.5rem] bg-gradient-to-br ${item.color} blur-2xl opacity-30`} />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-foreground/60 max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 lg:py-32 px-6 z-10">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-orange-200/50 shadow-lg mb-6">
              <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span className="text-sm font-medium text-orange-600">Testimonios</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Lo que dicen nuestros{' '}
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                clientes felices
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div 
                key={i}
                className="group relative p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Rating */}
                <div className="flex gap-1 mb-5">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-foreground/80 mb-8 leading-relaxed text-lg">
                  "{testimonial.quote}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                  />
                  <div>
                    <div className="font-display font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-foreground/60">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Liquid style */}
      <section className="relative py-24 lg:py-32 px-6 z-10">
        <div className="container-custom">
          <div className="relative overflow-hidden rounded-[3rem] p-12 sm:p-16 lg:p-24">
            {/* Background with liquid gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400" />
            
            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-400/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 text-center">
              {/* Floating logo */}
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm mb-10 shadow-2xl animate-float">
                <Wand2 className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                ¿Listo para automatizar
                <br />
                <span className="text-white/90">tu contenido?</span>
              </h2>
              
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
                Únete a más de 500 empresas que ya generan contenido profesional con Blooglee. 
                Empieza gratis, sin tarjeta de crédito.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/auth" 
                  className="group px-10 py-5 rounded-full font-bold text-violet-600 text-lg bg-white hover:bg-white/90 transition-all shadow-2xl flex items-center justify-center gap-2"
                >
                  Empezar gratis ahora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 mt-10 text-white/80">
                {[
                  "Sin tarjeta de crédito",
                  "Plan gratis disponible",
                  "Cancela cuando quieras",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 z-10">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center shadow-lg">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 bg-clip-text text-transparent">
                Blooglee
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-foreground/60">
              <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
              <a href="mailto:hola@blooglee.com" className="hover:text-foreground transition-colors">Contacto</a>
            </div>
            
            <p className="text-sm text-foreground/50">
              © 2024 Blooglee. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
