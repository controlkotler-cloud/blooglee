import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield, ShieldCheck, HelpCircle, ExternalLink, Copy, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface WPAppPasswordGuideProps {
  siteUrl: string;
  onBack: () => void;
  onContinue: () => void;
}

type SecurityPlugin = "none" | "wordfence" | "ithemes" | "aios" | "malcare" | "unknown";

const PLUGIN_OPTIONS: Array<{ value: SecurityPlugin; label: string; icon: React.ReactNode }> = [
  { value: "none", label: "Ninguno / No uso plugin de seguridad", icon: <ShieldCheck className="w-4 h-4" /> },
  { value: "wordfence", label: "Wordfence", icon: <Shield className="w-4 h-4" /> },
  { value: "ithemes", label: "iThemes / Solid Security", icon: <Shield className="w-4 h-4" /> },
  { value: "aios", label: "All In One WP Security", icon: <Shield className="w-4 h-4" /> },
  { value: "malcare", label: "MalCare / BlogVault", icon: <Shield className="w-4 h-4" /> },
  { value: "unknown", label: "No lo sé / Otro", icon: <HelpCircle className="w-4 h-4" /> },
];

function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={handle} className="h-7 text-xs gap-1">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado" : label}
    </Button>
  );
}

function CodeSnippet({ code }: { code: string }) {
  return (
    <div className="relative rounded-md border bg-muted/50">
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
        <span className="text-xs font-mono text-muted-foreground">snippet</span>
        <CopyButton text={code} />
      </div>
      <pre className="text-xs font-mono p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">{code}</pre>
    </div>
  );
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.origin;
  } catch {
    return url.replace(/\/+$/, "");
  }
}

export function WPAppPasswordGuide({ siteUrl, onBack, onContinue }: WPAppPasswordGuideProps) {
  const [plugin, setPlugin] = useState<SecurityPlugin | null>(null);
  const normalized = normalizeUrl(siteUrl);
  const wpAdminUrl = `${normalized}/wp-admin/profile.php`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-display font-bold text-foreground">
          Casi listo — necesitamos una "contraseña de aplicación"
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Es una contraseña especial solo para Blooglee. Tu contraseña normal de WordPress sigue siendo privada.
        </p>
      </div>

      {plugin === null && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Primero, cuéntanos: ¿tienes algún plugin de seguridad instalado?
            </p>
            <p className="text-xs text-muted-foreground">
              Algunos plugins bloquean las contraseñas de aplicación y te mostraremos cómo activarlas.
            </p>
            <div className="space-y-2 pt-1">
              {PLUGIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPlugin(opt.value)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-primary">{opt.icon}</span>
                  <span className="flex-1">{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {plugin !== null && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Plugin seleccionado: <strong>{PLUGIN_OPTIONS.find((o) => o.value === plugin)?.label}</strong>
            </p>
            <Button variant="ghost" size="sm" onClick={() => setPlugin(null)} className="text-xs h-7">
              Cambiar
            </Button>
          </div>

          {plugin === "wordfence" && (
            <Card className="border-amber-300 bg-amber-50/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 text-sm">
                      Wordfence bloquea las contraseñas de aplicación por defecto.
                    </p>
                    <p className="text-xs text-amber-800 mt-1">Haz esto ANTES de crear la contraseña:</p>
                  </div>
                </div>
                <ol className="list-decimal list-inside text-sm text-foreground space-y-2 pl-2">
                  <li>
                    Entra a tu panel WordPress (
                    <a
                      href={`${normalized}/wp-admin/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      abrir wp-admin <ExternalLink className="w-3 h-3" />
                    </a>
                    )
                  </li>
                  <li>
                    Menú izquierdo → <strong>Wordfence → All Options</strong>
                  </li>
                  <li>
                    Sección <strong>"Brute Force Protection"</strong>
                  </li>
                  <li>
                    Desactiva: <em>"Disable WordPress application passwords"</em>
                  </li>
                  <li>
                    Clic en <strong>"Save changes"</strong>
                  </li>
                </ol>
                <p className="text-xs text-amber-800">
                  ¿No ves esa opción? Prueba en <strong>Wordfence → Firewall → Manage Firewall</strong> y desactiva la
                  regla "Application Passwords".
                </p>
              </CardContent>
            </Card>
          )}

          {plugin === "ithemes" && (
            <Card className="border-amber-300 bg-amber-50/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold text-amber-900 text-sm">
                    iThemes / Solid Security puede bloquear las contraseñas de aplicación.
                  </p>
                </div>
                <ol className="list-decimal list-inside text-sm text-foreground space-y-2 pl-2">
                  <li>
                    Entra a tu panel WordPress (
                    <a
                      href={`${normalized}/wp-admin/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      abrir wp-admin <ExternalLink className="w-3 h-3" />
                    </a>
                    )
                  </li>
                  <li>
                    Menú → <strong>Security → Settings</strong> (o <strong>Solid Security → Settings</strong>)
                  </li>
                  <li>
                    Busca la sección <strong>"WordPress Tweaks"</strong> o <strong>"REST API"</strong>
                  </li>
                  <li>
                    Asegúrate de que <em>"Application Passwords"</em> esté <strong>habilitado</strong>
                  </li>
                  <li>Guarda cambios</li>
                </ol>
                <p className="text-xs text-amber-800">
                  Si la opción "Restrict REST API" está en "Restricted", cámbiala a <strong>"Default Access"</strong>{" "}
                  para que Blooglee pueda conectar.
                </p>
              </CardContent>
            </Card>
          )}

          {plugin === "aios" && (
            <Card className="border-amber-300 bg-amber-50/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold text-amber-900 text-sm">
                    All In One WP Security puede bloquear la REST API.
                  </p>
                </div>
                <ol className="list-decimal list-inside text-sm text-foreground space-y-2 pl-2">
                  <li>
                    Entra a tu panel WordPress (
                    <a
                      href={`${normalized}/wp-admin/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      abrir wp-admin <ExternalLink className="w-3 h-3" />
                    </a>
                    )
                  </li>
                  <li>
                    Menú → <strong>WP Security → Firewall</strong>
                  </li>
                  <li>
                    Pestaña <strong>"REST API"</strong>
                  </li>
                  <li>
                    Desactiva: <em>"Disallow unauthorized REST API requests"</em>
                  </li>
                  <li>
                    Menú → <strong>WP Security → User Security → XML-RPC</strong> → asegúrate de que NO esté
                    completamente bloqueado
                  </li>
                  <li>Guarda cambios</li>
                </ol>
              </CardContent>
            </Card>
          )}

          {plugin === "malcare" && (
            <Card className="border-amber-300 bg-amber-50/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold text-amber-900 text-sm">
                    MalCare / BlogVault suele requerir whitelistear Blooglee.
                  </p>
                </div>
                <ol className="list-decimal list-inside text-sm text-foreground space-y-2 pl-2">
                  <li>Entra al panel de MalCare (en malcare.com, no en wp-admin)</li>
                  <li>Selecciona tu sitio</li>
                  <li>
                    Ve a <strong>Security → Firewall → Whitelist IPs</strong>
                  </li>
                  <li>Añade la IP de Supabase (contáctanos si necesitas la IP actual)</li>
                  <li>Guarda cambios</li>
                </ol>
                <p className="text-xs text-amber-800">
                  Si sigue sin funcionar, desactiva temporalmente MalCare desde WordPress para conectar Blooglee una
                  vez, y reactívalo después.
                </p>
              </CardContent>
            </Card>
          )}

          {plugin === "unknown" && (
            <Card className="border-muted">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Si la contraseña de aplicación no funciona o no ves la sección, prueba esto:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Revisa si tienes algún plugin con "Security" en el nombre y desactívalo temporalmente</li>
                  <li>
                    Algunos hostings (SiteGround, WP Engine, Kinsta) desactivan Application Passwords — contacta su
                    soporte
                  </li>
                  <li>
                    Prueba añadir este snippet al archivo <strong>functions.php</strong> de tu tema (después de
                    copiarlo):
                  </li>
                </ul>
                <CodeSnippet code={`add_filter( 'wp_is_application_passwords_available', '__return_true' );`} />
                <p className="text-xs text-muted-foreground">
                  Este snippet fuerza la activación de contraseñas de aplicación aunque un plugin o el hosting las haya
                  desactivado.
                </p>
                <p className="text-xs text-muted-foreground">
                  ¿Sigue sin funcionar?{" "}
                  <a
                    href="https://blooglee.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Escríbenos y te ayudamos →
                  </a>
                </p>
              </CardContent>
            </Card>
          )}

          {plugin === "none" && (
            <Card className="border-emerald-300 bg-emerald-50/40">
              <CardContent className="p-4">
                <p className="text-sm text-emerald-900">
                  Perfecto — sin plugin de seguridad, las contraseñas de aplicación deberían funcionar directamente.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">Ahora sigue estos 5 pasos en tu WordPress:</p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1 space-y-1 pt-0.5">
                    <p className="text-sm font-medium">Entra a tu WordPress</p>
                    <a
                      href={wpAdminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Abrir mi perfil WordPress <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-xs text-muted-foreground font-mono">{wpAdminUrl}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-medium">Si te pide login, entra como siempre</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1 space-y-1 pt-0.5">
                    <p className="text-sm font-medium">Baja hasta "Contraseñas de aplicación"</p>
                    <p className="text-xs text-muted-foreground">
                      Está cerca del final de la página, debajo de "Gestión de cuenta".
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div className="flex-1 space-y-2 pt-0.5">
                    <p className="text-sm font-medium">Crea la contraseña</p>
                    <p className="text-xs text-muted-foreground">
                      En "Nombre de la nueva contraseña de aplicación" escribe:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">Blooglee</code>
                      <CopyButton text="Blooglee" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Clic en <strong>"Añadir nueva contraseña de aplicación"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    5
                  </div>
                  <div className="flex-1 space-y-2 pt-0.5">
                    <p className="text-sm font-medium">Copia la contraseña que aparece</p>
                    <p className="text-xs text-amber-800 font-medium">
                      ⚠️ Cópiala AHORA. WordPress no la mostrará otra vez.
                    </p>
                    <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-2 rounded text-center tracking-widest">
                      XXXX XXXX XXXX XXXX XXXX XXXX
                    </p>
                    <p className="text-xs text-muted-foreground">Pégala en el siguiente paso.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={onContinue} className="w-full">
            Ya tengo mi contraseña →
          </Button>
        </>
      )}

      <div className="pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Atrás
        </Button>
      </div>
    </div>
  );
}
