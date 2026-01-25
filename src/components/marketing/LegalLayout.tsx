import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import { FileText, Shield, Cookie } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

const legalPages = [
  { href: '/terms', label: 'Términos y Condiciones', icon: FileText },
  { href: '/privacy', label: 'Política de Privacidad', icon: Shield },
  { href: '/cookies', label: 'Política de Cookies', icon: Cookie },
];

export const LegalLayout = ({ title, lastUpdated, children }: LegalLayoutProps) => {
  const location = useLocation();

  return (
    <PublicLayout showBlobs={false}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-2">
              <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-4">
                Documentos legales
              </h3>
              {legalPages.map((page) => (
                <Link
                  key={page.href}
                  to={page.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    location.pathname === page.href
                      ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-foreground font-medium border border-violet-200/50'
                      : 'text-foreground/60 hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <page.icon className="w-4 h-4" />
                  <span className="text-sm">{page.label}</span>
                </Link>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/50 shadow-xl p-6 sm:p-8 lg:p-12">
              <header className="mb-8 pb-8 border-b border-violet-100/50">
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  {title}
                </h1>
                <p className="text-sm text-foreground/50">
                  Última actualización: {lastUpdated}
                </p>
              </header>
              
              <div className="prose prose-violet max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-foreground/70 prose-li:text-foreground/70 prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
