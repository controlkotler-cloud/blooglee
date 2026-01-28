import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, Building2, Users } from 'lucide-react';
import { useNewsletterSubscribe } from '@/hooks/useNewsletterSubscribe';

interface NewsletterFormProps {
  variant?: 'sidebar' | 'inline';
  defaultAudience?: 'empresas' | 'agencias' | 'both';
}

export function NewsletterForm({ variant = 'sidebar', defaultAudience }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [audience, setAudience] = useState<'empresas' | 'agencias' | 'both'>(defaultAudience || 'both');
  const { subscribe, isLoading } = useNewsletterSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await subscribe(email, 'blog', audience);
    if (result.success) {
      setEmail('');
    }
  };

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAudience('empresas')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              audience === 'empresas'
                ? 'bg-violet-500 text-white'
                : 'bg-white/70 text-foreground/70 hover:bg-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Empresa</span>
          </button>
          <button
            type="button"
            onClick={() => setAudience('agencias')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              audience === 'agencias'
                ? 'bg-fuchsia-500 text-white'
                : 'bg-white/70 text-foreground/70 hover:bg-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Agencia</span>
          </button>
          <button
            type="button"
            onClick={() => setAudience('both')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              audience === 'both'
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                : 'bg-white/70 text-foreground/70 hover:bg-white'
            }`}
          >
            Ambos
          </button>
        </div>
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-white/80"
          required
        />
        <Button
          type="submit"
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Suscribirse'}
        </Button>
      </form>
    );
  }

  // Sidebar variant
  return (
    <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 rounded-2xl p-6 text-white">
      <Mail className="w-8 h-8 mb-4" />
      <h3 className="font-display text-lg font-bold mb-2">Newsletter</h3>
      <p className="text-white/80 text-sm mb-4">
        Recibe tips de SEO y marketing directamente en tu email.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Audience selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/90">Soy:</p>
          <div className="grid grid-cols-1 gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="audience"
                value="empresas"
                checked={audience === 'empresas'}
                onChange={() => setAudience('empresas')}
                className="w-4 h-4 accent-white"
              />
              <span className="text-sm">🏢 Empresa / PYME</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="audience"
                value="agencias"
                checked={audience === 'agencias'}
                onChange={() => setAudience('agencias')}
                className="w-4 h-4 accent-white"
              />
              <span className="text-sm">🏬 Agencia de marketing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="audience"
                value="both"
                checked={audience === 'both'}
                onChange={() => setAudience('both')}
                className="w-4 h-4 accent-white"
              />
              <span className="text-sm">📚 Me interesa todo</span>
            </label>
          </div>
        </div>

        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/20 border-white/30 placeholder:text-white/60 text-white"
          required
        />
        <Button
          type="submit"
          className="w-full bg-white text-violet-600 hover:bg-white/90"
          disabled={isLoading}
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
      </form>
    </div>
  );
}
