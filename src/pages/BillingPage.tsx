import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Check, X, Crown, Sparkles, CreditCard, FileText, Receipt,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useSites } from '@/hooks/useSites';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { PlanBadge, type PlanType } from '@/components/saas/PlanBadge';
import { useAllArticlesSaas } from '@/hooks/useArticlesSaas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface PlanDef {
  id: PlanType;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  excluded: string[];
  sites: string;
  articles: string;
  popular: boolean;
  postsLimit: number | null;
  sitesLimit: number;
}

const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    sites: '1 sitio',
    articles: '4 artículos/mes',
    sitesLimit: 1,
    postsLimit: 4,
    features: [
      'Hasta 1 sitio',
      '4 artículos/mes',
      'SEO básico optimizado',
      'Imágenes con IA',
    ],
    excluded: [
      'Publicación automática',
      'Programación de publicaciones',
      'Soporte dedicado',
    ],
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 19,
    annualPrice: 15,
    sites: '1 sitio',
    articles: '10 artículos/mes',
    sitesLimit: 1,
    postsLimit: 10,
    features: [
      'Hasta 1 sitio',
      '10 artículos/mes',
      'SEO avanzado (meta tags, schema, internal linking)',
      'Imágenes con IA + paleta de marca',
      'Publicación automática en WordPress',
      'Programación de publicaciones',
      'Soporte por email (<24h)',
    ],
    excluded: [],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 49,
    annualPrice: 39,
    sites: '5 sitios',
    articles: '50 artículos/mes',
    sitesLimit: 5,
    postsLimit: 50,
    features: [
      'Hasta 5 sitios',
      '50 artículos/mes',
      'Todo lo de Starter +',
      'Temas personalizados por sitio',
      'Perfil de contenido avanzado',
      'Analíticas de rendimiento',
      'Soporte prioritario (<4h)',
    ],
    excluded: [],
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 149,
    annualPrice: 119,
    sites: '25 sitios',
    articles: 'Ilimitados',
    sitesLimit: 25,
    postsLimit: null,
    features: [
      'Hasta 25 sitios',
      'Artículos ilimitados',
      'Todo lo de Pro +',
      'Dashboard multi-cliente',
      'Vista tabla para gestión masiva',
      'Exportación e informes',
      'Acceso API (próximamente)',
      'White-label (próximamente)',
      'Soporte dedicado por WhatsApp',
    ],
    excluded: [],
    popular: false,
  },
];

const PLAN_ORDER: PlanType[] = ['free', 'starter', 'pro', 'agency'];

export default function BillingPage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: sites = [] } = useSites();
  const queryClient = useQueryClient();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: articles = [] } = useAllArticlesSaas(currentMonth, currentYear);

  const currentPlan = (profile?.plan || 'free') as PlanType;
  const currentPlanDef = PLANS.find(p => p.id === currentPlan)!;

  const [isAnnual, setIsAnnual] = useState(false);

  // Billing data form (pre-filled from profile)
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || '');
      setTaxId(profile.tax_id || '');
      setBillingAddress(profile.billing_address || '');
    }
  }, [profile]);

  const billingDirty = useMemo(() => {
    if (!profile) return false;
    return (
      companyName !== (profile.company_name || '') ||
      taxId !== (profile.tax_id || '') ||
      billingAddress !== (profile.billing_address || '')
    );
  }, [profile, companyName, taxId, billingAddress]);

  const saveBilling = useMutation({
    mutationFn: async () => {
      if (!profile?.user_id) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: companyName || null,
          tax_id: taxId || null,
          billing_address: billingAddress || null,
        })
        .eq('user_id', profile.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Datos de facturación guardados');
    },
    onError: () => toast.error('Error al guardar'),
  });

  // Usage stats
  const sitesPercentage = Math.min((sites.length / (profile?.sites_limit ?? 1)) * 100, 100);
  const postsLimit = currentPlanDef.postsLimit;
  const postsPercentage = postsLimit ? Math.min((articles.length / postsLimit) * 100, 100) : 0;

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

      <main className="container mx-auto px-4 py-6 max-w-6xl space-y-8 pb-16">
        {/* PART 1 — Current Plan Banner */}
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <PlanBadge plan={currentPlan} size="lg" />
                <div>
                  <p className="font-semibold">Tu plan actual: {currentPlanDef.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentPlanDef.monthlyPrice === 0 ? 'Gratis' : `${currentPlanDef.monthlyPrice}€/mes`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-1 text-sm">
                <span className="text-muted-foreground">
                  {sites.length}/{profile?.sites_limit ?? 1} sitios · {articles.length}/{postsLimit ?? '∞'} artículos este mes
                </span>
                {currentPlan !== 'free' && (
                  <span className="text-muted-foreground text-xs">
                    Se renueva el 1 de cada mes
                  </span>
                )}
              </div>
            </div>

            {/* Usage bars */}
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Sitios</span>
                  <span>{sites.length} de {profile?.sites_limit ?? 1}</span>
                </div>
                <Progress
                  value={sitesPercentage}
                  className={cn(
                    'h-2',
                    sitesPercentage >= 100 ? '[&>div]:bg-destructive' : sitesPercentage >= 80 ? '[&>div]:bg-orange-500' : ''
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Artículos este mes</span>
                  <span>{articles.length} de {postsLimit ?? '∞'}</span>
                </div>
                {postsLimit ? (
                  <Progress
                    value={postsPercentage}
                    className={cn(
                      'h-2',
                      postsPercentage >= 100 ? '[&>div]:bg-destructive' : postsPercentage >= 80 ? '[&>div]:bg-orange-500' : ''
                    )}
                  />
                ) : (
                  <Progress value={0} className="h-2" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PART 2 — Plan Comparison */}
        <div>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold font-display mb-2">Planes y facturación</h1>
            <p className="text-muted-foreground mb-4">Elige el plan que mejor se adapte a tu negocio</p>

            {/* Toggle */}
            <div className="inline-flex items-center rounded-full border p-1 bg-muted/50">
              <button
                onClick={() => setIsAnnual(false)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  !isAnnual ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Mensual
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5',
                  isAnnual ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Anual
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">-20%</Badge>
              </button>
            </div>
          </div>

          {/* Plan cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const currentIdx = PLAN_ORDER.indexOf(currentPlan);
              const planIdx = PLAN_ORDER.indexOf(plan.id);
              const isUpgrade = planIdx > currentIdx;
              const isDowngrade = planIdx < currentIdx;
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              const showStrikethrough = isAnnual && plan.monthlyPrice > 0;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col',
                    plan.popular && 'border-primary shadow-lg ring-1 ring-primary/20',
                    isCurrent && 'border-primary/50 bg-primary/[0.03]'
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-sm">
                      Más popular
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="outline" className="absolute -top-3 right-4 bg-card border-primary/50 text-primary text-[10px]">
                      Tu plan actual
                    </Badge>
                  )}

                  <CardHeader className="pb-2 text-center">
                    <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-1">
                    {/* Price */}
                    <div className="text-center mb-5">
                      {showStrikethrough && (
                        <span className="text-sm line-through text-muted-foreground mr-1.5">
                          {plan.monthlyPrice}€
                        </span>
                      )}
                      <span className="text-3xl font-bold font-display">
                        {price === 0 ? 'Gratis' : `${price}€`}
                      </span>
                      {price > 0 && (
                        <span className="text-sm text-muted-foreground">/mes</span>
                      )}
                      {isAnnual && price > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Facturado anualmente ({price * 12}€/año)
                        </p>
                      )}
                    </div>

                    <Separator className="mb-4" />

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                      {plan.excluded.map((f, i) => (
                        <li key={`ex-${i}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <X className="w-4 h-4 shrink-0 mt-0.5 opacity-40" />
                          <span className="line-through">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      className="w-full mt-auto"
                      variant={isCurrent ? 'secondary' : plan.popular ? 'default' : 'outline'}
                      disabled={isCurrent}
                    >
                      {isCurrent ? (
                        'Plan actual'
                      ) : isUpgrade ? (
                        <>
                          <Crown className="w-4 h-4 mr-1" />
                          Elegir {plan.name}
                        </>
                      ) : isDowngrade ? (
                        'Downgrade'
                      ) : (
                        `Elegir ${plan.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* PART 3 — Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Historial de facturación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                El historial de facturación estará disponible próximamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PART 4 — Billing Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de facturación</CardTitle>
            <CardDescription>Estos datos aparecerán en tus facturas mensuales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billingCompany">Nombre o razón social</Label>
                <Input
                  id="billingCompany"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Mi empresa S.L."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingTaxId">NIF/CIF</Label>
                <Input
                  id="billingTaxId"
                  value={taxId}
                  onChange={e => setTaxId(e.target.value)}
                  placeholder="B12345678"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="billingAddr">Dirección de facturación</Label>
                <Input
                  id="billingAddr"
                  value={billingAddress}
                  onChange={e => setBillingAddress(e.target.value)}
                  placeholder="Calle, nº, CP, Ciudad"
                />
              </div>
            </div>
            <Button
              onClick={() => saveBilling.mutate()}
              disabled={!billingDirty || saveBilling.isPending}
              className="w-full sm:w-auto"
            >
              {saveBilling.isPending ? 'Guardando...' : 'Guardar datos de facturación'}
            </Button>
          </CardContent>
        </Card>

        {/* PART 5 — Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Método de pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                La gestión de pagos estará disponible próximamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
