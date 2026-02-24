import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Globe, Shield, User, KeyRound, ShieldX, WifiOff, Copy, Check } from 'lucide-react';
import { useState } from 'react';

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
  onSkip?: () => void;
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
      <div className="space-y-5 animate-in fade-in duration-300">
        <ErrorHeader
          icon={<KeyRound className="w-6 h-6 text-amber-500" />}
          title="Credenciales incorrectas"
          subtitle="No hemos podido autenticarte en WordPress"
        />

        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-foreground">
              El usuario o la contraseña de aplicación no coinciden. Comprueba estos puntos:
            </p>

            <ChecklistItem
              label="¿Usas la contraseña de aplicación?"
              detail="Son las 24 letras con espacios que generaste en WordPress (ej: ABCD 1234 EFGH 5678 IJKL 9012). No es tu contraseña normal de login."
            />
            <ChecklistItem
              label="¿Copiaste todos los caracteres?"
              detail="La contraseña incluye los espacios entre grupos. Asegúrate de copiarla entera sin añadir ni quitar caracteres."
            />
            <ChecklistItem
              label="¿El usuario es correcto?"
              detail="Usa el mismo nombre de usuario con el que entraste en WordPress para crear la contraseña de aplicación."
            />

            <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">💡 Tip: genera una nueva contraseña</p>
              <p>
                Si no estás seguro, lo más fácil es generar una nueva. Ve a <strong>WordPress → Usuarios → Tu perfil → Contraseñas de aplicación</strong>, escribe "Blooglee" y haz clic en "Añadir".
              </p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={onRetry} className="w-full">
          Reintentar con otras credenciales
        </Button>

        <SkipSection onSkip={onSkip} />
      </div>
    );
  }

  if (result.error_type === 'no_permissions') {
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        <ErrorHeader
          icon={<ShieldX className="w-6 h-6 text-amber-500" />}
          title="Sin permisos de publicación"
          subtitle={result.user_role
            ? `Tu usuario tiene el rol "${result.user_role}", que no permite publicar.`
            : 'Tu usuario no tiene permisos para crear entradas en WordPress.'}
        />

        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-foreground">
              Blooglee necesita un usuario con rol de <strong>Administrador</strong> o <strong>Editor</strong> para poder publicar artículos.
            </p>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Cómo solucionarlo:</p>
              <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1.5 pl-1">
                <li>Entra en <strong>WordPress → Usuarios → Todos los usuarios</strong></li>
                <li>Busca tu usuario y haz clic en "Editar"</li>
                <li>Cambia el campo <strong>Perfil</strong> a "Administrador" o "Editor"</li>
                <li>Guarda los cambios y vuelve aquí</li>
              </ol>
            </div>

            {result.user_role && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Rol actual detectado: <strong className="text-foreground">{result.user_role}</strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={onRetry} className="w-full">
          Ya lo he cambiado, reintentar
        </Button>

        <SkipSection onSkip={onSkip} />
      </div>
    );
  }

  // Timeout / generic error
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <ErrorHeader
        icon={<WifiOff className="w-6 h-6 text-amber-500" />}
        title="No se pudo conectar"
        subtitle="No hemos podido comunicarnos con tu WordPress"
      />

      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-foreground">
            La conexión ha fallado o ha tardado demasiado. Puede deberse a varias causas:
          </p>

          <ChecklistItem
            label="Tu web está caída o en mantenimiento"
            detail="Comprueba que puedes acceder a tu web normalmente desde el navegador."
          />
          <ChecklistItem
            label="Un plugin de seguridad bloquea la API REST"
            detail="Plugins como Wordfence, iThemes Security o Sucuri pueden bloquear las conexiones API. Revisa sus ajustes o desactívalos temporalmente."
          />
          <ChecklistItem
            label="Tu hosting limita las conexiones externas"
            detail="Algunos hostings bloquean peticiones API. Contacta a tu proveedor si el problema persiste."
          />

          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <p>
              <strong>URL que intentamos conectar:</strong>{' '}
              <CopyableUrl url={siteUrl} />
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onRetry} className="w-full">
        Reintentar conexión
      </Button>

      <SkipSection onSkip={onSkip} />
    </div>
  );
}

// --- Sub-components ---

function ErrorHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-2">
      <div className="flex justify-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h2 className="text-lg font-display font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{subtitle}</p>
    </div>
  );
}

function ChecklistItem({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors">
      <code className="break-all">{url}</code>
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function SkipSection({ onSkip }: { onSkip?: () => void }) {
  if (!onSkip) return null;
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
