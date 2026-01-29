import { Helmet } from 'react-helmet-async';

interface Review {
  author: string;
  role?: string;
  company?: string;
  rating: number;
  reviewBody: string;
  datePublished?: string;
}

interface ReviewSchemaProps {
  reviews: Review[];
  itemReviewed?: {
    name: string;
    type?: 'SoftwareApplication' | 'Product' | 'Service';
  };
}

export const ReviewSchema = ({ 
  reviews, 
  itemReviewed = { name: 'Blooglee', type: 'SoftwareApplication' } 
}: ReviewSchemaProps) => {
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const reviewSchemaData = {
    '@context': 'https://schema.org',
    '@type': itemReviewed.type || 'SoftwareApplication',
    name: itemReviewed.name,
    url: 'https://blooglee.com',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      reviewCount: reviews.length.toString(),
      bestRating: '5',
      worstRating: '1',
    },
    review: reviews.map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author,
        ...(review.role && { jobTitle: review.role }),
        ...(review.company && { 
          worksFor: {
            '@type': 'Organization',
            name: review.company,
          }
        }),
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating.toString(),
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: review.reviewBody,
      datePublished: review.datePublished || new Date().toISOString().split('T')[0],
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(reviewSchemaData)}
      </script>
    </Helmet>
  );
};
