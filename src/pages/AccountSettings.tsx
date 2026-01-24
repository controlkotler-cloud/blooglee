import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSites } from '@/hooks/useSites';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { PlanBadge } from '@/components/saas/PlanBadge';
import { UsageStats } from '@/components/saas/UsageStats';
import { useAllArticlesSaas } from '@/hooks/useArticlesSaas';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: sites = [] } = useSites();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: articles = [] } = useAllArticlesSaas(currentMonth, currentYear);

  const plan = (profile?.plan || 'free') as 'free' | 'starter' | 'pro' | 'agency';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <BloogleeLogo size="md" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Configuración de cuenta</h1>

        <div className="space-y-6">
          {/* Profile info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-sm text-muted-foreground">Email de la cuenta</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Plan actual</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.sites_limit} sitio{profile?.sites_limit !== 1 ? 's' : ''} incluido{profile?.sites_limit !== 1 ? 's' : ''}
                  </p>
                </div>
                <PlanBadge plan={plan} size="lg" />
              </div>
            </CardContent>
          </Card>

          {/* Usage stats */}
          <UsageStats
            sitesUsed={sites.length}
            sitesLimit={profile?.sites_limit ?? 1}
            articlesThisMonth={articles.length}
            nextGenerationDate="1 de febrero"
          />

          {/* Security */}
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
                  <p className="font-medium">Contraseña</p>
                  <p className="text-sm text-muted-foreground">
                    Última actualización desconocida
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Cambiar contraseña
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                El cambio de contraseña estará disponible próximamente
              </p>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Zona de peligro
              </CardTitle>
              <CardDescription>
                Acciones irreversibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" disabled>
                Eliminar cuenta
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                La eliminación de cuenta estará disponible próximamente
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
