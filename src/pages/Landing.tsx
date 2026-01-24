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
  ChevronRight
} from 'lucide-react';
import { ProductMockup } from '@/components/saas/ProductMockup';

const features = [
  {
    icon: Sparkles,
    title: "Generación con IA",
    description: "Artículos de 2000+ palabras optimizados para SEO, generados en segundos con inteligencia artificial avanzada.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: Globe,
    title: "Publicación automática",
    description: "Conecta tu WordPress y publica directamente. Sin copiar y pegar, sin esfuerzo manual.",
    gradient: "from-secondary to-tertiary",
  },
  {
    icon: Languages,
    title: "Multi-idioma",
    description: "Genera contenido en español, catalán, inglés y más. Expande tu audiencia sin límites.",
    gradient: "from-tertiary to-primary",
  },
  {
    icon: TrendingUp,
    title: "SEO optimizado",
    description: "Meta descripciones, títulos H1/H2, y slugs optimizados automáticamente para posicionar.",
    gradient: "from-primary via-secondary to-tertiary",
  },
  {
    icon: Clock,
    title: "Programación automática",
    description: "Configura y olvídate. Blooglee genera y publica contenido nuevo cada semana.",
    gradient: "from-secondary to-primary",
  },
  {
    icon: FileText,
    title: "Adaptado a tu sector",
    description: "IA entrenada para tu industria: belleza, salud, fitness, gastronomía y más.",
    gradient: "from-tertiary via-primary to-secondary",
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
    <div className="min-h-screen aurora-bg aurora-bg-intense">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="container-custom">
          <div className="glass-card rounded-2xl px-6 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl">Blooglee</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline">
                Características
              </a>
              <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline">
                Testimonios
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline">
                Precios
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link 
                to="/auth" 
                className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link to="/auth" className="btn-aurora py-2.5 px-5 text-sm">
                <span className="flex items-center gap-2">
                  Empezar gratis
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 px-6">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 badge-aurora badge-aurora-glow mb-6 animate-fade-in-up">
                <Zap className="w-4 h-4" />
                <span>Potenciado por IA avanzada</span>
              </div>
              
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 animate-fade-in-up delay-100">
                Tu blog en{' '}
                <span className="text-aurora">piloto automático</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in-up delay-200">
                Genera artículos profesionales con IA, optimizados para SEO, y publícalos automáticamente en tu WordPress. 
                <span className="font-medium text-foreground"> Sin escribir una sola palabra.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10 animate-fade-in-up delay-300">
                <Link to="/auth" className="btn-aurora py-4 px-8 text-base">
                  <span className="flex items-center justify-center gap-2">
                    Empezar gratis
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Link>
                <button className="btn-glass py-4 px-8 text-base flex items-center justify-center gap-2 group">
                  <Play className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  Ver demo
                </button>
              </div>

              {/* Social proof mini */}
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
                      className="w-10 h-10 rounded-full border-2 border-background object-cover"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-warning">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-muted-foreground">+500 empresas confían en nosotros</span>
                </div>
              </div>
            </div>

            {/* Right - Product Mockup */}
            <div className="relative animate-slide-in-right delay-200">
              <ProductMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6 border-y border-border/30">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="font-display text-3xl sm:text-4xl font-bold text-aurora mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 px-6">
        <div className="container-custom">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="badge-aurora inline-flex mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Características</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Todo lo que necesitas para{' '}
              <span className="text-aurora">dominar el SEO</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Automatiza tu estrategia de contenido con herramientas potentes y fáciles de usar.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group glass-card rounded-2xl p-6 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 lg:py-32 px-6 bg-gradient-to-b from-transparent via-muted/30 to-transparent">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="badge-aurora inline-flex mb-4">
              <Zap className="w-4 h-4" />
              <span>Cómo funciona</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              De cero a contenido en{' '}
              <span className="text-aurora">3 simples pasos</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary via-secondary to-tertiary opacity-30" />
            
            {[
              {
                step: "01",
                title: "Conecta tu sitio",
                description: "Añade las credenciales de tu WordPress y elige tu sector. Solo toma 2 minutos.",
                icon: Globe,
              },
              {
                step: "02",
                title: "La IA trabaja",
                description: "Blooglee genera artículos únicos, con imágenes y SEO optimizado automáticamente.",
                icon: Sparkles,
              },
              {
                step: "03",
                title: "Publica y crece",
                description: "Revisa, edita si quieres, y publica. Tu blog crece en piloto automático.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="relative inline-flex mb-6">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <item.icon className="w-12 h-12 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold text-sm shadow-glow">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 lg:py-32 px-6">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="badge-aurora inline-flex mb-4">
              <Star className="w-4 h-4" />
              <span>Testimonios</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Lo que dicen nuestros{' '}
              <span className="text-aurora">clientes felices</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div 
                key={i}
                className="glass-card-strong rounded-2xl p-6 animate-fade-in-up hover-lift"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-warning fill-current" />
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-foreground/90 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 px-6">
        <div className="container-custom">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-secondary to-tertiary p-1">
            <div className="glass-card-strong rounded-[1.35rem] p-8 sm:p-12 lg:p-16 text-center">
              {/* Decorative elements */}
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-8 shadow-glow animate-float">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  ¿Listo para automatizar{' '}
                  <span className="text-aurora">tu contenido?</span>
                </h2>
                
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Únete a más de 500 empresas que ya generan contenido profesional con Blooglee. 
                  Empieza gratis, sin tarjeta de crédito.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/auth" className="btn-aurora py-4 px-10 text-lg">
                    <span className="flex items-center justify-center gap-2">
                      Empezar gratis ahora
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                  {[
                    "Sin tarjeta de crédito",
                    "Plan gratis disponible",
                    "Cancela cuando quieras",
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/30">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg">Blooglee</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
              <a href="mailto:hola@blooglee.com" className="hover:text-foreground transition-colors">Contacto</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2024 Blooglee. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
