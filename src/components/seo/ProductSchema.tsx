import { Helmet } from 'react-helmet-async';

interface PricingPlan {
  name: string;
  description: string;
  price: number;
  currency?: string;
  billingPeriod?: 'month' | 'year';
  features: string[];
}

interface ProductSchemaProps {
  plans: PricingPlan[];
}

export const ProductSchema = ({ plans }: ProductSchemaProps) => {
  const offers = plans.map((plan) => ({
    '@type': 'Offer',
    name: plan.name,
    description: plan.description,
    price: plan.price,
    priceCurrency: plan.currency || 'EUR',
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    availability: 'https://schema.org/InStock',
    ...(plan.billingPeriod && {
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: plan.price,
        priceCurrency: plan.currency || 'EUR',
        unitCode: plan.billingPeriod === 'month' ? 'MON' : 'ANN',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: 1,
          unitCode: plan.billingPeriod === 'month' ? 'MON' : 'ANN',
        },
      },
    }),
  }));

  const productData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Blooglee',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Plataforma SaaS de generación automática de contenido para blogs WordPress con inteligencia artificial. Genera y publica artículos optimizados para SEO automáticamente.',
    url: 'https://blooglee.com',
    author: {
      '@type': 'Organization',
      name: 'Blooglee',
      url: 'https://blooglee.com',
    },
    offers: offers,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Generación de contenido con IA (GPT-5, Gemini)',
      'Publicación directa en WordPress',
      'Optimización SEO automática',
      'Imágenes destacadas incluidas',
      'Soporte multiidioma (español, catalán)',
      'Integración con Yoast SEO y Polylang',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(productData)}
      </script>
    </Helmet>
  );
};
