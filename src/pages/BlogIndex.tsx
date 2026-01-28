import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { BlogCard } from '@/components/marketing/BlogCard';
import { AudienceCards } from '@/components/marketing/AudienceCards';
import { NewsletterForm } from '@/components/marketing/NewsletterForm';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useBlogPosts, useBlogCategories, useAudienceCounts } from '@/hooks/useBlogPosts';

const POSTS_PER_PAGE = 4;
const BASE_CATEGORIES = ['Todos', 'SEO', 'Marketing', 'Tutoriales', 'Comparativas', 'Producto', 'Tendencias'];

const BlogIndex = () => {
  const [selectedAudience, setSelectedAudience] = useState('todos');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleAudienceChange = (audience: string) => {
    setSelectedAudience(audience);
    setCurrentPage(1);
  };

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
        description="Aprende sobre SEO, marketing de contenidos y cómo automatizar tu estrategia digital con Blooglee. Artículos y tutoriales."
        canonicalUrl="/blog"
        keywords="blog SEO, marketing contenidos, automatización blog, tutoriales WordPress, estrategia digital"
      />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
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

        {/* Audience Cards (large cards when "todos", compact tabs when specific) */}
        <AudienceCards
          selected={selectedAudience}
          onSelect={handleAudienceChange}
          counts={audienceCounts}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3">
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

            {/* Blog Grid */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {paginatedPosts.map((post) => (
                  <BlogCard
                    key={post.slug}
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    image={post.image}
                    date={post.date}
                    readTime={post.readTime}
                    category={post.category}
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
              <div className="flex justify-center mt-12">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        size="sm"
                        variant={page === currentPage ? 'default' : 'ghost'}
                        className={page === currentPage ? 'bg-violet-500 hover:bg-violet-600' : ''}
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
                    className="gap-1"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Newsletter with audience selection */}
            <NewsletterForm 
              variant="sidebar"
              defaultAudience={selectedAudience === 'todos' ? 'both' : selectedAudience as 'empresas' | 'agencias'}
            />

            {/* Popular Categories */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6">
              <h3 className="font-display text-lg font-bold mb-4">Categorías populares</h3>
              <ul className="space-y-3">
                {Object.entries(categoryCounts).slice(0, 6).map(([cat, count]) => (
                  <li key={cat}>
                    <button 
                      onClick={() => handleCategoryChange(cat)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-colors text-left ${
                        selectedCategory === cat 
                          ? 'bg-violet-100 text-violet-700' 
                          : 'hover:bg-muted/50 text-foreground/70'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-sm text-foreground/40">{count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6">
              <h3 className="font-display text-lg font-bold mb-2">¿Quieres automatizar tu blog?</h3>
              <p className="text-foreground/60 text-sm mb-4">
                Prueba Blooglee gratis y genera artículos profesionales con IA.
              </p>
              <Button asChild className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90">
                <Link to="/auth">
                  Empezar gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
};

export default BlogIndex;
