import { Link } from 'react-router-dom';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { Mail, Twitter, Linkedin, Instagram } from 'lucide-react';

const footerLinks = {
  producto: [
    { label: 'Características', href: '/features' },
    { label: 'Precios', href: '/pricing' },
    { label: 'Blog', href: '/blog' },
  ],
  recursos: [
    { label: 'Ayuda', href: '/help' },
    { label: 'Contacto', href: '/contact' },
  ],
  legal: [
    { label: 'Términos', href: '/terms' },
    { label: 'Privacidad', href: '/privacy' },
    { label: 'Cookies', href: '/cookies' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

export const PublicFooter = () => {
  return (
    <footer className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 z-10 bg-white/50 backdrop-blur-sm border-t border-violet-100/50">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            <BloogleeLogo size="md" className="mb-4" />
            <p className="text-sm text-foreground/60 max-w-xs mb-6">
              Automatiza tu blog con IA. Genera contenido profesional para WordPress en piloto automático.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a 
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 text-foreground/60" />
                </a>
              ))}
            </div>
          </div>

          {/* Producto */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Producto</h4>
            <ul className="space-y-3">
              {footerLinks.producto.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Recursos</h4>
            <ul className="space-y-3">
              {footerLinks.recursos.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-violet-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-foreground/50 text-center sm:text-left">
            © {new Date().getFullYear()} Blooglee. Todos los derechos reservados.
          </p>
          <a 
            href="mailto:info@blooglee.com"
            className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <Mail className="w-4 h-4" />
            info@blooglee.com
          </a>
        </div>
      </div>
    </footer>
  );
};
