import { Link } from "react-router-dom";
import { LucideIcon, ArrowRight, CheckCircle2, Clock, Users, TrendingUp, Star } from "lucide-react";
import { PublicLayout } from "@/components/marketing/PublicLayout";
import { SEOHead, FAQSchema, ReviewSchema } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { LeadMagnetCard } from "@/components/marketing/LeadMagnetCard";
import { LeadMagnetModal } from "@/components/marketing/LeadMagnetModal";
import { useLeadMagnetDownload } from "@/hooks/useLeadMagnetDownload";
import { getLeadMagnetsForSector } from "@/data/leadMagnets";

export interface UseCaseFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface UseCaseFAQ {
  question: string;
  answer: string;
}

export interface UseCaseTestimonial {
  name: string;
  role: string;
  company: string;
  rating: number;
  review: string;
  datePublished?: string;
}

export interface UseCaseStat {
  value: string;
  label: string;
  description: string;
}

export interface UseCaseHero {
  badge: string;
  icon: LucideIcon;
  titleGradient: string; // first part with gradient
  titleRest: string; // second part normal foreground
  subtitle: React.ReactNode;
  gradient: string; // e.g. "from-violet-500 via-fuchsia-500 to-orange-400"
  primaryCta: { label: string; to: string };
  secondaryCta: { label: string; to: string };
}

export interface UseCaseProblemSolution {
  problemTitle: string;
  problems: string[];
  solutionTitle: string;
  solutions: string[];
}

export interface UseCaseSectorChips {
  title: string;
  sectors: string[];
  footer?: string;
}

export interface UseCaseSuccessCase {
  title: string;
  description: string;
  results: string;
}

export interface UseCaseSuccessCases {
  title: string;
  icon: LucideIcon;
  cases: UseCaseSuccessCase[];
}

export interface UseCaseFeaturesGrid {
  title: string;
  features: UseCaseFeature[];
}

export interface UseCaseTestimonialsBlock {
  title: string;
  testimonials: UseCaseTestimonial[];
}

export interface UseCaseFAQsBlock {
  faqs: UseCaseFAQ[];
}

export interface UseCaseLeadMagnets {
  title: string;
  subtitle: string;
}

export interface UseCaseFinalCta {
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonTo: string;
}

export interface UseCasePageProps {
  sector: string;
  seo: { title: string; description: string; canonicalUrl: string; keywords?: string };
  hero: UseCaseHero;
  stats: UseCaseStat[];
  featuresGrid?: UseCaseFeaturesGrid;
  sectorChips?: UseCaseSectorChips;
  successCases?: UseCaseSuccessCases;
  problemSolution: UseCaseProblemSolution;
  testimonialsBlock: UseCaseTestimonialsBlock;
  leadMagnets: UseCaseLeadMagnets;
  faqsBlock: UseCaseFAQsBlock;
  finalCta: UseCaseFinalCta;
  // Order of mid sections after hero (default: featuresGrid, problemSolution, testimonials, leadMagnets, faqs, finalCta)
  sectionsOrder?: Array<
    "featuresGrid" | "sectorChips" | "successCases" | "problemSolution" | "testimonials" | "leadMagnets" | "faqs"
  >;
}

export function UseCasePage(props: UseCasePageProps) {
  const {
    sector,
    seo,
    hero,
    stats,
    featuresGrid,
    sectorChips,
    successCases,
    problemSolution,
    testimonialsBlock,
    leadMagnets,
    faqsBlock,
    finalCta,
    sectionsOrder,
  } = props;

  const { isModalOpen, selectedLeadMagnet, openDownloadModal, closeModal } = useLeadMagnetDownload();
  const sectorLeadMagnets = getLeadMagnetsForSector(sector);

  const HeroIcon = hero.icon;

  // Convert testimonials to schema reviews format
  const schemaReviews = testimonialsBlock.testimonials.map((t) => ({
    author: t.name,
    role: t.role,
    company: t.company,
    rating: t.rating,
    reviewBody: t.review,
    datePublished: t.datePublished ?? "2026-01-15",
  }));

  const order =
    sectionsOrder ?? (["featuresGrid", "problemSolution", "testimonials", "leadMagnets", "faqs"] as const);

  const renderSection = (key: string) => {
    switch (key) {
      case "featuresGrid":
        if (!featuresGrid) return null;
        return (
          <section key="featuresGrid" className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">{featuresGrid.title}</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuresGrid.features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg"
                  >
                    <Icon className="w-10 h-10 text-fuchsia-500 mb-4" />
                    <h3 className="font-display text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-foreground/70">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      case "sectorChips":
        if (!sectorChips) return null;
        return (
          <section key="sectorChips" className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl p-8 sm:p-12 text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-6">{sectorChips.title}</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {sectorChips.sectors.map((s, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
              {sectorChips.footer && <p className="mt-6 text-foreground/70">{sectorChips.footer}</p>}
            </div>
          </section>
        );
      case "successCases":
        if (!successCases) return null;
        const CaseIcon = successCases.icon;
        return (
          <section key="successCases" className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">{successCases.title}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {successCases.cases.map((c, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg"
                >
                  <CaseIcon className="w-10 h-10 text-fuchsia-500 mb-4" />
                  <h3 className="font-display text-lg font-bold mb-2">{c.title}</h3>
                  <p className="text-foreground/70 mb-4">{c.description}</p>
                  <div className="text-sm font-medium text-violet-600 bg-violet-50 rounded-lg px-3 py-2">
                    {c.results}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case "problemSolution":
        return (
          <section key="problemSolution" className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl p-8 sm:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                    {problemSolution.problemTitle}
                  </h2>
                  <ul className="space-y-4">
                    {problemSolution.problems.map((p, i) => {
                      const Icon = [Clock, Users, TrendingUp][i % 3];
                      return (
                        <li key={i} className="flex items-start gap-3">
                          <Icon className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                          <span className="text-foreground/80">{p}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold mb-4 text-violet-600">
                    {problemSolution.solutionTitle}
                  </h3>
                  <ul className="space-y-4">
                    {problemSolution.solutions.map((s, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                        <span className="text-foreground/80">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );
      case "testimonials":
        return (
          <section key="testimonials" className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">{testimonialsBlock.title}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonialsBlock.testimonials.map((review, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-foreground/80 mb-4 italic">"{review.review}"</p>
                  <div>
                    <div className="font-medium">{review.name}</div>
                    <div className="text-sm text-foreground/60">
                      {review.role}, {review.company}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case "leadMagnets":
        return (
          <section key="leadMagnets" className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">{leadMagnets.title}</h2>
              <p className="text-foreground/60">{leadMagnets.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {sectorLeadMagnets.map((leadMagnet) => (
                <LeadMagnetCard
                  key={leadMagnet.id}
                  leadMagnet={leadMagnet}
                  onDownloadClick={openDownloadModal}
                />
              ))}
            </div>
          </section>
        );
      case "faqs":
        return (
          <section key="faqs" className="container mx-auto max-w-7xl px-4 sm:px-6 py-12">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">Preguntas frecuentes</h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqsBlock.faqs.map((faq, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg"
                >
                  <h3 className="font-medium mb-2">{faq.question}</h3>
                  <p className="text-foreground/70">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <PublicLayout>
      <SEOHead
        title={seo.title}
        description={seo.description}
        canonicalUrl={seo.canonicalUrl}
        keywords={seo.keywords}
      />
      <FAQSchema faqs={faqsBlock.faqs} />
      <ReviewSchema reviews={schemaReviews} />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <HeroIcon className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">{hero.badge}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              {hero.titleGradient}
            </span>
            <br />
            <span className="text-foreground">{hero.titleRest}</span>
          </h1>

          <p className="text-lg sm:text-xl text-foreground/60 mb-8 max-w-2xl mx-auto">{hero.subtitle}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              asChild
              size="lg"
              className={`bg-gradient-to-r ${hero.gradient} hover:opacity-90`}
            >
              <Link to={hero.primaryCta.to}>
                {hero.primaryCta.label}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to={hero.secondaryCta.to}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg"
              >
                <div className="font-display text-3xl font-bold text-violet-600 mb-1">{stat.value}</div>
                <div className="font-medium text-foreground">{stat.label}</div>
                <div className="text-sm text-foreground/60">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {order.map((key) => renderSection(key))}

      {/* CTA Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-12 pb-20">
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">{finalCta.title}</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">{finalCta.subtitle}</p>
            <Button asChild size="lg" className="bg-white text-violet-600 hover:bg-white/90">
              <Link to={finalCta.buttonTo}>
                {finalCta.buttonLabel}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <LeadMagnetModal isOpen={isModalOpen} onClose={closeModal} leadMagnet={selectedLeadMagnet} />
    </PublicLayout>
  );
}
