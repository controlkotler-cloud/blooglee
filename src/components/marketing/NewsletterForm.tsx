import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, Building2, Briefcase, Lock, Check } from 'lucide-react';
import { useNewsletterSubscribe } from '@/hooks/useNewsletterSubscribe';
import { Link } from 'react-router-dom';

interface NewsletterFormProps {
  variant?: 'sidebar' | 'footer';
  source?: string;
}

type AudienceType = 'empresas' | 'agencias' | null;

export function NewsletterForm({ variant = 'sidebar', source = 'blog' }: NewsletterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [audience, setAudience] = useState<AudienceType>(null);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const { subscribe, isLoading } = useNewsletterSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audience) {
      return;
    }

    const result = await subscribe({
      name,
      email,
      audience,
      gdprConsent,
      marketingConsent,
      source
    });

    if (result.success) {
      setName('');
      setEmail('');
      setAudience(null);
      setGdprConsent(false);
      setMarketingConsent(false);
    }
  };

  const isFormValid = name.trim().length >= 2 && email.includes('@') && audience && gdprConsent && marketingConsent;

  // Footer variant - compact horizontal layout
  if (variant === 'footer') {
    return (
      <div className="w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Inputs row */}
          <div className="flex flex-col lg:flex-row gap-3">
            <Input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-white/80 border-violet-200"
              required
            />
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white/80 border-violet-200"
              required
            />
            
            {/* Audience selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAudience('empresas')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  audience === 'empresas'
                    ? 'bg-violet-500 text-white border-violet-500 shadow-md'
                    : 'bg-white/80 text-foreground/70 border-violet-200 hover:border-violet-400'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Empresa
              </button>
              <button
                type="button"
                onClick={() => setAudience('agencias')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  audience === 'agencias'
                    ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-md'
                    : 'bg-white/80 text-foreground/70 border-violet-200 hover:border-fuchsia-400'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Agencia
              </button>
            </div>

            <Button
              type="submit"
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 whitespace-nowrap"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Suscribirme'}
            </Button>
          </div>

          {/* Consents row */}
          <div className="flex flex-col sm:flex-row gap-4 text-sm">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-violet-300 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-foreground/60">
                He leído y acepto la{' '}
                <Link to="/privacy" className="text-violet-500 hover:underline">
                  Política de Privacidad
                </Link>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-violet-300 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-foreground/60">
                Acepto recibir comunicaciones de Blooglee
              </span>
            </label>
          </div>
        </form>
      </div>
    );
  }

  // Sidebar variant - vertical layout with gradient background
  return (
    <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 rounded-2xl p-6 text-white">
      <Mail className="w-8 h-8 mb-4" />
      <h3 className="font-display text-lg font-bold mb-2">Newsletter</h3>
      <p className="text-white/80 text-sm mb-6">
        Recibe contenido exclusivo cada día en tu email
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field */}
        <div>
          <Label htmlFor="newsletter-name" className="text-white/90 text-sm mb-1.5 block">
            Tu nombre
          </Label>
          <Input
            id="newsletter-name"
            type="text"
            placeholder="Ej: María García"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/20 border-white/30 placeholder:text-white/50 text-white"
            required
          />
        </div>

        {/* Email field */}
        <div>
          <Label htmlFor="newsletter-email" className="text-white/90 text-sm mb-1.5 block">
            Tu email
          </Label>
          <Input
            id="newsletter-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/20 border-white/30 placeholder:text-white/50 text-white"
            required
          />
        </div>

        {/* Audience selection with cards */}
        <div>
          <Label className="text-white/90 text-sm mb-2 block">
            Soy:
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAudience('empresas')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2 ${
                audience === 'empresas'
                  ? 'bg-white text-violet-600 border-white shadow-lg'
                  : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
              }`}
            >
              <Building2 className="w-6 h-6" />
              <span className="font-semibold text-sm">Empresa</span>
              <span className={`text-xs ${audience === 'empresas' ? 'text-violet-500' : 'text-white/70'}`}>
                Pyme / Autónomo
              </span>
              {audience === 'empresas' && (
                <Check className="w-4 h-4 absolute top-2 right-2" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setAudience('agencias')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2 ${
                audience === 'agencias'
                  ? 'bg-white text-fuchsia-600 border-white shadow-lg'
                  : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
              }`}
            >
              <Briefcase className="w-6 h-6" />
              <span className="font-semibold text-sm">Agencia</span>
              <span className={`text-xs ${audience === 'agencias' ? 'text-fuchsia-500' : 'text-white/70'}`}>
                de Marketing
              </span>
            </button>
          </div>
        </div>

        {/* Consent checkboxes */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/50 bg-white/20 text-violet-500 focus:ring-white/50"
            />
            <span className="text-sm text-white/90">
              He leído y acepto la{' '}
              <Link to="/privacy" className="underline hover:text-white">
                Política de Privacidad
              </Link>{' '}
              y el tratamiento de mis datos *
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/50 bg-white/20 text-violet-500 focus:ring-white/50"
            />
            <span className="text-sm text-white/90">
              Acepto recibir comunicaciones comerciales de Blooglee *
            </span>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full bg-white text-violet-600 hover:bg-white/90 font-semibold"
          disabled={isLoading || !isFormValid}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Suscribiendo...
            </>
          ) : (
            'Suscribirme'
          )}
        </Button>

        {/* Security note */}
        <p className="flex items-center gap-2 text-xs text-white/70 justify-center">
          <Lock className="w-3 h-3" />
          Tus datos están seguros. Puedes darte de baja cuando quieras.
        </p>
      </form>
    </div>
  );
}
