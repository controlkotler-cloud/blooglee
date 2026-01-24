import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';

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
      navigate('/', { replace: true });
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
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-hero-gradient">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Volver al inicio</span>
        </Link>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4 shadow-glow">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-gradient mb-2">
              Blooglee
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? 'Crea tu cuenta para empezar' : 'Accede a tu panel de gestión'}
            </p>
          </div>

          {/* Card del formulario */}
          <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 input-styled"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 input-styled"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 btn-gradient text-white font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isSignUp ? 'Creando cuenta...' : 'Entrando...'}
                    </>
                  ) : (
                    isSignUp ? 'Crear cuenta' : 'Iniciar sesión'
                  )}
                </Button>
              </form>
              
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o</span>
                </div>
              </div>

              {/* Toggle sign up / sign in */}
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
            </CardContent>
          </Card>

          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
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
    </div>
  );
};

export default Auth;
