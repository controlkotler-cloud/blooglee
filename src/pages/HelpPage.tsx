import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { SEOHead } from '@/components/seo';

const faqs = [
  {
    question: '¿Cómo se generan los artículos?',
    answer:
      'Utilizamos inteligencia artificial avanzada para crear contenido único y optimizado para SEO basado en el sector y características de tu negocio. Los artículos se adaptan automáticamente al tono y estilo que mejor funcione para tu audiencia.',
  },
  {
    question: '¿Puedo editar los artículos antes de publicarlos?',
    answer:
      'Sí, todos los artículos generados se guardan como borradores. Puedes revisarlos, editarlos y cuando estés satisfecho, publicarlos directamente en tu WordPress o copiar el contenido.',
  },
  {
    question: '¿Cómo conecto mi sitio WordPress?',
    answer:
      'Ve a la configuración de tu sitio, pestaña "WordPress". Necesitarás la URL de tu sitio, tu usuario de WordPress y una contraseña de aplicación (puedes crearla desde Usuarios > Perfil > Contraseñas de aplicación en tu WordPress).',
  },
  {
    question: '¿Qué significa generación automática?',
    answer:
      'Si activas la generación automática, crearemos artículos según la frecuencia que elijas (semanal, quincenal o mensual) sin que tengas que hacer nada. Los artículos se guardan como borradores para que los revises.',
  },
  {
    question: '¿Puedo publicar en varios idiomas?',
    answer:
      'Sí, actualmente soportamos español y catalán. Puedes activar ambos idiomas en la configuración de tu sitio y cada artículo se generará en los idiomas seleccionados.',
  },
  {
    question: '¿Cómo funciona el límite de sitios?',
    answer:
      'Cada plan incluye un número máximo de sitios que puedes gestionar. El plan Free incluye 1 sitio, Starter 1 sitio, Pro hasta 3 sitios y Agency hasta 10 sitios. Puedes actualizar tu plan en cualquier momento.',
  },
  {
    question: '¿Puedo cancelar mi suscripción?',
    answer:
      'Sí, puedes cancelar tu suscripción en cualquier momento desde la sección de facturación. Tu plan seguirá activo hasta el final del período facturado.',
  },
  {
    question: '¿Las imágenes tienen derechos de autor?',
    answer:
      'Utilizamos imágenes de Pexels, que son libres de derechos para uso comercial. Siempre incluimos el crédito del fotógrafo como buena práctica.',
  },
];

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Centro de Ayuda"
        description="Centro de ayuda de Blooglee. Tutoriales, guías paso a paso y respuestas a las preguntas más frecuentes sobre automatización de blogs con IA."
        noIndex
      />
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

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="text-center mb-8">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Centro de ayuda</h1>
          <p className="text-muted-foreground">
            Encuentra respuestas a las preguntas más frecuentes
          </p>
        </div>

        {/* FAQ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Preguntas frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">¿Necesitas más ayuda?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Si no encuentras la respuesta que buscas, contacta con nuestro equipo de soporte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <a href="mailto:soporte@blooglee.com">
                  <Mail className="w-4 h-4 mr-2" />
                  soporte@blooglee.com
                </a>
              </Button>
              <Button variant="outline" className="flex-1" disabled>
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat (próximamente)
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
