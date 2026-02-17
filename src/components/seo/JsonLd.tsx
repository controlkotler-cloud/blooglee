import { Helmet } from 'react-helmet-async';

interface OrganizationSchemaProps {
  type?: 'Organization' | 'SoftwareApplication';
}

export const OrganizationSchema = ({ type = 'Organization' }: OrganizationSchemaProps) => {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': type,
    name: 'Blooglee',
    url: 'https://blooglee.com',
    logo: 'https://blooglee.com/favicon.png',
    description: 'Plataforma de generación automática de contenido para blogs WordPress con IA',
    sameAs: [
      'https://www.instagram.com/blooglee_',
      'https://linkedin.com/company/blooglee',
      'https://www.facebook.com/blooglee.ia/',
      'https://www.tiktok.com/@blooglee',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Barcelona',
      addressCountry: 'ES',
    },
    ...(type === 'SoftwareApplication' && {
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>
    </Helmet>
  );
};

interface BlogPostingSchemaProps {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  author: {
    name: string;
    role?: string;
  };
  url: string;
}

export const BlogPostingSchema = ({
  title,
  description,
  image,
  datePublished,
  author,
  url,
}: BlogPostingSchemaProps) => {
  const blogPostData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    image: image,
    datePublished: datePublished,
    dateModified: datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.role && { jobTitle: author.role }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Blooglee',
      logo: {
        '@type': 'ImageObject',
        url: 'https://blooglee.com/favicon.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(blogPostData)}
      </script>
    </Helmet>
  );
};

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbData)}
      </script>
    </Helmet>
  );
};

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQItem[];
}

export const FAQSchema = ({ faqs }: FAQSchemaProps) => {
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(faqData)}
      </script>
    </Helmet>
  );
};
