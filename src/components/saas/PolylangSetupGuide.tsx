import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CheckCircle, Copy, ExternalLink, Loader2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const POLYLANG_SNIPPET = `/**
 * Blooglee - Soporte Polylang para publicación via API REST
 * Permite que Blooglee publique artículos en el idioma correcto
 */
add_filter('rest_pre_insert_post', function($prepared_post, $request) {
    $lang = $request->get_param('lang');
    if ($lang && function_exists('pll_set_post_language')) {
        add_action('rest_after_insert_post', function($post, $request) use ($lang) {
            pll_set_post_language($post->ID, $lang);
        }, 10, 2);
    }
    return $prepared_post;
}, 10, 2);

add_filter('rest_pre_insert_category', function($prepared_term, $request) {
    $lang = $request->get_param('lang');
    if ($lang && function_exists('pll_set_term_language')) {
        add_action('rest_after_insert_category', function($term, $request) use ($lang) {
            pll_set_term_language($term->term_id, $lang);
        }, 10, 2);
    }
    return $prepared_term;
}, 10, 2);`;

interface PolylangSetupGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteUrl?: string;
  onVerify: () => void;
  isVerifying: boolean;
  verifyResult?: 'success' | 'error' | null;
  verifyMessage?: string;
  hideVerifyButton?: boolean;
}

export function PolylangSetupGuide({
  open,
  onOpenChange,
  siteUrl,
  onVerify,
  isVerifying,
  verifyResult,
  verifyMessage,
  hideVerifyButton,
}: PolylangSetupGuideProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(POLYLANG_SNIPPET);
      setCopied(true);
      toast.success('¡Copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const wpAdminUrl = siteUrl ? siteUrl.replace(/\/+$/, '') : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto pb-0">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-xl">Configurar soporte multiidioma en WordPress</SheetTitle>
          <SheetDescription>
            Sigue estos pasos para que Blooglee pueda publicar en varios idiomas
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-28">
          {/* Paso 1 */}
          <StepSection step={1} title="Instala un plugin para añadir código">
            <p className="text-sm text-muted-foreground">
              Necesitas un plugin que permita insertar fragmentos de código en tu WordPress. Te recomendamos <strong className="text-foreground">Code Snippets</strong> por ser el más sencillo.
            </p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside mt-2">
              <li>Ve a tu panel de WordPress → <strong>Plugins → Añadir nuevo</strong></li>
              <li>Busca "<strong>Code Snippets</strong>"</li>
              <li>Haz clic en "<strong>Instalar ahora</strong>" y luego en "<strong>Activar</strong>"</li>
            </ol>
            {wpAdminUrl && (
              <a
                href={`${wpAdminUrl}/wp-admin/plugin-install.php?s=code+snippets&tab=search`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline mt-2"
              >
                Ir a instalar plugins <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </StepSection>

          {/* Paso 2 */}
          <StepSection step={2} title="Crea un nuevo fragmento de código">
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Una vez activado, ve a <strong>Snippets → Añadir nuevo</strong> en el menú lateral de WordPress</li>
              <li>Ponle un nombre descriptivo, por ejemplo: "<strong>Blooglee - Soporte Polylang API</strong>"</li>
            </ol>
            {wpAdminUrl && (
              <a
                href={`${wpAdminUrl}/wp-admin/admin.php?page=snippets-add-new`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline mt-2"
              >
                Ir a crear snippet <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </StepSection>

          {/* Paso 3 */}
          <StepSection step={3} title="Copia y pega este código">
            <p className="text-sm text-muted-foreground mb-3">
              Copia el siguiente código y pégalo en el editor del snippet:
            </p>
            <div className="relative rounded-lg border bg-muted/50 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/80">
                <span className="text-xs text-muted-foreground font-mono">PHP</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-3 text-xs font-mono overflow-x-auto max-h-60">
                <code>{POLYLANG_SNIPPET}</code>
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Este código permite que Blooglee asigne el idioma correcto a cada artículo y categoría al publicar via API REST.
            </p>
          </StepSection>

          {/* Paso 4 */}
          <StepSection step={4} title="Activa el snippet">
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Asegúrate de que en "<strong>Ejecutar snippet</strong>" esté seleccionado "<strong>Ejecutar en todas partes</strong>" (Run everywhere)</li>
              <li>Haz clic en "<strong>Guardar cambios y activar</strong>"</li>
            </ol>
            <div className="flex items-center gap-2 mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>El snippet debe quedar en estado <strong>activo</strong></span>
            </div>
          </StepSection>

          {/* Paso 5 */}
          <StepSection step={5} title="Verifica la conexión">
            <p className="text-sm text-muted-foreground">
              Haz clic en el botón de abajo para comprobar que todo funciona correctamente.
            </p>
          </StepSection>

          {/* Resultado de verificación */}
          {verifyResult === 'success' && (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">
                    ¡Perfecto! Polylang está configurado correctamente.
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
                    Blooglee puede publicar en todos tus idiomas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {verifyResult === 'error' && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">
                    La verificación ha fallado.
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {verifyMessage || 'Asegúrate de que el snippet está activado y que Polylang está activo en tu WordPress.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom buttons */}
        <div className="sticky bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur-sm space-y-2">
          {hideVerifyButton ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Podrás verificar la conexión con Polylang una vez conectes WordPress en la pestaña Configuración o en el checklist del dashboard.
            </p>
          ) : (
            <Button
              onClick={onVerify}
              disabled={isVerifying}
              className="w-full h-11"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : verifyResult === 'error' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </>
              ) : (
                'Verificar conexión multiidioma'
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StepSection({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold mt-0.5">
        {step}
      </div>
      <div className="flex-1 space-y-1.5">
        <h3 className="font-medium text-foreground">{title}</h3>
        {children}
      </div>
    </div>
  );
}
