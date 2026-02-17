import { useParams, Link, Navigate } from 'react-router-dom';
import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { BlogCard } from '@/components/marketing/BlogCard';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Linkedin, Facebook, Copy, Loader2 } from 'lucide-react';
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

// Parse markdown content with rich formatting support
const parseContent = (content: string): string => {
  let html = content;

  // Convert headers with IDs
  html = html.replace(/^## (.+)$/gm, (_, title) => {
    const id = slugify(title);
    return `<h2 id="${id}" class="scroll-mt-24 font-display text-2xl sm:text-3xl font-bold mt-10 mb-4 text-foreground">${title}</h2>`;
  });
  
  html = html.replace(/^### (.+)$/gm, (_, title) => {
    const id = slugify(title);
    return `<h3 id="${id}" class="scroll-mt-24 font-display text-xl sm:text-2xl font-semibold mt-8 mb-3 text-foreground">${title}</h3>`;
  });

  // Convert key takeaways (💡 **Clave:**)
  html = html.replace(/💡\s*\*\*Clave:\*\*\s*(.+)/g, (_, text) => {
    return `<div class="blooglee-callout my-6 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border-l-4 border-violet-500">
      <div class="flex items-start gap-3">
        <span class="text-2xl">💡</span>
        <p class="text-foreground/80 font-medium m-0"><strong class="text-violet-700">Clave:</strong> ${text.trim()}</p>
      </div>
    </div>`;
  });

  // Convert markdown tables
  html = html.replace(/\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
    const headerCells = header.split('|').filter((c: string) => c.trim());
    const headerHtml = headerCells.map((cell: string) => 
      `<th class="px-4 py-3 text-left text-sm font-semibold text-foreground bg-violet-50">${cell.trim()}</th>`
    ).join('');
    
    const rowLines = rows.trim().split('\n');
    const rowsHtml = rowLines.map((row: string, i: number) => {
      const cells = row.split('|').filter((c: string) => c.trim());
      const cellsHtml = cells.map((cell: string) => 
        `<td class="px-4 py-3 text-sm text-foreground/70 border-t border-violet-100">${cell.trim()}</td>`
      ).join('');
      return `<tr class="${i % 2 === 0 ? 'bg-white' : 'bg-violet-50/30'}">${cellsHtml}</tr>`;
    }).join('');
    
    return `<div class="overflow-x-auto my-6">
      <table class="w-full border-collapse rounded-xl overflow-hidden border border-violet-100">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
  });

  // Convert markdown links - handle internal links specially
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const isInternal = url.startsWith('/');
    const isInstagram = url.includes('instagram.com');
    const linkClass = isInternal 
      ? 'text-violet-600 hover:text-violet-700 underline decoration-violet-300 hover:decoration-violet-500 transition-colors font-medium'
      : 'text-violet-600 hover:text-violet-700 underline decoration-violet-300 hover:decoration-violet-500 transition-colors';
    
    if (isInternal) {
      // For internal links, we'll use a data attribute to handle them
      return `<a href="${url}" class="${linkClass}" data-internal="true">${text}</a>`;
    }
    
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${linkClass}">${text}</a>`;
  });

  // Convert bold text
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
  
  // Convert italic text
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Convert unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 mb-2 text-foreground/70">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    return `<ul class="my-4 space-y-1 list-disc list-inside">${match}</ul>`;
  });

  // Convert ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 mb-2 text-foreground/70">$1</li>');

  // Convert horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-8 border-t border-violet-200" />');

  // Convert paragraphs (lines not already converted)
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return line; // Already HTML
    if (trimmed.startsWith('#')) return line; // Heading (shouldn't happen)
    return `<p class="mb-4 text-foreground/70 leading-relaxed">${line}</p>`;
  }).join('\n');

  // Clean up empty paragraphs
  html = html.replace(/<p class="[^"]*"><\/p>/g, '');
  html = html.replace(/<p class="[^"]*">\s*<\/p>/g, '');

  // Sanitize final HTML to prevent XSS attacks
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h2', 'h3', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'hr', 'nav'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'data-internal'],
  });
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
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 shadow-xl">
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
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: parsedContent }}
                onClick={(e) => {
                  // Handle internal link clicks
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'A' && target.getAttribute('data-internal') === 'true') {
                    e.preventDefault();
                    const href = target.getAttribute('href');
                    if (href) {
                      window.location.href = href;
                    }
                  }
                }}
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
                  {/* Social share removed Twitter */}
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
                  <nav className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {headings.map((heading, index) => (
                      <a
                        key={index}
                        href={`#${heading.id}`}
                        className={`block text-sm text-foreground/70 hover:text-violet-600 transition-colors py-1 ${
                          heading.level === 3 ? 'pl-4 text-xs' : ''
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

              {/* Instagram CTA */}
              <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 rounded-2xl p-6 text-white">
                <h3 className="font-display text-sm font-bold mb-2">Síguenos en Instagram</h3>
                <p className="text-white/80 text-sm mb-4">
                  Más consejos de marketing y contenido cada día.
                </p>
                <Button asChild variant="secondary" size="sm" className="w-full bg-white text-violet-600 hover:bg-white/90">
                  <a 
                    href="https://www.instagram.com/blooglee_" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    @blooglee_
                  </a>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </PublicLayout>
  );
};

export default BlogPost;
