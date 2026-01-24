import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useSites } from '@/hooks/useSites';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { PlanBadge, type PlanType } from '@/components/saas/PlanBadge';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'free' as PlanType,
    name: 'Free',
    price: '0€',
    period: '/mes',
    description: 'Para empezar',
    features: ['1 sitio', 'Primer artículo gratis', 'Generación manual'],
    cta: 'Plan actual',
    popular: false,
  },
  {
    id: 'starter' as PlanType,
    name: 'Starter',
    price: '19€',
    period: '/mes',
    description: 'Para creadores',
    features: ['1 sitio', 'Hasta 4 artículos/mes', 'Generación automática', 'Publicación a WordPress'],
    cta: 'Actualizar',
    popular: false,
  },
  {
    id: 'pro' as PlanType,
    name: 'Pro',
    price: '49€',
    period: '/mes',
    description: 'Para profesionales',
    features: ['Hasta 3 sitios', '30 artículos/mes', 'Generación automática', 'Publicación a WordPress', 'Soporte prioritario'],
    cta: 'Actualizar',
    popular: true,
  },
  {
    id: 'agency' as PlanType,
    name: 'Agency',
    price: '149€',
    period: '/mes',
    description: 'Para agencias',
    features: ['Hasta 10 sitios', 'Artículos ilimitados', 'Generación automática', 'Publicación a WordPress', 'Soporte prioritario', 'API access'],
    cta: 'Contactar',
    popular: false,
  },
];

export default function BillingPage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: sites = [] } = useSites();

  const currentPlan = (profile?.plan || 'free') as PlanType;

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

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Planes y facturación</h1>
            <p className="text-muted-foreground">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </div>

          {/* Current plan summary */}
          <Card className="mb-8">
            <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <PlanBadge plan={currentPlan} size="lg" />
                <div>
                  <p className="font-medium">
                    {sites.length} de {profile?.sites_limit} sitios usados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Plan actual: {plans.find(p => p.id === currentPlan)?.name}
                  </p>
                </div>
              </div>
              {currentPlan !== 'free' && (
                <p className="text-sm text-muted-foreground">
                  Próxima facturación: 1 de febrero
                </p>
              )}
            </CardContent>
          </Card>

          {/* Plans grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isUpgrade = plans.findIndex(p => p.id === plan.id) > plans.findIndex(p => p.id === currentPlan);

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative',
                    plan.popular && 'border-primary shadow-lg',
                    isCurrent && 'bg-muted/30'
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>

                    <ul className="space-y-2 mb-6 text-sm text-left">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={isCurrent ? 'secondary' : plan.popular ? 'default' : 'outline'}
                      disabled={isCurrent}
                    >
                      {isCurrent ? (
                        'Plan actual'
                      ) : isUpgrade ? (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          {plan.cta}
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Billing history placeholder */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Historial de facturación</CardTitle>
              <CardDescription>
                Tu historial de pagos aparecerá aquí
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No hay facturas todavía
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
