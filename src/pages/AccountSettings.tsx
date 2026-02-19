import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, Camera, CheckCircle2, Shield, Bell, Globe, AlertTriangle, Trash2, Lock, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, type NotificationPreferences } from '@/hooks/useProfile';
import { useSites } from '@/hooks/useSites';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { PlanBadge } from '@/components/saas/PlanBadge';
import { useAllArticlesSaas } from '@/hooks/useArticlesSaas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const PLAN_LIMITS: Record<string, { posts: number | null }> = {
  free: { posts: 1 },
  starter: { posts: 4 },
  pro: { posts: 30 },
  agency: { posts: null }, // unlimited
};

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: sites = [] } = useSites();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: articles = [] } = useAllArticlesSaas(currentMonth, currentYear);

  const plan = (profile?.plan || 'free') as 'free' | 'starter' | 'pro' | 'agency';

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    article_published: true,
    pre_publish_review: true,
    weekly_summary: true,
    product_updates: false,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Sync profile to form
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCompanyName(profile.company_name || '');
      setTaxId(profile.tax_id || '');
      setBillingAddress(profile.billing_address || '');
      setTimezone(profile.timezone || 'Europe/Madrid');
      if (profile.notification_preferences) {
        setNotifications(profile.notification_preferences);
      }
    }
  }, [profile]);

  // Dirty detection
  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      fullName !== (profile.full_name || '') ||
      phone !== (profile.phone || '') ||
      companyName !== (profile.company_name || '') ||
      taxId !== (profile.tax_id || '') ||
      billingAddress !== (profile.billing_address || '') ||
      timezone !== (profile.timezone || 'Europe/Madrid') ||
      JSON.stringify(notifications) !== JSON.stringify(profile.notification_preferences || {
        article_published: true, pre_publish_review: true, weekly_summary: true, product_updates: false,
      })
    );
  }, [profile, fullName, phone, companyName, taxId, billingAddress, timezone, notifications]);

  // Save profile mutation
  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          phone: phone || null,
          company_name: companyName || null,
          tax_id: taxId || null,
          billing_address: billingAddress || null,
          timezone,
          notification_preferences: notifications as any,
        })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Cambios guardados');
    },
    onError: () => toast.error('Error al guardar los cambios'),
  });

  // Avatar upload
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('No user');
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);
      if (updateError) throw updateError;
      return avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Foto actualizada');
    },
    onError: () => toast.error('Error al subir la foto'),
  });

  // Delete account
  const deleteAccount = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: 'ELIMINAR' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: async () => {
      toast.success('Cuenta eliminada');
      await signOut();
      navigate('/');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  // Reset password
  const resetPassword = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error('No email');
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Email de cambio de contraseña enviado. Revisa tu bandeja de entrada.'),
    onError: () => toast.error('Error al enviar el email'),
  });

  const initials = useMemo(() => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || '?';
  }, [fullName, user?.email]);

  const sitesPercentage = Math.min((sites.length / (profile?.sites_limit ?? 1)) * 100, 100);
  const postsLimit = PLAN_LIMITS[plan]?.posts;
  const postsPercentage = postsLimit ? Math.min((articles.length / postsLimit) * 100, 100) : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen no puede superar los 2MB');
        return;
      }
      uploadAvatar.mutate(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <BloogleeLogo size="md" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-8 pb-16">
        <h1 className="text-2xl font-bold font-display">Configuración de cuenta</h1>

        {/* SECTION 1 — Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tu cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-xl">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="rounded-xl text-lg font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatar.isPending}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  {uploadAvatar.isPending ? 'Subiendo...' : 'Cambiar foto'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">JPG o PNG, máx. 2MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Tu nombre" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input id="email" value={user?.email || ''} disabled className="pr-24" />
                  <Badge variant="outline" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 600 000 000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa / Nombre comercial</Label>
                <Input id="company" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Mi empresa S.L." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">NIF/CIF <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="taxId" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="B12345678" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="billing">Dirección de facturación <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="billing" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Calle, nº, CP, Ciudad" />
              </div>
            </div>

            <Button
              onClick={() => saveProfile.mutate()}
              disabled={!isDirty || saveProfile.isPending}
              className="w-full sm:w-auto"
            >
              {saveProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </CardContent>
        </Card>

        {/* SECTION 2 — Plan & Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tu plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <PlanBadge plan={plan} size="lg" />
              {plan === 'free' && (
                <span className="text-sm text-muted-foreground">Plan gratuito</span>
              )}
            </div>

            {/* Sites usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sitios</span>
                <span className={sitesPercentage >= 100 ? 'text-destructive font-medium' : sitesPercentage >= 80 ? 'text-orange-500 font-medium' : ''}>
                  {sites.length} de {profile?.sites_limit ?? 1}
                </span>
              </div>
              <Progress
                value={sitesPercentage}
                className={sitesPercentage >= 100 ? '[&>div]:bg-destructive' : sitesPercentage >= 80 ? '[&>div]:bg-orange-500' : ''}
              />
              {sitesPercentage >= 100 && (
                <p className="text-xs text-destructive">Has alcanzado el límite de sitios</p>
              )}
            </div>

            {/* Posts usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Artículos este mes</span>
                <span className={postsLimit && postsPercentage >= 100 ? 'text-destructive font-medium' : postsLimit && postsPercentage >= 80 ? 'text-orange-500 font-medium' : ''}>
                  {articles.length} de {postsLimit ?? '∞'}
                </span>
              </div>
              {postsLimit && (
                <Progress
                  value={postsPercentage}
                  className={postsPercentage >= 100 ? '[&>div]:bg-destructive' : postsPercentage >= 80 ? '[&>div]:bg-orange-500' : ''}
                />
              )}
            </div>

            <Button variant="outline" onClick={() => navigate('/billing')} className="w-full sm:w-auto">
              Cambiar plan →
            </Button>

            {plan === 'free' && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Pasa a Starter para publicación automática y soporte por email</p>
                    <Button variant="link" className="px-0 h-auto text-sm" onClick={() => navigate('/pricing')}>
                      Ver planes →
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3 — Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Contraseña</p>
                <p className="text-xs text-muted-foreground">Cambia tu contraseña via email seguro</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetPassword.mutate()}
                disabled={resetPassword.isPending}
              >
                <Lock className="w-4 h-4 mr-1" />
                {resetPassword.isPending ? 'Enviando...' : 'Cambiar contraseña'}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="font-medium text-sm">Autenticación de dos factores</p>
                <p className="text-xs text-muted-foreground">Añade una capa extra de seguridad</p>
              </div>
              <Badge variant="outline" className="text-xs">Próximamente</Badge>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4 — Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Preferencias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language */}
            <div className="space-y-2">
              <Label>Idioma de la interfaz</Label>
              <Select defaultValue="es" disabled>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="ca" disabled>Catalán (próximamente)</SelectItem>
                  <SelectItem value="en" disabled>English (próximamente)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Notifications */}
            <div className="space-y-3">
              <Label>Notificaciones por email</Label>
              {[
                { key: 'article_published' as const, label: 'Avisarme cuando un artículo se publique automáticamente' },
                { key: 'pre_publish_review' as const, label: 'Avisarme antes de publicar (si tengo revisión activada)' },
                { key: 'weekly_summary' as const, label: 'Resumen semanal de actividad' },
                { key: 'product_updates' as const, label: 'Novedades y actualizaciones de Blooglee' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-start gap-3">
                  <Checkbox
                    id={key}
                    checked={notifications[key]}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, [key]: !!checked }))
                    }
                  />
                  <Label htmlFor={key} className="text-sm font-normal leading-tight cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>

            <Separator />

            {/* Timezone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Zona horaria
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Madrid">Europe/Madrid (Península y Baleares)</SelectItem>
                  <SelectItem value="Atlantic/Canary">Atlantic/Canary (Islas Canarias)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="America/Mexico_City">America/Mexico_City</SelectItem>
                  <SelectItem value="America/Bogota">America/Bogota</SelectItem>
                  <SelectItem value="America/Buenos_Aires">America/Buenos_Aires</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Afecta a la hora de publicación programada</p>
            </div>

            <Button
              onClick={() => saveProfile.mutate()}
              disabled={!isDirty || saveProfile.isPending}
              className="w-full sm:w-auto"
            >
              {saveProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </CardContent>
        </Card>

        {/* SECTION 5 — Danger Zone */}
        <Card className="border-destructive/30 bg-destructive/[0.02]">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Zona de peligro
            </CardTitle>
            <CardDescription>Acciones irreversibles</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
              setIsDeleteDialogOpen(open);
              if (!open) setDeleteConfirmation('');
            }}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar mi cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <span className="block">
                      Se eliminarán todos tus sitios, artículos y configuraciones. Se desconectará WordPress de todos los sitios. Esta acción no se puede deshacer.
                    </span>
                    <span className="block font-medium text-foreground">
                    Escribe <span className="font-mono text-destructive">ELIMINAR</span> para confirmar:
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirmation}
                  onChange={e => setDeleteConfirmation(e.target.value)}
                  placeholder="ELIMINAR"
                  className="font-mono"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    disabled={deleteConfirmation !== 'ELIMINAR' || deleteAccount.isPending}
                    onClick={() => deleteAccount.mutate()}
                  >
                    {deleteAccount.isPending ? 'Eliminando...' : 'Eliminar cuenta definitivamente'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
