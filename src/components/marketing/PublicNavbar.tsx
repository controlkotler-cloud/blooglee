import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';

const navLinks = [
  { label: 'Características', href: '/features' },
  { label: 'Precios', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/contact' },
];

export const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4">
      <div className="container mx-auto max-w-7xl">
        <div className="glass-card-strong rounded-2xl sm:rounded-full px-4 sm:px-6 py-3 flex items-center justify-between shadow-xl">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <BloogleeLogo size="md" />
          </Link>
          
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                to={link.href} 
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop/Tablet - Login link */}
            <Link 
              to="/auth" 
              className="hidden md:block text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Iniciar sesión
            </Link>
            
            {/* Desktop/Tablet CTA - hidden on mobile */}
            <Link 
              to="/auth" 
              className="hidden md:flex relative group px-5 py-2.5 rounded-full font-semibold text-white text-sm overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />
              <span className="relative flex items-center gap-2">
                Empezar gratis
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            
            {/* Mobile menu button - only on mobile */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              aria-label="Menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 glass-card-strong rounded-2xl p-4 shadow-xl animate-fade-in">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors py-2 px-3 rounded-xl hover:bg-muted/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {/* Separator */}
              <div className="border-t border-border/50 my-1" />
              {/* Login link in mobile menu */}
              <Link 
                to="/auth"
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors py-2 px-3 rounded-xl hover:bg-muted/50 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              {/* CTA button in mobile menu */}
              <Link
                to="/auth" 
                className="relative group mt-1 py-3 rounded-xl font-semibold text-white text-sm text-center overflow-hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />
                <span className="relative flex items-center justify-center gap-2">
                  Empezar gratis
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
