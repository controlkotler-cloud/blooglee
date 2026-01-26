import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, Building2, Users, Rocket, ArrowRight, X } from "lucide-react";
import { LiquidBlobs } from "@/components/saas/LiquidBlobs";
import { PublicNavbar } from "@/components/marketing/PublicNavbar";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { SEOHead } from '@/components/seo';
const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Free",
      description: "Prueba Blooglee sin compromiso",
      monthlyPrice: 0,
      annualPrice: 0,
      icon: Sparkles,
      features: [
        "1 sitio web",
        "1 artículo publicado",
        "Imagen destacada incluida",
        "SEO optimizado",
        "Conexión WordPress",
      ],
      limitations: [
        "Solo primer artículo",
      ],
      cta: "Empezar gratis",
      popular: false,
      color: "from-slate-400 to-slate-500",
    },
    {
      name: "Starter",
      description: "Ideal para negocios locales",
      monthlyPrice: 19,
      annualPrice: 15,
      icon: Rocket,
      features: [
        "1 sitio web",
        "Hasta 4 artículos/mes",
        "Imagen destacada incluida",
        "SEO completo",
        "Publicación automática",
        "Soporte por email",
      ],
      limitations: [],
      cta: "Comenzar ahora",
      popular: false,
      color: "from-cyan-400 to-blue-500",
    },
    {
      name: "Pro",
      description: "Para empresas en crecimiento",
      monthlyPrice: 49,
      annualPrice: 39,
      icon: Building2,
      features: [
        "Hasta 3 sitios web",
        "Hasta 30 artículos/mes",
        "Imagen destacada incluida",
        "SEO avanzado",
        "Publicación automática",
        "Soporte prioritario",
        "Estadísticas de rendimiento",
      ],
      limitations: [],
      cta: "Elegir Pro",
      popular: true,
      color: "from-violet-500 to-fuchsia-500",
    },
    {
      name: "Agencia",
      description: "Para agencias de marketing",
      monthlyPrice: 149,
      annualPrice: 119,
      icon: Users,
      features: [
        "Hasta 10 sitios web",
        "Artículos ilimitados",
        "Imagen destacada incluida",
        "SEO avanzado",
        "Publicación automática",
        "Soporte dedicado",
        "API access",
        "White-label disponible",
      ],
      limitations: [],
      cta: "Contactar ventas",
      popular: false,
      color: "from-orange-400 to-amber-500",
    },
  ];

  return (
    <div className="min-h-screen aurora-bg aurora-bg-intense">
      <SEOHead 
        title="Precios y Planes"
        description="Planes flexibles de Blooglee desde 0€/mes. Free, Starter, Pro y Agencia. Sin permanencia, cancela cuando quieras."
        canonicalUrl="/pricing"
        keywords="precios Blooglee, planes blog automático, suscripción contenido IA, tarifas WordPress automático"
      />
      <LiquidBlobs variant="hero" />
      {/* Unified Navigation */}
      <PublicNavbar />

      {/* Header */}
      <section className="pt-28 sm:pt-32 pb-12 sm:pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 badge-aurora badge-aurora-glow mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Planes flexibles</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-6">
            <span className="text-aurora">Elige tu plan</span>
            <br />
            <span className="text-foreground">y empieza a publicar</span>
          </h1>

          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto mb-8 sm:mb-10">
            Sin permanencia. Cancela cuando quieras. 
            <span className="font-semibold text-foreground"> Ahorra un 20% con el plan anual.</span>
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 glass-card rounded-full p-1.5">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                !isAnnual
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                isAnnual
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Anual
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isAnnual ? "bg-white/20" : "bg-green-500/20 text-green-600"
              }`}>
                -20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 sm:pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

              return (
                <div
                  key={plan.name}
                  className={`relative group ${plan.popular ? "lg:-mt-4 lg:mb-4" : ""}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
                        Más popular
                      </div>
                    </div>
                  )}

                  <div
                    className={`h-full glass-card-strong rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:scale-[1.02] ${
                      plan.popular
                        ? "ring-2 ring-violet-500/50 shadow-[0_0_40px_rgba(139,92,246,0.15)]"
                        : ""
                    }`}
                  >
                    {/* Header */}
                    <div className="mb-6">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-display font-bold text-foreground mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-foreground/60">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-display font-bold text-foreground">
                          {price === 0 ? "Gratis" : `${price}€`}
                        </span>
                        {price > 0 && (
                          <span className="text-foreground/50 text-sm">/mes</span>
                        )}
                      </div>
                      {isAnnual && price > 0 && (
                        <p className="text-xs text-foreground/50 mt-1">
                          Facturado anualmente ({price * 12}€/año)
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-foreground/80">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-start gap-3 opacity-50">
                          <div className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-foreground/50" />
                          </div>
                          <span className="text-sm text-foreground/50">{limitation}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      to="/auth"
                      className={`w-full py-3 px-6 rounded-xl font-semibold text-center transition-all duration-300 flex items-center justify-center gap-2 group/btn ${
                        plan.popular
                          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
                          : plan.name === "Free"
                          ? "bg-foreground/5 text-foreground hover:bg-foreground/10"
                          : `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg hover:-translate-y-0.5`
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ or Trust Section */}
      <section className="pb-20 sm:pb-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card-strong rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
              ¿Necesitas un plan personalizado?
            </h2>
            <p className="text-foreground/70 mb-6 max-w-xl mx-auto">
              Si tienes más de 10 sitios o necesitas funcionalidades específicas, 
              contacta con nuestro equipo para un plan a medida.
            </p>
            <a
              href="mailto:hola@blooglee.com"
              className="inline-flex items-center gap-2 btn-glass font-semibold"
            >
              Contactar equipo
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Unified Footer */}
      <PublicFooter />
    </div>
  );
};

export default Pricing;
