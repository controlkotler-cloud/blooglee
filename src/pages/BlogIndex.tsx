import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { BlogCard } from '@/components/marketing/BlogCard';
import { AudienceCards } from '@/components/marketing/AudienceCards';
import { AudienceHeader } from '@/components/marketing/AudienceHeader';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useBlogPosts, useBlogCategories, useAudienceCounts } from '@/hooks/useBlogPosts';

const POSTS_PER_PAGE = 6;
const BASE_CATEGORIES = ['Todos', 'SEO', 'Marketing', 'Tutoriales', 'Comparativas', 'Producto', 'Tendencias'];

const BlogIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const audienceParam = searchParams.get('audiencia');
  
  // Validate audience param - only allow 'empresas' or 'agencias'
  const selectedAudience = audienceParam === 'empresas' || audienceParam === 'agencias' 
    ? audienceParam 
    : 'todos';

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when audience changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAudience]);

  // Fetch posts from database with audience and category filters
  const { data: posts = [], isLoading, error } = useBlogPosts(
    selectedAudience === 'todos' ? undefined : selectedAudience,
    selectedCategory
  );
  const { data: categoryCounts = {} } = useBlogCategories();
  const { data: audienceCounts } = useAudienceCounts();

  // Calculate pagination
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return posts.slice(start, start + POSTS_PER_PAGE);
  }, [posts, currentPage]);

  // Get unique categories from posts
  const categories = useMemo(() => {
    const uniqueCats = new Set(BASE_CATEGORIES);
    Object.keys(categoryCounts).forEach(cat => uniqueCats.add(cat));
    return Array.from(uniqueCats);
  }, [categoryCounts]);

  // No longer needed - navigation via Links


  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PublicLayout>
      <SEOHead 
        title="Blog"
        description="Blog de Blooglee: guías de SEO, marketing de contenidos, automatización y estrategias digitales para empresas y agencias. +60 artículos gratuitos."
        canonicalUrl="/blog"
        keywords="blog SEO, marketing contenidos, automatización blog, tutoriales WordPress, estrategia digital"
      />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        {/* Conditional Header based on audience */}
        {selectedAudience === 'todos' ? (
          <>
            {/* Generic Header */}
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
                <BookOpen className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-violet-600">Blog</span>
              </div>
              
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
                Recursos para{' '}
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
                  crecer online
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-foreground/60">
                Aprende sobre SEO, marketing de contenidos y cómo automatizar tu estrategia digital.
              </p>
            </div>

            {/* Audience Cards - only shown on initial view */}
            <AudienceCards counts={audienceCounts} />
          </>
        ) : (
          /* Contextual Header for specific audience */
          <AudienceHeader audience={selectedAudience} />
        )}

        <div>
            {/* Thematic Category Filters */}
            <div className="mb-6">
              {/* Mobile: Dropdown */}
              <div className="sm:hidden">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-white/50 text-foreground font-medium"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category} {categoryCounts[category] ? `(${categoryCounts[category]})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Tablet/Desktop: Pills */}
              <div className="hidden sm:flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      category === selectedCategory
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                        : 'bg-white/70 text-foreground/70 hover:bg-white hover:text-foreground border border-white/50'
                    }`}
                  >
                    {category}
                    {categoryCounts[category] && (
                      <span className="ml-1.5 text-xs opacity-70">({categoryCounts[category]})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-500">Error al cargar los artículos. Por favor, inténtalo de nuevo.</p>
              </div>
            )}

            {/* Blog Grid - 3 columns on desktop */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedPosts.map((post, index) => (
                  <BlogCard
                    key={post.slug}
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    image={post.image}
                    date={post.date}
                    readTime={post.readTime}
                    category={post.category}
                    priority={currentPage === 1 && index < 2}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && paginatedPosts.length === 0 && (
              <div className="text-center py-12 bg-white/50 rounded-2xl">
                <BookOpen className="w-12 h-12 mx-auto text-foreground/30 mb-4" />
                <p className="text-foreground/60 mb-2">No hay artículos en esta selección.</p>
                <p className="text-sm text-foreground/40">Prueba a cambiar los filtros o vuelve más tarde.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 sm:mt-12">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="gap-1 px-2 sm:px-3"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        size="sm"
                        variant={page === currentPage ? 'default' : 'ghost'}
                        className={`min-w-[32px] px-2 sm:px-3 ${page === currentPage ? 'bg-violet-500 hover:bg-violet-600' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="gap-1 px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* CTA - Full width */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6 sm:p-8 mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold mb-1">¿Quieres automatizar tu blog?</h3>
                <p className="text-foreground/60 text-sm">
                  Prueba Blooglee gratis y genera artículos profesionales con IA.
                </p>
              </div>
              <Button asChild className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90">
                <Link to="/waitlist">
                  Empezar gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default BlogIndex;
