import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
  category: string;
}

export const BlogCard = ({ slug, title, excerpt, image, date, readTime, category }: BlogCardProps) => {
  return (
    <Link 
      to={`/blog/${slug}`}
      className="group block bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={image} 
          alt={`Imagen destacada del artículo: ${title}`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-white/90 backdrop-blur-sm text-violet-600 border-0 shadow-lg">
            {category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-4 text-sm text-foreground/50 mb-3">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {readTime}
          </span>
        </div>

        <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
          {title}
        </h3>
        
        <p className="text-sm text-foreground/60 line-clamp-2 mb-4">
          {excerpt}
        </p>

        <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 group-hover:gap-3 transition-all">
          Leer más
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
};
