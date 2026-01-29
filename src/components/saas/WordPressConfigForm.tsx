import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Unplug, ExternalLink } from 'lucide-react';
import { useWordPressConfig, useUpsertWordPressConfig, useDeleteWordPressConfig } from '@/hooks/useWordPressConfigSaas';
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
      // Normalize: remove trailing slashes and /wp-admin
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
        <CardDescription className="space-y-2">
          <span className="block">Conecta tu sitio WordPress para publicar artículos directamente.</span>
          <a
            href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
          >
            ¿Cómo crear una contraseña de aplicación?
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="site_url" className="text-sm sm:text-base">URL del sitio</Label>
            <Input
              id="site_url"
              placeholder="https://tu-sitio.com"
              className="h-12 text-base"
              {...register('site_url')}
            />
            {errors.site_url && (
              <p className="text-sm text-destructive">{errors.site_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="wp_username" className="text-sm sm:text-base">Usuario de WordPress</Label>
            <Input
              id="wp_username"
              placeholder="admin"
              className="h-12 text-base"
              {...register('wp_username')}
            />
            {errors.wp_username && (
              <p className="text-sm text-destructive">{errors.wp_username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="wp_app_password" className="text-sm sm:text-base">Contraseña de aplicación</Label>
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
            {errors.wp_app_password && (
              <p className="text-sm text-destructive">{errors.wp_app_password.message}</p>
            )}
          </div>

          {/* Botones que se apilan en móvil */}
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
