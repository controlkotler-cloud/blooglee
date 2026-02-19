import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface WPAppPasswordGuideProps {
  siteUrl: string;
  onBack: () => void;
  onContinue: () => void;
}

export function WPAppPasswordGuide({ siteUrl, onBack, onContinue }: WPAppPasswordGuideProps) {
  const [showHelp, setShowHelp] = useState(false);
  const totalSteps = 5;

  const steps = [
    {
      number: 1,
      title: 'Entra en tu WordPress',
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Abre una nueva pestaña e inicia sesión en el panel de administración de tu WordPress como lo haces habitualmente.
          </p>
          <p className="text-xs text-muted-foreground">
            Normalmente accedes desde <strong className="text-foreground font-mono">tudominio.com/wp-admin</strong>, pero si tu hosting tiene otra dirección de acceso, usa la que utilices siempre.
          </p>
        </div>
      ),
    },
    {
      number: 2,
      title: 'Ve a tu perfil de usuario',
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Una vez dentro de WordPress, ve al menú lateral izquierdo:
          </p>
          <p className="text-sm text-muted-foreground">
            Haz clic en <strong className="text-foreground">"Usuarios"</strong> y después en{' '}
            <strong className="text-foreground">"Perfil"</strong>.
          </p>
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
              <CardContent className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Puede que tu hosting o un plugin de seguridad la haya desactivado. Estos son los casos más comunes:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
                  <li>
                    <strong className="text-foreground">Wordfence:</strong> Ve a Wordfence → Firewall → Manage Firewall y desactiva la regla "Application Passwords".{' '}
                    <a href="/help/wordfence-bloquea-claves" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Ver guía paso a paso →
                    </a>
                  </li>
                  <li>
                    <strong className="text-foreground">iThemes / Solid Security:</strong> Ve a Security → Settings → WordPress Tweaks y asegúrate de que "Application Passwords" esté habilitado.
                  </li>
                  <li>
                    <strong className="text-foreground">Tu hosting:</strong> Algunos hostings (como SiteGround o WP Engine) desactivan esta función. Contacta a su soporte y pide que habiliten las "Application Passwords" de WordPress.
                  </li>
                </ul>
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
