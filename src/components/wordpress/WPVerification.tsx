import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Globe, Shield, User } from 'lucide-react';

interface AuthResult {
  authenticated: boolean;
  can_publish: boolean;
  user_role: string;
  site_title: string;
  error_type?: 'auth_failed' | 'no_permissions' | 'timeout';
}

interface WPVerificationProps {
  result: AuthResult;
  siteUrl: string;
  onContinue: () => void;
  onRetry: () => void;
  onSkip: () => void;
}

export function WPVerification({ result, siteUrl, onContinue, onRetry, onSkip }: WPVerificationProps) {
  if (result.authenticated && result.can_publish) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="text-5xl animate-in zoom-in duration-500">✅</div>
          <h2 className="text-xl font-display font-bold text-foreground">
            ¡WordPress conectado correctamente!
          </h2>
        </div>

        <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span className="text-sm">Tu blog: <strong>{siteUrl}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm">Estado: Conectado y listo para publicar</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-sm">Permisos: Lectura y escritura ✓</span>
            </div>
            {result.user_role && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-emerald-600" />
                <span className="text-sm">Rol: {result.user_role}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={onContinue} className="w-full">
          Continuar →
        </Button>
      </div>
    );
  }

  if (result.error_type === 'auth_failed') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  El usuario o la contraseña de aplicación no son correctos.
                </p>
                <p className="text-xs text-muted-foreground">
                  Asegúrate de usar la <strong>contraseña de aplicación</strong> (no tu contraseña
                  normal de WordPress). Son las 24 letras que se generaron en el paso anterior.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={onRetry} className="w-full">
          Reintentar
        </Button>

        <SkipSection onSkip={onSkip} />
      </div>
    );
  }

  if (result.error_type === 'no_permissions') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Tu usuario no tiene permisos para publicar.
                </p>
                <p className="text-xs text-muted-foreground">
                  Necesitas un usuario con rol de <strong>Administrador</strong> o{' '}
                  <strong>Editor</strong>.
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Para verificar tu rol:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Entra en WordPress → Usuarios → Tu perfil</li>
                    <li>Verifica que tu rol sea Administrador o Editor</li>
                    <li>Si no lo es, pide a un Administrador que lo cambie</li>
                  </ol>
                </div>
                {result.user_role && (
                  <p className="text-xs text-muted-foreground">
                    Tu rol actual: <strong>{result.user_role}</strong>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={onRetry} className="w-full">
          Reintentar
        </Button>

        <SkipSection onSkip={onSkip} />
      </div>
    );
  }

  // Timeout / generic error
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                No hemos podido conectar con tu WordPress.
              </p>
              <p className="text-xs text-muted-foreground">
                Verifica que tu web está activa e inténtalo de nuevo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onRetry} className="w-full">
        Reintentar
      </Button>

      <SkipSection onSkip={onSkip} />
    </div>
  );
}

function SkipSection({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="text-center space-y-1 pt-2">
      <p className="text-xs text-muted-foreground">
        Si prefieres, puedes conectar WordPress más tarde desde tu dashboard.
      </p>
      <button
        onClick={onSkip}
        className="text-xs text-primary hover:underline"
      >
        Continuar sin conectar →
      </button>
    </div>
  );
}
