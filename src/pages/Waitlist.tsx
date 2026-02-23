import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Check, Zap, Globe, FileText, Sparkles, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ProductMockup } from '@/components/saas/ProductMockup';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { useNewsletterSubscribe } from '@/hooks/useNewsletterSubscribe';

const benefits = [
  { icon: Sparkles, text: "Genera artículos con IA en segundos" },
  { icon: Globe, text: "Publica directamente en WordPress" },
  { icon: FileText, text: "SEO optimizado automáticamente" },
  { icon: Zap, text: "Múltiples idiomas soportados" },
];

const Waitlist = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const { toast } = useToast();
  const { subscribe } = useNewsletterSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Error',
        description: 'Por favor, introduce tu email',
        variant: 'destructive',
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: 'Error',
        description: 'Debes aceptar los términos de servicio y la política de privacidad',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await subscribe({
        name: name || 'Sin nombre',
        email,
        audience: 'empresas',
        gdprConsent: acceptTerms,
        marketingConsent: acceptMarketing,
        source: 'waitlist',
      });

      if (result.success) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast({
        title: 'Error',
        description: 'Ha ocurrido un error. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (isSuccess) {
    return (
      <div className="min-h-screen aurora-bg aurora-bg-intense flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fade-in-up">
          <div className="glass-card-strong rounded-3xl p-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-3">
              ¡Estás en la lista!
            </h1>
            <p className="text-muted-foreground mb-6">
              Te avisaremos en cuanto abramos las puertas. Prepárate para automatizar tu blog.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg aurora-bg-intense">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 px-6 py-5">
        <div className="container-custom flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Inicio</span>
          </Link>
          
          <Link to="/" className="flex items-center gap-2.5">
            <BloogleeLogo size="md" />
          </Link>
          
          <div className="w-20" />
        </div>
      </nav>

      {/* Main content */}
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-24 lg:px-16">
          <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="mb-10 animate-fade-in-up">
              <div className="badge-aurora badge-aurora-glow mb-4">
                <Mail className="w-3.5 h-3.5" />
                <span>Próximamente</span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold mb-3">
                Únete a la <span className="text-aurora">lista de espera</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Sé de los primeros en automatizar tu blog con IA. Acceso anticipado + precio especial de lanzamiento.
              </p>
            </div>

            {/* Form Card */}
            <div className="glass-card-strong rounded-3xl p-8 animate-fade-in-up delay-100">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground/80">
                    Nombre <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="h-12 input-aurora"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12 input-aurora"
                    required
                  />
                </div>

                {/* Consent checkboxes */}
                <div className="space-y-3 pt-2">
                  {/* Obligatorio: Términos y Privacidad */}
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="terms" 
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                      disabled={isLoading}
                      className="mt-0.5"
                    />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      He leído y acepto los{' '}
                      <Link to="/terms" className="text-primary hover:underline" target="_blank">
                        términos de servicio
                      </Link>{' '}
                      y la{' '}
                      <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                        política de privacidad
                      </Link>
                      <span className="text-destructive"> *</span>
                    </Label>
                  </div>

                  {/* Opcional: Comunicaciones comerciales */}
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="marketing" 
                      checked={acceptMarketing}
                      onCheckedChange={(checked) => setAcceptMarketing(checked === true)}
                      disabled={isLoading}
                      className="mt-0.5"
                    />
                    <Label htmlFor="marketing" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      Acepto recibir comunicaciones comerciales y novedades sobre Blooglee
                    </Label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-aurora w-full h-12 text-base"
                  disabled={isLoading}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Apuntándote...
                      </>
                    ) : (
                      <>
                        Quiero acceso anticipado
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </>
                    )}
                  </span>
                </button>
              </form>
              
              <p className="text-center text-xs text-muted-foreground mt-6">
                Sin spam. Solo te avisaremos cuando esté listo.
              </p>
            </div>

            {/* Benefits list */}
            <div className="mt-8 space-y-3 animate-fade-in-up delay-200">
              <p className="text-sm font-medium text-foreground/80 mb-4">
                Qué conseguirás con Blooglee:
              </p>
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  {benefit.text}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right side - Product showcase */}
        <div className="hidden lg:flex w-1/2 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          
          <div className="relative z-10 w-full max-w-xl animate-slide-in-right">
            <ProductMockup />
            
            <div className="text-center mt-12 animate-fade-in-up delay-300">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                +500 empresas ya en la lista de espera
              </p>
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-warning fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm font-semibold">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;
