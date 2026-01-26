import { Link } from "react-router-dom";
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { Home, Search, ArrowLeft, BookOpen, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo';

const NotFound = () => {
  const suggestions = [
    { icon: Home, label: 'Página principal', href: '/', description: 'Volver al inicio' },
    { icon: BookOpen, label: 'Blog', href: '/blog', description: 'Lee nuestros artículos' },
    { icon: Search, label: 'Características', href: '/features', description: 'Descubre qué ofrecemos' },
    { icon: HelpCircle, label: 'Contacto', href: '/contact', description: 'Ponte en contacto' },
  ];

  return (
    <PublicLayout showBlobs={false}>
      <SEOHead 
        title="Página no encontrada"
        description="La página que buscas no existe o ha sido movida. Vuelve al inicio de Blooglee."
        noIndex={true}
      />
      
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-24 text-center">
        {/* Error Code */}
        <div className="relative mb-8">
          <span className="font-display text-[120px] sm:text-[180px] lg:text-[220px] font-bold leading-none bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent opacity-20">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl border border-white/50">
              <span className="font-display text-4xl sm:text-5xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
                ¡Ups!
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Página no encontrada
        </h1>
        <p className="text-foreground/60 text-lg mb-10 max-w-lg mx-auto">
          Lo sentimos, la página que buscas no existe o ha sido movida a otra ubicación.
        </p>

        {/* Back Button */}
        <Button 
          asChild 
          size="lg" 
          className="mb-12 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90"
        >
          <Link to="/">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al inicio
          </Link>
        </Button>

        {/* Suggestions */}
        <div className="border-t border-border/50 pt-10">
          <p className="text-sm text-foreground/50 mb-6">O explora estas secciones:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {suggestions.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="group p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mx-auto mb-3 group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20 transition-colors">
                  <item.icon className="w-5 h-5 text-violet-600" />
                </div>
                <div className="font-semibold text-sm text-foreground mb-1">{item.label}</div>
                <div className="text-xs text-foreground/50">{item.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default NotFound;
