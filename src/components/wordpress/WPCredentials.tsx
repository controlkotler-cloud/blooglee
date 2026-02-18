import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

interface WPCredentialsProps {
  onBack: () => void;
  onSubmit: (username: string, appPassword: string) => void;
  isLoading: boolean;
}

export function WPCredentials({ onBack, onSubmit, isLoading }: WPCredentialsProps) {
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !appPassword.trim()) return;
    onSubmit(username.trim(), appPassword.trim());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-display font-bold text-foreground">
          Introduce tus datos de WordPress
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wp-username">Usuario de WordPress</Label>
          <Input
            id="wp-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: admin o tu email de WordPress"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Es el usuario con el que entras a tu WordPress (no tu email de Blooglee).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wp-app-password">Contraseña de aplicación</Label>
          <div className="relative">
            <Input
              id="wp-app-password"
              type={showPassword ? 'text' : 'password'}
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="XXXX XXXX XXXX XXXX XXXX XXXX"
              className="pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Pega aquí la contraseña que has generado en el paso anterior. (NO es tu contraseña normal de WordPress)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Tus datos se guardan cifrados y solo se usan para publicar artículos.</span>
        </div>

        <Button type="submit" className="w-full" disabled={!username.trim() || !appPassword.trim() || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Conectando...
            </>
          ) : (
            'Conectar →'
          )}
        </Button>
      </form>

      <div className="pt-2">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Atrás
        </Button>
      </div>
    </div>
  );
}
