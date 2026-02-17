import { Helmet } from 'react-helmet-async';

interface SoftwareAppSchemaProps {
  price?: number;
  priceCurrency?: string;
}

export const SoftwareAppSchema = ({ 
  price = 0, 
  priceCurrency = 'EUR' 
}: SoftwareAppSchemaProps) => {
  const softwareData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Blooglee',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Content Management',
    operatingSystem: 'Web Browser',
    description: 'Blooglee es una plataforma SaaS española que genera y publica automáticamente artículos de blog optimizados para SEO en WordPress usando inteligencia artificial (GPT-5, Gemini). Ideal para empresas y agencias de marketing.',
    url: 'https://blooglee.com',
    downloadUrl: 'https://blooglee.com/auth',
    screenshot: 'https://blooglee.com/og-image.png',
    softwareVersion: '2.0',
    datePublished: '2025-01-01',
    inLanguage: ['es', 'ca'],
    isAccessibleForFree: true,
    author: {
      '@type': 'Organization',
      name: 'Blooglee',
      url: 'https://blooglee.com',
      logo: 'https://blooglee.com/favicon.png',
      sameAs: [
        'https://www.instagram.com/blooglee_/',
        'https://linkedin.com/company/blooglee',
        'https://www.facebook.com/blooglee.ia/',
        'https://www.tiktok.com/@blooglee',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'Blooglee',
      url: 'https://blooglee.com',
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '149',
      priceCurrency: 'EUR',
      offerCount: '4',
      offers: [
        {
          '@type': 'Offer',
          name: 'Plan Free',
          price: '0',
          priceCurrency: 'EUR',
          description: '1 sitio, 1 artículo gratis para probar',
        },
        {
          '@type': 'Offer',
          name: 'Plan Starter',
          price: '19',
          priceCurrency: 'EUR',
          description: '1 sitio, 4 artículos/mes',
        },
        {
          '@type': 'Offer',
          name: 'Plan Pro',
          price: '49',
          priceCurrency: 'EUR',
          description: '3 sitios, 30 artículos/mes',
        },
        {
          '@type': 'Offer',
          name: 'Plan Agencia',
          price: '149',
          priceCurrency: 'EUR',
          description: '10 sitios, artículos ilimitados',
        },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Generación de artículos con IA (GPT-5, Google Gemini)',
      'Publicación directa en WordPress con un clic',
      'SEO optimizado automáticamente (títulos, meta, slugs)',
      'Imágenes destacadas incluidas con créditos',
      'Soporte multiidioma: español y catalán',
      'Compatible con Yoast SEO y Polylang',
      'Programación de publicaciones automáticas',
      'Dashboard de gestión de múltiples sitios',
    ],
    requirements: 'WordPress 5.0 o superior con Application Passwords habilitados',
    releaseNotes: 'Versión 2.0 con soporte para GPT-5 y Gemini 2.5',
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(softwareData)}
      </script>
    </Helmet>
  );
};
