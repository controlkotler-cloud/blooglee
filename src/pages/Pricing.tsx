import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Sparkles, Building2, Users, Rocket, ArrowRight, HelpCircle, ChevronDown } from "lucide-react";
import { PublicLayout } from "@/components/marketing/PublicLayout";
import { SEOHead, FAQSchema, ProductSchema } from "@/components/seo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// FAQ data
const pricingFaqs = [
  {
    question: "¿Puedo cambiar de plan en cualquier momento?",
    answer: "Sí, puedes subir o bajar de plan cuando quieras. El cambio se aplica inmediatamente y se prorratea.",
  },
  {
    question: "¿Qué pasa cuando uso mi artículo de prueba en Free?",
    answer:
      "Puedes ver cómo queda publicado en tu blog. Para seguir generando artículos automáticamente, pasa a Starter.",
  },
  {
    question: "¿Puedo añadir más sitios en el plan Pro?",
    answer:
      "Sí, puedes añadir sitios adicionales por 6€/mes cada uno, hasta un máximo de 15 sitios. Si necesitas más, el plan Agency incluye 25 sitios.",
  },
  {
    question: "¿Hay permanencia?",
    answer: "No, puedes cancelar cuando quieras sin compromiso. Tu plan sigue activo hasta fin del periodo pagado.",
  },
  {
    question: "¿Los artículos son míos?",
    answer: "Sí, el contenido generado es 100% tuyo. Blooglee no aparece en ningún sitio en tus artículos publicados.",
  },
  {
    question: "¿Qué frecuencias de publicación hay?",
    answer:
      "Semanal (4 artículos/mes), quincenal (2/mes) y mensual (1/mes) en todos los planes de pago. A partir de Pro también puedes publicar a diario.",
  },
  {
    question: "¿El plan Agency incluye members del equipo?",
    answer: "Sí. Agency incluye 5 members para gestionar la cuenta. Podrás ampliar members con add-ons próximamente.",
  },
];

// ProductSchema data
const pricingPlans = [
  {
    name: "Free",
    description: "1 artículo de prueba para ver cómo queda",
    price: 0,
    features: ["1 sitio", "1 artículo de prueba"],
  },
  {
    name: "Starter",
    description: "1 sitio, hasta 4 artículos/mes, publicación automática",
    price: 19,
    features: ["1 sitio", "4 artículos/mes"],
  },
  {
    name: "Pro",
    description: "5 sitios, hasta 46 artículos/mes, contenido premium",
    price: 39,
    features: ["5 sitios", "46 artículos/mes"],
  },
  {
    name: "Agency",
    description: "25 sitios, artículos ilimitados y 5 members para agencias",
    price: 99,
    features: ["25 sitios", "Ilimitados", "5 members"],
  },
];

const plans = [
  {
    name: "Free",
    tagline: "Prueba cómo queda un artículo en tu blog",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Sparkles,
    features: [
      "1 sitio web",
      "1 artículo de prueba (único)",
      "Artículo de hasta 800 palabras",
      "SEO optimizado",
      "Imagen destacada con IA + paleta personalizada",
      "Conexión con WordPress",
      "Publicación manual",
    ],
    excluded: [
      "Perfil de contenido avanzado",
      "Publicación automática",
      "Programación de publicaciones",
      "Artículos adicionales",
      "Notificaciones por email",
      "Soporte dedicado",
    ],
    cta: "Empezar gratis",
    ctaLink: "/waitlist",
    popular: false,
    color: "from-slate-400 to-slate-500",
    note: "Sin tarjeta de crédito · Genera tu primer artículo gratis",
  },
  {
    name: "Starter",
    tagline: "Tu blog en piloto automático",
    monthlyPrice: 19,
    annualPrice: 16,
    annualTotal: 192,
    icon: Rocket,
    features: [
      "1 sitio web",
      "Hasta 4 artículos/mes",
      "Artículos de hasta 1.500 palabras",
      "SEO optimizado",
      "Imagen destacada con IA + paleta editable",
      "Perfil de contenido avanzado",
      "Publicación automática en WordPress",
      "Programación: semanal, quincenal o mensual",
      "Idiomas: castellano y catalán",
      "Notificaciones por email",
      "Soporte por email (<24h, L-V 9-20h)",
    ],
    excluded: ["Más de 1 sitio web", "Artículos de 2.500 palabras", "Publicación diaria", "Soporte prioritario"],
    cta: "Elegir Starter",
    ctaLink: "/waitlist",
    popular: false,
    color: "from-cyan-400 to-blue-500",
  },
  {
    name: "Pro",
    tagline: "Para negocios con varias webs o contenido premium",
    monthlyPrice: 39,
    annualPrice: 33,
    annualTotal: 396,
    icon: Building2,
    features: [
      "Todo lo de Starter +",
      "Hasta 5 sitios web",
      "Hasta 46 artículos/mes",
      "Artículos de hasta 2.500 palabras",
      "Publicación diaria disponible",
      "Soporte prioritario (<8h, L-V 9-20h)",
      "Sitios adicionales: +6€/mes (hasta 15)",
    ],
    excluded: ["Más de 15 sitios", "Artículos ilimitados", "Soporte preferente"],
    cta: "Elegir Pro",
    ctaLink: "/waitlist",
    popular: true,
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    name: "Agency",
    tagline: "Para agencias que gestionan blogs de sus clientes",
    monthlyPrice: 99,
    annualPrice: 83,
    annualTotal: 996,
    icon: Users,
    features: [
      "Todo lo de Pro +",
      "Hasta 25 sitios web",
      "Artículos ilimitados",
      "Hasta 5 members de equipo incluidos",
      "Invitación y gestión de members por email",
      "Soporte preferente (<4h, L-V 9-20h)",
    ],
    excluded: [],
    cta: "Elegir Agency",
    ctaLink: "/waitlist",
    popular: false,
    color: "from-orange-400 to-amber-500",
    footerNote: "¿Necesitas más de 25 sitios? Escríbenos a hola@blooglee.com",
  },
];

// Comparison table data
const comparisonRows = [
  { label: "Sitios web", free: "1", starter: "1", pro: "5 (+extra a 6€)", agency: "25" },
  { label: "Artículos", free: "1 total", starter: "Hasta 4/mes", pro: "Hasta 46/mes", agency: "Ilimitados" },
  { label: "Palabras por artículo", free: "800", starter: "1.500", pro: "2.500", agency: "2.500" },
  { label: "Members de equipo", free: "0", starter: "0", pro: "0", agency: "5" },
  { label: "Gestión de members por email", free: false, starter: false, pro: false, agency: true },
  { label: "Publicación automática", free: false, starter: true, pro: true, agency: true },
  { label: "Frecuencia", free: "—", starter: "Semanal / quincenal / mensual", pro: "+ Diaria", agency: "+ Diaria" },
  { label: "SEO optimizado", free: true, starter: true, pro: true, agency: true },
  { label: "Imagen destacada con IA", free: true, starter: true, pro: true, agency: true },
  { label: "Paleta personalizada", free: "Automática", starter: "Editable", pro: "Editable", agency: "Editable" },
  { label: "Perfil avanzado (mood, tono…)", free: false, starter: true, pro: true, agency: true },
  { label: "Idiomas (ES, CA)", free: true, starter: true, pro: true, agency: true },
  { label: "Notificaciones email", free: false, starter: true, pro: true, agency: true },
  { label: "Soporte email (L-V 9-20h)", free: "—", starter: "<24h", pro: "<8h prioritario", agency: "<4h preferente" },
];

const ComparisonCell = ({ value }: { value: boolean | string }) => {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
    ) : (
      <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
    );
  }
  return <span className="text-sm">{value}</span>;
};

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  return (
    <PublicLayout>
      <SEOHead
        title="Precios y Planes"
        description="Planes desde 0€/mes. Genera artículos con IA para tu blog WordPress. Plan Free, Starter (19€), Pro (39€) y Agency (99€). Sin permanencia."
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
            <span className="text-aurora">Elige tu plan y empieza a publicar</span>
          </h1>

          <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto mb-8 sm:mb-10">
            Sin permanencia. Cancela cuando quieras.
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
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isAnnual ? "bg-white/20" : "bg-green-500/20 text-green-600"
                }`}
              >
                2 meses gratis
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 sm:pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              const annualSavings =
                isAnnual && plan.monthlyPrice > 0 ? plan.monthlyPrice * 12 - (plan.annualTotal ?? 0) : 0;

              return (
                <div
                  key={plan.name}
                  className={`relative group ${plan.popular ? "lg:-mt-4 lg:mb-4" : ""}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
                        Más popular
                      </div>
                    </div>
                  )}

                  <div
                    className={cn(
                      "h-full glass-card-strong rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:scale-[1.02] flex flex-col",
                      plan.popular && "ring-2 ring-violet-500/50 shadow-[0_0_40px_rgba(139,92,246,0.15)]",
                    )}
                  >
                    {/* Header */}
                    <div className="mb-6">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-display font-bold text-foreground mb-1">{plan.name}</h3>
                      <p className="text-sm text-foreground/60 italic">{plan.tagline}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-display font-bold text-foreground">
                          {price === 0 ? "Gratis" : `${price}€`}
                        </span>
                        {price > 0 && <span className="text-foreground/50 text-sm">/mes</span>}
                      </div>
                      {isAnnual && plan.annualTotal && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-foreground/50">Facturado anualmente: {plan.annualTotal}€/año</p>
                          {annualSavings > 0 && (
                            <Badge
                              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]"
                              variant="outline"
                            >
                              Ahorra {annualSavings}€/año
                            </Badge>
                          )}
                        </div>
                      )}
                      {plan.name === "Free" && (
                        <p className="text-xs text-green-600 font-medium mt-1">Sin tarjeta de crédito</p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-4 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-foreground/80">{feature}</span>
                        </li>
                      ))}
                      {plan.excluded.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-muted-foreground/50" />
                          </div>
                          <span className="text-sm text-muted-foreground/60">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Note */}
                    {plan.note && <p className="text-xs text-foreground/50 text-center mb-3">{plan.note}</p>}

                    {/* CTA */}
                    <Link
                      to={plan.ctaLink}
                      className={cn(
                        "w-full py-3 px-6 rounded-xl font-semibold text-center transition-all duration-300 flex items-center justify-center gap-2 group/btn mt-auto",
                        plan.popular
                          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
                          : plan.name === "Free"
                            ? "bg-foreground/5 text-foreground hover:bg-foreground/10"
                            : `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg hover:-translate-y-0.5`,
                      )}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>

                    {/* Footer note */}
                    {plan.footerNote && (
                      <p className="text-xs text-foreground/50 text-center mt-3 italic">{plan.footerNote}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="pb-16 sm:pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-center gap-2 text-foreground/70 hover:text-foreground font-medium transition-colors mb-6"
          >
            <span>Comparar planes en detalle</span>
            <ChevronDown className={cn("w-5 h-5 transition-transform", showComparison && "rotate-180")} />
          </button>

          {showComparison && (
            <div className="glass-card-strong rounded-3xl overflow-hidden">
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-4 font-medium text-foreground/60">Feature</th>
                      <th className="text-center p-4 font-semibold">Free</th>
                      <th className="text-center p-4 font-semibold">Starter</th>
                      <th className="text-center p-4 font-semibold text-violet-600">Pro</th>
                      <th className="text-center p-4 font-semibold">Agency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr key={i} className={cn("border-b border-border/30", i % 2 === 0 && "bg-muted/20")}>
                        <td className="p-4 font-medium text-foreground/80">{row.label}</td>
                        <td className="p-4 text-center">
                          <ComparisonCell value={row.free} />
                        </td>
                        <td className="p-4 text-center">
                          <ComparisonCell value={row.starter} />
                        </td>
                        <td className="p-4 text-center bg-violet-500/5">
                          <ComparisonCell value={row.pro} />
                        </td>
                        <td className="p-4 text-center">
                          <ComparisonCell value={row.agency} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile comparison: stacked cards */}
              <div className="sm:hidden p-4 space-y-4">
                {comparisonRows.map((row, i) => (
                  <div key={i} className="border-b border-border/30 pb-3">
                    <p className="font-medium text-foreground/80 mb-2">{row.label}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Free:</span>
                        <ComparisonCell value={row.free} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Starter:</span>
                        <ComparisonCell value={row.starter} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-violet-600 font-medium">Pro:</span>
                        <ComparisonCell value={row.pro} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Agency:</span>
                        <ComparisonCell value={row.agency} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">Resolvemos tus dudas</h2>
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
                  <AccordionContent className="text-foreground/70 pb-4">{faq.answer}</AccordionContent>
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
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">¿Necesitas un plan personalizado?</h2>
            <p className="text-foreground/70 mb-6 max-w-xl mx-auto">
              Si tienes más de 25 sitios o necesitas funcionalidades específicas, contacta con nuestro equipo para un
              plan a medida.
            </p>
            <a href="mailto:hola@blooglee.com" className="inline-flex items-center gap-2 btn-glass font-semibold">
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
