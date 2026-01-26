import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { BlogCard } from '@/components/marketing/BlogCard';
import { blogPosts } from '@/data/blogPosts';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SEOHead } from '@/components/seo';

const categories = ['Todos', 'SEO', 'Marketing', 'Tutoriales'];
const POSTS_PER_PAGE = 4;

const BlogIndex = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter posts by category
  const filteredPosts = useMemo(() => {
    return selectedCategory === 'Todos'
      ? blogPosts
      : blogPosts.filter(post => post.category === selectedCategory);
  }, [selectedCategory]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  // Count posts per category
  const categoryCounts = useMemo(() => {
    return categories.slice(1).reduce((acc, cat) => {
      acc[cat] = blogPosts.filter(p => p.category === cat).length;
      return acc;
    }, {} as Record<string, number>);
  }, []);

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
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-8">
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
                </button>
              ))}
            </div>

            {/* Blog Grid */}
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

            {/* Empty state */}
            {paginatedPosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-foreground/60">No hay artículos en esta categoría.</p>
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
                    Anterior
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
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Newsletter */}
            <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 rounded-2xl p-6 text-white">
              <Mail className="w-8 h-8 mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Newsletter</h3>
              <p className="text-white/80 text-sm mb-4">
                Recibe tips de SEO y marketing de contenidos directamente en tu email.
              </p>
              <div className="space-y-3">
                <Input 
                  placeholder="tu@email.com" 
                  className="bg-white/20 border-white/30 placeholder:text-white/60 text-white"
                />
                <Button className="w-full bg-white text-violet-600 hover:bg-white/90">
                  Suscribirse
                </Button>
              </div>
            </div>

            {/* Popular Categories - Now with real counts */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6">
              <h3 className="font-display text-lg font-bold mb-4">Categorías populares</h3>
              <ul className="space-y-3">
                {categories.slice(1).map((cat) => (
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
                      <span className="text-sm text-foreground/40">{categoryCounts[cat] || 0}</span>
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
