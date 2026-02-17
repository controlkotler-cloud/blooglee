import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  article?: {
    publishedTime?: string;
    author?: string;
    section?: string;
  };
  noIndex?: boolean;
}

const BASE_URL = 'https://blooglee.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'Blooglee';

export const SEOHead = ({
  title,
  description = 'Blooglee genera artículos de blog con IA y los publica en WordPress automáticamente. Prueba gratis. Ideal para empresas y agencias de marketing.',
  keywords = 'blog automático, generación contenido IA, WordPress, marketing contenidos, SEO, artículos automáticos',
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  article,
  noIndex = false,
}: SEOHeadProps) => {
  const location = useLocation();
  
  const fullTitle = title 
    ? `${title} | ${SITE_NAME}` 
    : `${SITE_NAME} - Blog en piloto automático con IA`;
  
  // Use explicit canonicalUrl if provided, otherwise auto-detect from current route
  const fullCanonicalUrl = canonicalUrl 
    ? `${BASE_URL}${canonicalUrl}` 
    : `${BASE_URL}${location.pathname}`;

  return (
    <Helmet>
      {/* Título */}
      <title>{fullTitle}</title>
      
      {/* Meta básicos */}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={fullCanonicalUrl} />
      
      {/* Article specific */}
      {ogType === 'article' && article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.author && (
            <meta property="article:author" content={article.author} />
          )}
          {article.section && (
            <meta property="article:section" content={article.section} />
          )}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* OG extras */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_ES" />
      
      {/* Hreflang */}
      <link rel="alternate" hrefLang="es" href={fullCanonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={fullCanonicalUrl} />
    </Helmet>
  );
};
