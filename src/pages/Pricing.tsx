import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, Building2, Users, Rocket, ArrowRight, HelpCircle } from "lucide-react";
import { PublicLayout } from "@/components/marketing/PublicLayout";
import { SEOHead, FAQSchema, ProductSchema } from '@/components/seo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// FAQ data for SEO and AI Overviews
const pricingFaqs = [
  {
    question: '¿Qué incluye el plan gratuito?',
    answer: 'El plan Free te da 1 mes gratis con acceso completo: 1 sitio web, hasta 4 artículos con imagen destacada y SEO optimizado. No requiere tarjeta de crédito.',
  },
  {
    question: '¿Cómo funciona el período de prueba?',
    answer: 'Todos los usuarios empiezan con el plan Free de 1 mes gratis. Durante este período puedes generar hasta 4 artículos. Al finalizar el mes, puedes actualizar al plan que prefieras.',
  },
  {
    question: '¿Puedo actualizar mi plan antes de que termine el mes gratis?',
    answer: 'Sí, si necesitas más artículos o sitios antes de que termine tu mes gratuito, puedes actualizar a Pro o Agencia en cualquier momento.',
  },
  {
    question: '¿Puedo cambiar de plan en cualquier momento?',
    answer: 'Sí, puedes cambiar tu plan en cualquier momento. Si subes de plan, el cambio es inmediato. Si bajas, se aplicará al siguiente ciclo de facturación.',
  },
  {
    question: '¿Hay permanencia o compromiso?',
    answer: 'No, no hay permanencia. Puedes cancelar tu suscripción cuando quieras sin penalizaciones ni cargos adicionales.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express). También aceptamos PayPal y transferencia bancaria para planes anuales.',
  },
  {
    question: '¿Qué pasa si necesito más de 10 sitios?',
    answer: 'El plan Agencia incluye hasta 10 sitios. Si necesitas más, contacta con nuestro equipo en hola@blooglee.com para un plan personalizado.',
  },
  {
    question: '¿Cómo funciona la facturación anual?',
    answer: 'Con la facturación anual ahorras un 20% respecto al pago mensual. Se cobra el importe total del año por adelantado y recibes acceso inmediato a todas las funciones de tu plan.',
  },
  {
    question: '¿Cuánto cuesta un redactor freelance comparado con Blooglee?',
    answer: 'Un redactor freelance cobra entre 30-80€ por artículo de calidad. Con Blooglee Pro (29€/mes en oferta) generas 30 artículos, lo que equivale a menos de 1€/artículo. Ahorro del 97%.',
  },
  {
    question: '¿Emiten facturas con IVA?',
    answer: 'Sí, todas las facturas incluyen IVA (21% para empresas españolas). Para empresas de la UE con NIF intracomunitario válido, el IVA es 0%.',
  },
];

// Datos para ProductSchema
const pricingPlans = [
  { name: 'Free', description: '1 mes gratis, hasta 4 artículos/mes', price: 0, features: ['1 sitio', '4 artículos/mes'] },
  { name: 'Starter', description: '1 sitio, 4 artículos/mes, SEO avanzado', price: 19, features: ['1 sitio', '4 artículos'] },
  { name: 'Pro', description: '3 sitios, 30 artículos/mes, oferta lanzamiento', price: 29, features: ['3 sitios', '30 artículos'] },
  { name: 'Agencia', description: '10 sitios, artículos ilimitados, white-label', price: 149, features: ['10 sitios', 'Ilimitados'] },
];

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Free",
      description: "1 mes gratis de prueba",
      monthlyPrice: 0,
      annualPrice: 0,
      icon: Sparkles,
      features: [
        "1 sitio web",
        "Hasta 4 artículos/mes",
        "Imagen destacada incluida",
        "SEO optimizado",
        "Conexión WordPress",
      ],
      limitations: [],
      cta: "Empezar gratis",
      popular: false,
      color: "from-slate-400 to-slate-500",
      isOffer: false,
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
        "SEO avanzado",
        "Publicación automática",
        "Soporte por email",
      ],
      limitations: [],
      cta: "Comenzar ahora",
      popular: false,
      color: "from-cyan-400 to-blue-500",
      isOffer: false,
    },
    {
      name: "Pro",
      description: "Para empresas en crecimiento",
      monthlyPrice: 29,
      annualPrice: 39,
      originalMonthlyPrice: 49,
      icon: Building2,
      features: [
        "Todo lo de Starter",
        "Hasta 3 sitios web",
        "Hasta 30 artículos/mes",
        "SEO avanzado",
        "Publicación automática",
        "Soporte prioritario",
      ],
      limitations: [],
      cta: "Elegir Pro",
      popular: true,
      color: "from-violet-500 to-fuchsia-500",
      isOffer: true,
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
        "Soporte prioritario",
        "White-label",
      ],
      limitations: [],
      cta: "Contactar ventas",
      popular: false,
      color: "from-orange-400 to-amber-500",
      isOffer: false,
      note: "¿Más de 10 sitios? Contacta ventas",
    },
  ];

  return (
    <PublicLayout>
      <SEOHead 
        title="Precios y Planes"
        description="Planes desde 0€/mes. Genera artículos con IA para tu blog WordPress. Plan Free, Starter (19€) y Pro (49€). Sin permanencia. Empieza gratis hoy."
        canonicalUrl="/pricing"
        keywords="precios Blooglee, planes blog automático, suscripción contenido IA, tarifas WordPress automático"
      />
      <FAQSchema faqs={pricingFaqs} />
      <ProductSchema plans={pricingPlans} />

      {/* Header */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Planes flexibles</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-6">
            <span className="text-aurora">Elige tu plan</span>
            <br />
            <span className="text-foreground">y empieza a publicar</span>
          </h1>

          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="font-semibold text-foreground">1 mes gratis para todos.</span> Sin permanencia. Cancela cuando quieras. 
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

                  {/* Offer badge for Pro */}
                  {plan.isOffer && !isAnnual && (
                    <div className="absolute -top-4 right-4 z-10">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg animate-pulse">
                        🎉 Oferta lanzamiento
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
                      <div className="flex items-baseline gap-2">
                        {/* Show strikethrough price for Pro monthly offer */}
                        {plan.isOffer && !isAnnual && plan.originalMonthlyPrice && (
                          <span className="text-lg line-through text-foreground/40">
                            {plan.originalMonthlyPrice}€
                          </span>
                        )}
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
                      {plan.name === "Free" && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          Sin tarjeta de crédito
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
                    </ul>

                    {/* Note for Agency */}
                    {plan.note && (
                      <p className="text-xs text-foreground/50 text-center mb-4 italic">
                        {plan.note}
                      </p>
                    )}

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

      {/* FAQ Section */}
      <section className="pb-20 sm:pb-32 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
              <HelpCircle className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-medium text-violet-600">Preguntas frecuentes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
              Resolvemos tus dudas
            </h2>
            <p className="text-foreground/70">
              Todo lo que necesitas saber sobre los planes y la facturación
            </p>
          </div>
          
          <div className="glass-card-strong rounded-3xl p-6 sm:p-8">
            <Accordion type="single" collapsible className="space-y-2">
              {pricingFaqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="border-b border-border/50 last:border-0 px-2"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/70 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Custom Plan Section */}
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

    </PublicLayout>
  );
};

export default Pricing;
