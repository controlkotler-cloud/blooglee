import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Save,
  Unplug,
  ChevronDown,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useWordPressConfig, useUpsertWordPressConfig, useDeleteWordPressConfig } from "@/hooks/useWordPressConfigSaas";
import { useWordPressHealthCheck, HealthCheckResult } from "@/hooks/useWordPressHealthCheck";
import { useSyncTaxonomiesSaas } from "@/hooks/useWordPressTaxonomiesSaas";
import { usePolylangDiagnostic } from "@/hooks/usePolylangDiagnostic";
import { useWordPressDiagnostic } from "@/hooks/useWordPressDiagnostic";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WordPressTroubleshootPanel } from "./WordPressTroubleshootPanel";
import { PolylangSetupGuide } from "./PolylangSetupGuide";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  site_url: z
    .string()
    .min(1, "La URL es obligatoria")
    .url("Introduce una URL válida")
    .transform((url) => {
      let normalized = url.trim();
      // Remove common paths that aren't part of the WP root
      normalized = normalized.replace(/\/wp-admin\/?$/, "");
      normalized = normalized.replace(/\/+$/, "");
      // Strip blog/news subpaths - we need the WP root, not the blog page
      try {
        const u = new URL(normalized);
        normalized = u.origin;
      } catch {
        // keep as-is if URL parsing fails
      }
      return normalized;
    }),
  wp_username: z.string().min(1, "El usuario es obligatorio"),
  wp_app_password: z.string().min(1, "La contraseña de aplicación es obligatoria"),
});

type FormData = z.infer<typeof formSchema>;

interface WordPressConfigFormProps {
  siteId: string;
  languages?: string[];
  wordpressContext?: {
    analyzed_at?: string;
    lastTopics?: string[];
    [key: string]: unknown;
  } | null;
}

export function WordPressConfigForm({ siteId, languages = [], wordpressContext }: WordPressConfigFormProps) {
  const { data: config, isLoading } = useWordPressConfig(siteId);
  const upsertMutation = useUpsertWordPressConfig();
  const deleteMutation = useDeleteWordPressConfig();
  const { runHealthCheck, isChecking } = useWordPressHealthCheck();
  const syncMutation = useSyncTaxonomiesSaas();
  const hasCatalan = languages.includes("catalan");
  const { data: polylangDiagnostic } = usePolylangDiagnostic(hasCatalan ? siteId : undefined);
  const { data: yoastDiagnostic } = useWordPressDiagnostic(config ? siteId : undefined, "yoast_meta", !!config);
  const { data: elementorDiagnostic } = useWordPressDiagnostic(
    config ? siteId : undefined,
    "elementor_format",
    !!config,
  );

  const [showPassword, setShowPassword] = useState(false);
  const [helpOpen, setHelpOpen] = useState(true);
  const [polylangGuideOpen, setPolylangGuideOpen] = useState(false);
  const [polylangVerifyResult, setPolylangVerifyResult] = useState<"success" | "error" | null>(null);
  const [polylangVerifyMessage, setPolylangVerifyMessage] = useState<string>("");

  // Estados de validación
  const [urlStatus, setUrlStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<"idle" | "validating" | "error" | "warning" | "success">(
    "idle",
  );
  const [validationResult, setValidationResult] = useState<HealthCheckResult | null>(null);

  // Colapsar ayuda cuando ya hay config guardada
  useEffect(() => {
    if (config) setHelpOpen(false);
  }, [config]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    values: config
      ? {
          site_url: config.site_url,
          wp_username: config.wp_username,
          wp_app_password: config.wp_app_password,
        }
      : undefined,
  });

  const watchedUrl = watch("site_url");

  // Validar URL al perder foco
  const handleUrlBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value?.trim();
    if (!url || urlStatus === "checking") return;

    // Validar formato básico
    try {
      new URL(url);
    } catch {
      setUrlStatus("invalid");
      setUrlError("URL no válida");
      return;
    }

    setUrlStatus("checking");
    setUrlError(null);

    const result = await runHealthCheck(url, undefined, undefined, 1);

    if (result?.overall_status === "success" || result?.overall_status === "warning") {
      setUrlStatus("valid");
      setUrlError(null);
    } else {
      setUrlStatus("invalid");
      setUrlError(result?.errors?.[0] || "No se pudo conectar con el sitio WordPress");
    }
  };

  // Reset URL status cuando cambia la URL
  useEffect(() => {
    if (urlStatus !== "idle") {
      setUrlStatus("idle");
      setUrlError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedUrl]);

  const onSubmit = async (data: FormData) => {
    setValidationState("validating");
    setValidationResult(null);

    try {
      // Ejecutar health check fase 3 (completo con credenciales)
      const result = await runHealthCheck(data.site_url, data.wp_username, data.wp_app_password, 3);

      setValidationResult(result);

      if (!result) {
        setValidationState("error");
        toast.error("Error al verificar la conexión");
        return;
      }

      if (result.overall_status === "error") {
        setValidationState("error");
        toast.error("Hay problemas con la configuración. Revisa los detalles abajo.");
        return;
      }

      if (result.overall_status === "warning") {
        setValidationState("warning");
      } else {
        setValidationState("success");
      }

      // Success o warning - guardar config
      await upsertMutation.mutateAsync({
        site_id: siteId,
        site_url: data.site_url,
        wp_username: data.wp_username,
        wp_app_password: data.wp_app_password,
      });

      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error:", error);
      setValidationState("error");
      toast.error("Error al guardar la configuración");
    }
  };

  const handleDisconnect = () => {
    deleteMutation.mutate(siteId);
    setValidationState("idle");
    setValidationResult(null);
    setUrlStatus("idle");
  };

  const getCheckIcon = (status: "ok" | "warning" | "error") => {
    switch (status) {
      case "ok":
        return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isValidating = validationState === "validating" || isChecking;

  return (
    <Card className="border-0 shadow-lg sm:border sm:shadow-md">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Configuración de WordPress</CardTitle>
      </CardHeader>
      <CardContent className="pb-6 space-y-6">
        {/* Sección de ayuda colapsable */}
        <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors text-left">
            <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
            <span className="font-medium text-violet-900 dark:text-violet-100">Cómo configurar WordPress</span>
            <ChevronDown
              className={`w-4 h-4 ml-auto text-violet-600 dark:text-violet-400 transition-transform ${helpOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 space-y-4 bg-violet-50/50 dark:bg-violet-950/20 rounded-b-lg border-x border-b border-violet-100 dark:border-violet-900">
            {/* Paso 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">URL del sitio</p>
                <p className="text-sm text-muted-foreground">La dirección de tu WordPress (ej: https://miweb.com)</p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Usuario de WordPress</p>
                <p className="text-sm text-muted-foreground">
                  Un usuario con rol de <strong>Administrador</strong> o <strong>Editor</strong> en WordPress. Necesita
                  permisos para crear y publicar entradas.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Contraseña de aplicación</p>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>No es tu contraseña normal</strong>. Es una clave especial que debes crear:
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                  <li>
                    Ve a tu WordPress → <strong>Usuarios → Perfil</strong>
                  </li>
                  <li>
                    Baja hasta la sección "<strong>Contraseñas de aplicación</strong>"
                  </li>
                  <li>Escribe un nombre (ej: "Blooglee")</li>
                  <li>
                    Clic en "<strong>Añadir nueva contraseña</strong>"
                  </li>
                  <li>Copia la clave que aparece (solo se muestra una vez)</li>
                </ol>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
          {/* Campo 1: URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <Label htmlFor="site_url" className="text-sm sm:text-base">
                URL del sitio
              </Label>
              {/* Indicador de estado de URL */}
              {urlStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              {urlStatus === "valid" && <CheckCircle className="w-4 h-4 text-green-500" />}
              {urlStatus === "invalid" && <XCircle className="w-4 h-4 text-red-500" />}
            </div>
            <Input
              id="site_url"
              placeholder="https://miweb.com"
              className="h-12 text-base"
              {...register("site_url")}
              onBlur={handleUrlBlur}
            />
            {urlStatus === "valid" && (
              <p className="text-xs text-green-600 dark:text-green-400">✓ Sitio WordPress detectado correctamente</p>
            )}
            {urlStatus === "invalid" && urlError && (
              <p className="text-xs text-red-600 dark:text-red-400">✗ {urlError}</p>
            )}
            {urlStatus === "idle" && (
              <p className="text-xs text-muted-foreground">Ejemplo: https://miweb.com (sin /wp-admin)</p>
            )}
            {errors.site_url && <p className="text-sm text-destructive">{errors.site_url.message}</p>}
          </div>

          {/* Campo 2: Usuario */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <Label htmlFor="wp_username" className="text-sm sm:text-base">
                Usuario de WordPress
              </Label>
            </div>
            <Input
              id="wp_username"
              placeholder="tu_usuario_wordpress"
              className="h-12 text-base"
              autoComplete="off"
              data-1p-ignore
              {...register("wp_username")}
            />
            <p className="text-xs text-muted-foreground">
              Debe tener rol de Administrador o Editor para poder publicar
            </p>
            {errors.wp_username && <p className="text-sm text-destructive">{errors.wp_username.message}</p>}
          </div>

          {/* Campo 3: Contraseña de aplicación */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <Label htmlFor="wp_app_password" className="text-sm sm:text-base">
                Contraseña de aplicación
              </Label>
            </div>
            <div className="relative">
              <Input
                id="wp_app_password"
                type={showPassword ? "text" : "password"}
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                className="h-12 text-base pr-20"
                autoComplete="new-password"
                data-1p-ignore
                {...register("wp_app_password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ No es tu contraseña normal. Créala en WordPress → Usuarios → Perfil
            </p>
            {errors.wp_app_password && <p className="text-sm text-destructive">{errors.wp_app_password.message}</p>}
          </div>

          {/* Panel de resultados de validación */}
          {validationResult && validationState !== "idle" && (
            <div
              className={`p-4 rounded-lg border ${
                validationState === "success"
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                  : validationState === "warning"
                    ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
              }`}
            >
              <h4
                className={`font-medium mb-3 flex items-center gap-2 ${
                  validationState === "success"
                    ? "text-green-700 dark:text-green-400"
                    : validationState === "warning"
                      ? "text-yellow-700 dark:text-yellow-400"
                      : "text-red-700 dark:text-red-400"
                }`}
              >
                {validationState === "success" && <CheckCircle className="w-5 h-5" />}
                {validationState === "warning" && <AlertTriangle className="w-5 h-5" />}
                {validationState === "error" && <XCircle className="w-5 h-5" />}
                Resultado del diagnóstico
              </h4>
              <div className="space-y-2">
                {validationResult.checks.map((check) => (
                  <div key={check.id} className="flex items-start gap-2 text-sm">
                    {getCheckIcon(check.status)}
                    <div>
                      <span className="text-foreground">{check.message}</span>
                      {check.action && <p className="text-muted-foreground text-xs mt-0.5">{check.action}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {validationResult.detected_plugins.length > 0 && (
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs text-muted-foreground">
                    Plugins detectados: {validationResult.detected_plugins.join(", ")}
                  </p>
                </div>
              )}
              {validationState === "success" && (
                <p className="mt-3 text-sm text-green-700 dark:text-green-400 font-medium">
                  ✓ Configuración guardada correctamente
                </p>
              )}
              {validationState === "warning" && (
                <p className="mt-3 text-sm text-yellow-700 dark:text-yellow-400">
                  ⚠️ Configuración guardada con advertencias. Algunas funciones podrían no funcionar correctamente.
                </p>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={
                isValidating || upsertMutation.isPending || (!isDirty && !!config && validationState === "success")
              }
              className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando conexión...
                </>
              ) : upsertMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {config ? "Actualizar" : "Guardar configuración"}
                </>
              )}
            </Button>

            {/* Sync button moved to connected status card below */}

            {config && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm text-destructive hover:text-destructive"
                  >
                    <Unplug className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Desconectar WordPress?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminará la configuración de WordPress. Podrás volver a conectarlo cuando quieras.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <AlertDialogCancel className="w-full sm:w-auto h-12 sm:h-10">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisconnect}
                      className="w-full sm:w-auto h-12 sm:h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Desconectar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </form>

        {/* Banner de diagnóstico Yoast */}
        {config && (
          <Alert
            className={
              yoastDiagnostic?.status === "ok"
                ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 [&>svg]:text-emerald-600"
                : "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 [&>svg]:text-amber-600"
            }
          >
            {yoastDiagnostic?.status === "ok" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {yoastDiagnostic?.status === "ok" ? "Yoast SEO verificado" : "Revisión de Yoast recomendada"}
            </AlertTitle>
            <AlertDescription className="text-sm flex flex-wrap items-center gap-x-3 gap-y-2">
              <span>
                {yoastDiagnostic.message || "Diagnóstico de Yoast pendiente. Pulsa Re-sincronizar para comprobarlo."}
              </span>
              {yoastDiagnostic?.status !== "ok" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-800 p-0"
                  onClick={() => syncMutation.mutate(config.id)}
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                  Re-sincronizar
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Banner de diagnóstico Elementor */}
        {config && (
          <Alert
            className={
              elementorDiagnostic?.status === "ok"
                ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 [&>svg]:text-emerald-600"
                : "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 [&>svg]:text-amber-600"
            }
          >
            {elementorDiagnostic?.status === "ok" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {elementorDiagnostic?.status === "ok"
                ? "Formato compatible con publicaciones automáticas"
                : "Posible desajuste de diseño con Elementor"}
            </AlertTitle>
            <AlertDescription className="text-sm flex flex-wrap items-center gap-x-3 gap-y-2">
              <span>
                {elementorDiagnostic.message ||
                  "Diagnóstico de Elementor pendiente. Pulsa Re-sincronizar para comprobarlo."}
              </span>
              {elementorDiagnostic?.status !== "ok" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-800 p-0"
                  onClick={() => syncMutation.mutate(config.id)}
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                  Re-sincronizar
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Banner de diagnóstico Polylang - 3 estados */}
        {hasCatalan &&
          config &&
          (() => {
            const diagStatus = polylangDiagnostic?.status;
            const langLabels = languages
              .map((l) => (l === "spanish" ? "español" : l === "catalan" ? "catalán" : l))
              .join(" y ");
            const siteOrigin = config.site_url
              ? (() => {
                  try {
                    return new URL(config.site_url).origin;
                  } catch {
                    return config.site_url;
                  }
                })()
              : undefined;

            const handleVerifyInGuide = () => {
              setPolylangVerifyResult(null);
              syncMutation.mutate(config.id, {
                onSuccess: () => {
                  // After sync, diagnostic will be refetched. We check the result.
                  setTimeout(() => {
                    // Re-read from cache won't work instantly, rely on invalidation
                    setPolylangVerifyResult("success");
                    setPolylangVerifyMessage("");
                    // Auto-close after 3 seconds on success
                    setTimeout(() => setPolylangGuideOpen(false), 3000);
                  }, 1500);
                },
                onError: (err) => {
                  setPolylangVerifyResult("error");
                  setPolylangVerifyMessage(err instanceof Error ? err.message : "Error desconocido");
                },
              });
            };

            if (diagStatus === "ok") {
              return (
                <Alert className="border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 [&>svg]:text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Polylang conectado correctamente</AlertTitle>
                  <AlertDescription className="text-sm text-emerald-700 dark:text-emerald-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Los artículos se publican en {langLabels}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-0"
                      onClick={() => syncMutation.mutate(config.id)}
                      disabled={syncMutation.isPending}
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                      Reverificar
                    </Button>
                  </AlertDescription>
                </Alert>
              );
            }

            if (diagStatus === "error") {
              return (
                <>
                  <Alert
                    variant="destructive"
                    className="border-red-500/50 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 [&>svg]:text-red-600"
                  >
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error de conexión con Polylang</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p className="text-sm">La publicación multiidioma no funcionará. {polylangDiagnostic?.message}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-red-500/50 hover:bg-red-100 dark:hover:bg-red-950/40"
                        onClick={() => {
                          setPolylangVerifyResult(null);
                          setPolylangGuideOpen(true);
                        }}
                      >
                        <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                        Ver solución
                      </Button>
                    </AlertDescription>
                  </Alert>
                  <PolylangSetupGuide
                    open={polylangGuideOpen}
                    onOpenChange={setPolylangGuideOpen}
                    siteUrl={siteOrigin}
                    onVerify={handleVerifyInGuide}
                    isVerifying={syncMutation.isPending}
                    verifyResult={polylangVerifyResult}
                    verifyMessage={polylangVerifyMessage}
                  />
                </>
              );
            }

            // No diagnostic yet or unknown = yellow/warning
            return (
              <>
                <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 [&>svg]:text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Polylang detectado pero no configurado para API</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="text-sm">Los artículos solo se publicarán en el idioma principal.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-amber-500/50 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                      onClick={() => {
                        setPolylangVerifyResult(null);
                        setPolylangGuideOpen(true);
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                      Configurar ahora
                    </Button>
                  </AlertDescription>
                </Alert>
                <PolylangSetupGuide
                  open={polylangGuideOpen}
                  onOpenChange={setPolylangGuideOpen}
                  siteUrl={siteOrigin}
                  onVerify={handleVerifyInGuide}
                  isVerifying={syncMutation.isPending}
                  verifyResult={polylangVerifyResult}
                  verifyMessage={polylangVerifyMessage}
                />
              </>
            );
          })()}

        {/* Panel condicional: estado si conectado, troubleshoot si no */}
        <WordPressTroubleshootPanel
          siteId={siteId}
          isConnected={!!config}
          siteUrl={
            config?.site_url
              ? (() => {
                  try {
                    return new URL(config.site_url).origin;
                  } catch {
                    return config.site_url;
                  }
                })()
              : undefined
          }
          onResync={config ? () => syncMutation.mutate(config.id) : undefined}
          isSyncing={syncMutation.isPending}
          lastSync={wordpressContext?.analyzed_at}
        />
      </CardContent>
    </Card>
  );
}
