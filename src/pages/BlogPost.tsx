import { useParams, Link, Navigate } from 'react-router-dom';
import { useMemo } from 'react';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { BlogCard } from '@/components/marketing/BlogCard';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Twitter, Linkedin, Facebook, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead, BlogPostingSchema, BreadcrumbSchema } from '@/components/seo';
import { useBlogPost, useRelatedPosts } from '@/hooks/useBlogPosts';

// Utility to generate slug from heading text
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Extract headings from markdown content
const extractHeadings = (content: string): { id: string; text: string; level: number }[] => {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = content.split('\n');

  lines.forEach((line) => {
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);

    if (h2Match) {
      const text = h2Match[1].trim();
      headings.push({ id: slugify(text), text, level: 2 });
    } else if (h3Match) {
      const text = h3Match[1].trim();
      headings.push({ id: slugify(text), text, level: 3 });
    }
  });

  return headings;
};

// Parse markdown content with IDs on headings
const parseContent = (content: string): string => {
  return content
    .replace(/^## (.+)$/gm, (_, title) => {
      const id = slugify(title);
      return `<h2 id="${id}" class="scroll-mt-24">${title}</h2>`;
    })
    .replace(/^### (.+)$/gm, (_, title) => {
      const id = slugify(title);
      return `<h3 id="${id}" class="scroll-mt-24">${title}</h3>`;
    })
    .replace(/\n/g, '<br/>')
    .replace(/<h2/g, '</p><h2')
    .replace(/<h3/g, '</p><h3')
    .replace(/- \*\*/g, '<li><strong>')
    .replace(/\*\*:/g, '</strong>:')
    .replace(/\*\*/g, '</strong>');
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Fetch post from database
  const { data: post, isLoading, error } = useBlogPost(slug || '');
  
  // Fetch related posts
  const { data: relatedPosts = [] } = useRelatedPosts(
    slug || '', 
    post?.category || 'SEO', 
    2
  );

  // Extract headings for ToC
  const headings = useMemo(() => {
    return post ? extractHeadings(post.content) : [];
  }, [post]);

  // Parse content with IDs
  const parsedContent = useMemo(() => {
    return post ? parseContent(post.content) : '';
  }, [post]);

  // Loading state
  if (isLoading) {
    return (
      <PublicLayout showBlobs={false}>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </PublicLayout>
    );
  }

  // Error or not found
  if (error || !post) {
    return <Navigate to="/blog" replace />;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Enlace copiado al portapapeles');
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(post.title);
  const fullUrl = `https://blooglee.com/blog/${post.slug}`;

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
          { name: 'Inicio', url: 'https://blooglee.com/' },
          { name: 'Blog', url: 'https://blooglee.com/blog' },
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
                    alt={`Foto de ${post.author.name}`}
                    loading="lazy"
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
                alt={`Imagen destacada: ${post.title}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6 sm:p-8 lg:p-10 mb-8">
              <div 
                className="prose prose-violet max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-foreground/70 prose-li:text-foreground/70 prose-a:text-violet-600"
                dangerouslySetInnerHTML={{ __html: parsedContent }}
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

          {/* Sidebar - Dynamic Table of Contents */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              {/* Table of Contents - Dynamic */}
              {headings.length > 0 && (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6">
                  <h3 className="font-display text-sm font-bold mb-4 text-foreground/60 uppercase tracking-wider">
                    En este artículo
                  </h3>
                  <nav className="space-y-2">
                    {headings.map((heading, index) => (
                      <a
                        key={index}
                        href={`#${heading.id}`}
                        className={`block text-sm text-foreground/70 hover:text-foreground transition-colors py-1 ${
                          heading.level === 3 ? 'pl-4' : ''
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Author Card */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6">
                <h3 className="font-display text-sm font-bold mb-4 text-foreground/60 uppercase tracking-wider">
                  Sobre el autor
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src={post.author.avatar} 
                    alt={`Foto de ${post.author.name}`}
                    loading="lazy"
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
