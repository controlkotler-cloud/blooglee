import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface WPAppPasswordGuideProps {
  siteUrl: string;
  onBack: () => void;
  onContinue: () => void;
}

export function WPAppPasswordGuide({ siteUrl, onBack, onContinue }: WPAppPasswordGuideProps) {
  const [showHelp, setShowHelp] = useState(false);
  const origin = (() => {
    try { return new URL(siteUrl).origin; } catch { return siteUrl.replace(/\/+$/, ''); }
  })();
  const profileUrl = `${origin}/wp-admin/profile.php`;
  const wpAdminUrl = `${origin}/wp-admin/`;
  const totalSteps = 5;

  const steps = [
    {
      number: 1,
      title: 'Entra en tu WordPress',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Haz clic en este enlace para abrir tu WordPress en una nueva pestaña:
          </p>
          <Button variant="outline" asChild className="w-full">
            <a href={wpAdminUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir mi WordPress →
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Si te pide usuario y contraseña, entra con tus datos habituales de WordPress.
          </p>
        </div>
      ),
    },
    {
      number: 2,
      title: 'Ve a tu perfil de usuario',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Una vez dentro de WordPress, ve al menú lateral izquierdo:
          </p>
          <p className="text-sm text-muted-foreground">
            Haz clic en <strong className="text-foreground">"Usuarios"</strong> y después en{' '}
            <strong className="text-foreground">"Perfil"</strong>.
          </p>
          <p className="text-xs text-muted-foreground">
            También puedes ir directamente:
          </p>
          <Button variant="outline" size="sm" asChild className="w-full">
            <a href={profileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ir directamente a mi perfil →
            </a>
          </Button>
        </div>
      ),
    },
    {
      number: 3,
      title: "Baja hasta 'Contraseñas de aplicación'",
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            En tu perfil, baja con el scroll hasta encontrar la sección{' '}
            <strong className="text-foreground">"Contraseñas de aplicación"</strong>.
            Suele estar bastante abajo, cerca del final de la página.
          </p>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            ¿No encuentras esta sección?
            {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showHelp && (
            <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">
                  Puede que tu hosting o un plugin de seguridad la haya desactivado.
                  Contacta a tu hosting o desactiva temporalmente plugins de seguridad
                  como <strong>Wordfence</strong> o <strong>iThemes Security</strong>.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ),
    },
    {
      number: 4,
      title: 'Crea la contraseña',
      content: (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            En el campo "Nombre de la nueva contraseña de aplicación", escribe:{' '}
            <strong className="text-foreground">Blooglee</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Y haz clic en el botón <strong>"Añadir nueva contraseña de aplicación"</strong>.
          </p>
        </div>
      ),
    },
    {
      number: 5,
      title: 'Copia la contraseña generada',
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            WordPress te mostrará una contraseña nueva.{' '}
            <strong className="text-foreground">¡IMPORTANTE! Cópiala ahora</strong> porque no podrás verla de nuevo.
          </p>
          <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-2 rounded-md text-center tracking-widest">
            XXXX XXXX XXXX XXXX XXXX XXXX
          </p>
          <p className="text-xs text-muted-foreground">
            Cópiala y pégala en el campo de abajo.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-display font-bold text-foreground">
          Casi listo — necesitamos una "contraseña de aplicación"
        </h2>
      </div>

      <Card className="border-muted">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">¿Qué es esto?</strong> Es una contraseña especial
            que le permite a Blooglee publicar artículos en tu blog. No es la misma contraseña con
            la que entras a WordPress. Es como darle a Blooglee una "llave" solo para publicar
            artículos. Tu contraseña normal sigue siendo privada.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.number} className="relative">
            {i < steps.length - 1 && (
              <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
            )}
            <div className="flex gap-4 pb-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                {step.number}
              </div>
              <div className="flex-1 pt-1.5 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Paso {step.number} de {totalSteps}: {step.title}
                </p>
                {step.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onContinue} className="w-full">
        Ya tengo mi contraseña →
      </Button>

      <div className="pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Atrás
        </Button>
      </div>
    </div>
  );
}
