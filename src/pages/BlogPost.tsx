import { useParams, Link, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { getBlogPost, getRelatedPosts } from '@/data/blogPosts';
import { BlogCard } from '@/components/marketing/BlogCard';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Twitter, Linkedin, Facebook, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead, BlogPostingSchema, BreadcrumbSchema } from '@/components/seo';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;
  const relatedPosts = slug ? getRelatedPosts(slug, 2) : [];

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Enlace copiado al portapapeles');
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(post.title);
  const fullUrl = `https://blooglee.lovable.app/blog/${post.slug}`;

  return (
    <PublicLayout showBlobs={false}>
      <SEOHead 
        title={post.title}
        description={post.excerpt}
        canonicalUrl={`/blog/${post.slug}`}
        ogImage={post.image}
        ogType="article"
        article={{
          publishedTime: post.date,
          author: post.author.name,
          section: post.category,
        }}
      />
      <BlogPostingSchema 
        title={post.title}
        description={post.excerpt}
        image={post.image}
        datePublished={post.date}
        author={{ name: post.author.name, role: post.author.role }}
        url={fullUrl}
      />
      <BreadcrumbSchema 
        items={[
          { name: 'Inicio', url: 'https://blooglee.lovable.app/' },
          { name: 'Blog', url: 'https://blooglee.lovable.app/blog' },
          { name: post.title, url: fullUrl },
        ]}
      />
      <article className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <header className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-600 text-sm font-medium mb-4">
                {post.category}
              </div>
              
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-foreground/60 mb-6">
                <div className="flex items-center gap-3">
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-foreground">{post.author.name}</div>
                    <div className="text-xs">{post.author.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {post.readTime} de lectura
                  </span>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6 sm:p-8 lg:p-10 mb-8">
              <div 
                className="prose prose-violet max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-foreground/70 prose-li:text-foreground/70 prose-a:text-violet-600"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>').replace(/## /g, '<h2>').replace(/### /g, '<h3>').replace(/<h2>/g, '</p><h2>').replace(/<h3>/g, '</p><h3>').replace(/- \*\*/g, '<li><strong>').replace(/\*\*:/g, '</strong>:').replace(/\*\*/g, '</strong>') }}
              />
            </div>

            {/* Share */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-foreground/60" />
                  <span className="font-medium">Comparte este artículo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <a 
                      href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Compartir en Twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a 
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Compartir en LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Compartir en Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-center mb-12">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400" />
              <div className="relative z-10">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
                  ¿Quieres automatizar tu blog?
                </h3>
                <p className="text-white/80 mb-6 max-w-lg mx-auto">
                  Genera artículos profesionales con IA y publícalos directamente en WordPress.
                </p>
                <Button asChild size="lg" className="bg-white text-violet-600 hover:bg-white/90">
                  <Link to="/auth">
                    Prueba Blooglee gratis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-6">Artículos relacionados</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <BlogCard
                      key={relatedPost.slug}
                      slug={relatedPost.slug}
                      title={relatedPost.title}
                      excerpt={relatedPost.excerpt}
                      image={relatedPost.image}
                      date={relatedPost.date}
                      readTime={relatedPost.readTime}
                      category={relatedPost.category}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Table of Contents */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6">
                <h3 className="font-display text-sm font-bold mb-4 text-foreground/60 uppercase tracking-wider">
                  En este artículo
                </h3>
                <nav className="space-y-2">
                  <a href="#" className="block text-sm text-foreground/70 hover:text-foreground transition-colors py-1">
                    Introducción
                  </a>
                  <a href="#" className="block text-sm text-foreground/70 hover:text-foreground transition-colors py-1">
                    Beneficios clave
                  </a>
                  <a href="#" className="block text-sm text-foreground/70 hover:text-foreground transition-colors py-1">
                    Mejores prácticas
                  </a>
                  <a href="#" className="block text-sm text-foreground/70 hover:text-foreground transition-colors py-1">
                    Conclusión
                  </a>
                </nav>
              </div>

              {/* Author Card */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6">
                <h3 className="font-display text-sm font-bold mb-4 text-foreground/60 uppercase tracking-wider">
                  Sobre el autor
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium">{post.author.name}</div>
                    <div className="text-sm text-foreground/60">{post.author.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </PublicLayout>
  );
};

export default BlogPost;
