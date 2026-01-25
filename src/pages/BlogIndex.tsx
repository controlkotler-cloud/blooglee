import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { BlogCard } from '@/components/marketing/BlogCard';
import { blogPosts } from '@/data/blogPosts';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';

const categories = ['Todos', 'SEO', 'Marketing', 'Tutoriales'];

const BlogIndex = () => {
  return (
    <PublicLayout>
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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    category === 'Todos'
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
              {blogPosts.map((post) => (
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

            {/* Pagination Placeholder */}
            <div className="flex justify-center mt-12">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  <Button size="sm" className="bg-violet-500 hover:bg-violet-600">1</Button>
                  <Button variant="ghost" size="sm">2</Button>
                  <Button variant="ghost" size="sm">3</Button>
                </div>
                <Button variant="outline" size="sm">
                  Siguiente
                </Button>
              </div>
            </div>
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

            {/* Popular Categories */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6">
              <h3 className="font-display text-lg font-bold mb-4">Categorías populares</h3>
              <ul className="space-y-3">
                {[
                  { name: 'SEO', count: 12 },
                  { name: 'Marketing', count: 8 },
                  { name: 'Tutoriales', count: 6 },
                  { name: 'Automatización', count: 4 },
                ].map((cat) => (
                  <li key={cat.name}>
                    <button className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors text-left">
                      <span className="text-foreground/70">{cat.name}</span>
                      <span className="text-sm text-foreground/40">{cat.count}</span>
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
