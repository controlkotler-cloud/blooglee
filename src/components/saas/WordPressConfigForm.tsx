import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Unplug, HelpCircle, ChevronDown, BookOpen } from 'lucide-react';
import { useWordPressConfig, useUpsertWordPressConfig, useDeleteWordPressConfig } from '@/hooks/useWordPressConfigSaas';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
} from '@/components/ui/alert-dialog';

const formSchema = z.object({
  site_url: z
    .string()
    .min(1, 'La URL es obligatoria')
    .url('Introduce una URL válida')
    .transform((url) => {
      let normalized = url.trim();
      normalized = normalized.replace(/\/wp-admin\/?$/, '');
      normalized = normalized.replace(/\/+$/, '');
      return normalized;
    }),
  wp_username: z.string().min(1, 'El usuario es obligatorio'),
  wp_app_password: z.string().min(1, 'La contraseña de aplicación es obligatoria'),
});

type FormData = z.infer<typeof formSchema>;

interface WordPressConfigFormProps {
  siteId: string;
}

export function WordPressConfigForm({ siteId }: WordPressConfigFormProps) {
  const { data: config, isLoading } = useWordPressConfig(siteId);
  const upsertMutation = useUpsertWordPressConfig();
  const deleteMutation = useDeleteWordPressConfig();
  const [showPassword, setShowPassword] = useState(false);
  const [helpOpen, setHelpOpen] = useState(true);

  // Colapsar ayuda cuando ya hay config guardada
  useEffect(() => {
    if (config) setHelpOpen(false);
  }, [config]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
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

  const onSubmit = (data: FormData) => {
    upsertMutation.mutate({
      site_id: siteId,
      site_url: data.site_url,
      wp_username: data.wp_username,
      wp_app_password: data.wp_app_password,
    });
  };

  const handleDisconnect = () => {
    deleteMutation.mutate(siteId);
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
            <ChevronDown className={`w-4 h-4 ml-auto text-violet-600 dark:text-violet-400 transition-transform ${helpOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 space-y-4 bg-violet-50/50 dark:bg-violet-950/20 rounded-b-lg border-x border-b border-violet-100 dark:border-violet-900">
            {/* Paso 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium text-foreground">URL del sitio</p>
                <p className="text-sm text-muted-foreground">La dirección de tu WordPress (ej: https://miweb.com)</p>
              </div>
            </div>
            
            {/* Paso 2 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium text-foreground">Usuario de WordPress</p>
                <p className="text-sm text-muted-foreground">El usuario con el que accedes a tu panel de administración (wp-admin). Normalmente es "admin" o tu email.</p>
              </div>
            </div>
            
            {/* Paso 3 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium text-foreground">Contraseña de aplicación</p>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>No es tu contraseña normal</strong>. Es una clave especial que debes crear:
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                  <li>Ve a tu WordPress → <strong>Usuarios → Perfil</strong></li>
                  <li>Baja hasta la sección "<strong>Contraseñas de aplicación</strong>"</li>
                  <li>Escribe un nombre (ej: "Blooglee")</li>
                  <li>Clic en "<strong>Añadir nueva contraseña</strong>"</li>
                  <li>Copia la clave que aparece (solo se muestra una vez)</li>
                </ol>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Campo 1: URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold">1</span>
              <Label htmlFor="site_url" className="text-sm sm:text-base">URL del sitio</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>La dirección principal de tu WordPress</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="site_url"
              placeholder="https://miweb.com"
              className="h-12 text-base"
              {...register('site_url')}
            />
            <p className="text-xs text-muted-foreground">
              Ejemplo: https://miweb.com (sin /wp-admin)
            </p>
            {errors.site_url && (
              <p className="text-sm text-destructive">{errors.site_url.message}</p>
            )}
          </div>

          {/* Campo 2: Usuario */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold">2</span>
              <Label htmlFor="wp_username" className="text-sm sm:text-base">Usuario de WordPress</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>El usuario con el que entras a wp-admin</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="wp_username"
              placeholder="admin o tu@email.com"
              className="h-12 text-base"
              {...register('wp_username')}
            />
            <p className="text-xs text-muted-foreground">
              El mismo usuario con el que accedes a tu panel de WordPress
            </p>
            {errors.wp_username && (
              <p className="text-sm text-destructive">{errors.wp_username.message}</p>
            )}
          </div>

          {/* Campo 3: Contraseña de aplicación */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold">3</span>
              <Label htmlFor="wp_app_password" className="text-sm sm:text-base">Contraseña de aplicación</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>La clave que creaste en WordPress → Usuarios → Perfil → Contraseñas de aplicación</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Input
                id="wp_app_password"
                type={showPassword ? 'text' : 'password'}
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                className="h-12 text-base pr-20"
                {...register('wp_app_password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ No es tu contraseña normal. Créala en WordPress → Usuarios → Perfil
            </p>
            {errors.wp_app_password && (
              <p className="text-sm text-destructive">{errors.wp_app_password.message}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={upsertMutation.isPending || (!isDirty && !!config)}
              className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
            >
              {upsertMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {config ? 'Actualizar' : 'Guardar configuración'}
            </Button>

            {config && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" type="button" className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
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
      </CardContent>
    </Card>
  );
}
