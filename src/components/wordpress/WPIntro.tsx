import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, ArrowLeft, Mail } from 'lucide-react';

interface WPIntroProps {
  onHasWordPress: () => void;
  onSkip: () => void;
}

type InfoPanel = null | 'no_blog' | 'not_sure';

export function WPIntro({ onHasWordPress, onSkip }: WPIntroProps) {
  const [showPanel, setShowPanel] = useState<InfoPanel>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-display font-bold text-foreground">
          Conectar tu WordPress
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Para que Blooglee pueda publicar artículos en tu blog, necesitamos conectarnos a tu WordPress.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground text-center">¿Tienes un blog en WordPress?</p>

        <div className="grid gap-3">
          {/* Yes */}
          <button
            onClick={onHasWordPress}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-card text-left transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Sí, tengo un WordPress</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
          </button>

          {/* No */}
          <button
            onClick={() => setShowPanel('no_blog')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              showPanel === 'no_blog'
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">No tengo blog todavía</p>
            </div>
          </button>

          {/* Not sure */}
          <button
            onClick={() => setShowPanel('not_sure')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              showPanel === 'not_sure'
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <HelpCircle className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">No estoy seguro</p>
            </div>
          </button>
        </div>
      </div>

      {/* Info panels */}
      {showPanel === 'no_blog' && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-foreground">
              ¡No te preocupes! Blooglee funciona con WordPress. Si todavía no tienes blog, puedes pedir a tu empresa de hosting o tu informático que instale WordPress.
            </p>
            <p className="text-sm text-muted-foreground">
              Si necesitas ayuda, escríbenos a{' '}
              <a href="mailto:soporte@blooglee.com" className="text-primary hover:underline inline-flex items-center gap-1">
                <Mail className="w-3 h-3" />
                soporte@blooglee.com
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              Mientras tanto, puedes seguir usando Blooglee para generar artículos y guardarlos como borradores.
            </p>
            <Button variant="outline" onClick={onSkip} className="w-full">
              Continuar sin WordPress →
            </Button>
          </CardContent>
        </Card>
      )}

      {showPanel === 'not_sure' && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">¿Cómo saberlo?</p>
            <p className="text-sm text-muted-foreground">
              Si tu web termina en <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/wp-admin/</code> al añadirlo a tu dirección web, es WordPress.
            </p>
            <p className="text-sm text-muted-foreground">
              Prueba: escribe tu dirección seguida de <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/wp-admin/</code> en el navegador. ¿Aparece una pantalla de login? ¡Es WordPress!
            </p>
            <div className="flex gap-2">
              <Button onClick={onHasWordPress} className="flex-1">
                Sí, es WordPress →
              </Button>
              <Button variant="outline" onClick={onSkip} className="flex-1">
                No es WordPress
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
