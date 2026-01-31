import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useValidateBetaToken } from '@/hooks/useBetaInvitations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, AlertTriangle, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BetaSignup() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const validateToken = useValidateBetaToken();

  const [invitation, setInvitation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError('Token no proporcionado');
        setIsValidating(false);
        return;
      }

      try {
        const result = await validateToken.mutateAsync(token);
        if (result) {
          setInvitation(result);
          setIsValid(true);
        } else {
          setError('Este enlace de invitación no es válido, ha expirado o ha alcanzado el límite de usos.');
        }
      } catch (err) {
        setError('Error al validar el enlace de invitación.');
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!acceptTerms) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            beta_invitation_id: invitation.id,
            is_beta: true,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // The trigger will create the profile, but we need to update beta fields
        // Wait a moment for the trigger to execute
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update profile with beta information
        const betaStartedAt = new Date();
        const betaExpiresAt = new Date();
        betaExpiresAt.setMonth(betaExpiresAt.getMonth() + 3);

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_beta: true,
            beta_started_at: betaStartedAt.toISOString(),
            beta_expires_at: betaExpiresAt.toISOString(),
            beta_invitation_id: invitation.id,
            plan: 'starter',
            sites_limit: 1,
            posts_limit: 4,
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        // Add beta role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'beta',
          });

        if (roleError) {
          console.error('Error adding beta role:', roleError);
        }

        // Increment invitation uses
        const { error: incrementError } = await supabase
          .from('beta_invitations')
          .update({ current_uses: invitation.current_uses + 1 })
          .eq('id', invitation.id);

        if (incrementError) {
          console.error('Error incrementing uses:', incrementError);
        }

        toast.success('¡Cuenta creada! Por favor, verifica tu email para activar tu cuenta.');
        navigate('/auth?verified=pending');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.message?.includes('already registered')) {
        toast.error('Este email ya está registrado. Por favor, inicia sesión.');
      } else {
        toast.error(err.message || 'Error al crear la cuenta');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validando invitación...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValid || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Invitación no válida</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Si crees que esto es un error, contacta con nosotros en{' '}
              <a href="mailto:info@blooglee.com" className="text-primary hover:underline">
                info@blooglee.com
              </a>
            </p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid token - show signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">¡Bienvenido al programa Beta!</CardTitle>
          <CardDescription>
            Has sido invitado a probar Blooglee durante 3 meses completamente gratis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-violet-200 bg-violet-50">
            <Check className="h-4 w-4 text-violet-600" />
            <AlertDescription className="text-violet-700">
              <strong>Plan Starter incluido:</strong> 1 sitio web, 4 artículos/mes, 
              integración con WordPress y más.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar contraseña</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                Acepto los{' '}
                <Link to="/terms" className="text-primary hover:underline">
                  términos y condiciones
                </Link>{' '}
                y la{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  política de privacidad
                </Link>
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Unirme al programa Beta'
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link to="/auth" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
