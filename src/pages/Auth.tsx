import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ArrowLeft, Loader2, Check, Zap, Globe, FileText } from 'lucide-react';
import { ProductMockup } from '@/components/saas/ProductMockup';

const benefits = [
  { icon: Sparkles, text: "Genera artículos con IA en segundos" },
  { icon: Globe, text: "Publica directamente en WordPress" },
  { icon: FileText, text: "SEO optimizado automáticamente" },
  { icon: Zap, text: "Múltiples idiomas soportados" },
];

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, session, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Por favor, introduce email y contraseña',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    if (isSignUp) {
      const { error } = await signUp(email, password);
      setIsLoading(false);

      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
          errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
        }
        toast({
          title: 'Error al registrarse',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Cuenta creada!',
          description: 'Ya puedes acceder a tu panel.',
        });
      }
    } else {
      const { error } = await signIn(email, password);
      setIsLoading(false);

      if (error) {
        toast({
          title: 'Error al iniciar sesión',
          description: error.message === 'Invalid login credentials' 
            ? 'Credenciales incorrectas' 
            : error.message,
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg aurora-bg-intense">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Cargando...</span>
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">Blooglee</span>
          </Link>
          
          <div className="w-20" /> {/* Spacer for centering */}
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
                <Zap className="w-3.5 h-3.5" />
                <span>{isSignUp ? 'Empieza gratis' : 'Bienvenido de nuevo'}</span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold mb-3">
                {isSignUp ? (
                  <>Tu blog en <span className="text-aurora">piloto automático</span></>
                ) : (
                  <>Accede a <span className="text-aurora">tu panel</span></>
                )}
              </h1>
              <p className="text-lg text-muted-foreground">
                {isSignUp 
                  ? 'Crea contenido profesional con IA. Sin esfuerzo.'
                  : 'Continúa donde lo dejaste.'
                }
              </p>
            </div>

            {/* Form Card */}
            <div className="glass-card-strong rounded-3xl p-8 animate-fade-in-up delay-100">
              <form onSubmit={handleSubmit} className="space-y-5">
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12 input-aurora"
                  />
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
                        {isSignUp ? 'Creando cuenta...' : 'Entrando...'}
                      </>
                    ) : (
                      <>
                        {isSignUp ? 'Crear cuenta gratis' : 'Iniciar sesión'}
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </>
                    )}
                  </span>
                </button>
              </form>
              
              {/* Divider */}
              <div className="relative my-6">
                <div className="divider-aurora" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">o</span>
                </div>
              </div>

              {/* Toggle */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors link-underline"
                >
                  {isSignUp 
                    ? '¿Ya tienes cuenta? Inicia sesión' 
                    : '¿No tienes cuenta? Regístrate gratis'
                  }
                </button>
              </div>
            </div>

            {/* Benefits list - only on signup */}
            {isSignUp && (
              <div className="mt-8 space-y-3 animate-fade-in-up delay-200">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    {benefit.text}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-8">
              Al continuar, aceptas nuestros{' '}
              <Link to="/terms" className="text-primary hover:underline">
                términos de servicio
              </Link>{' '}
              y{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                política de privacidad
              </Link>
            </p>
          </div>
        </div>

        {/* Right side - Product showcase */}
        <div className="hidden lg:flex w-1/2 items-center justify-center p-12 relative overflow-hidden">
          {/* Extra aurora glow on this side */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          
          <div className="relative z-10 w-full max-w-xl animate-slide-in-right">
            <ProductMockup />
            
            {/* Tagline below mockup */}
            <div className="text-center mt-12 animate-fade-in-up delay-300">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Más de 500 empresas ya confían en nosotros
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

export default Auth;
