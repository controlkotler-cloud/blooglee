import { useState } from 'react';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { SEOHead } from '@/components/seo';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(100, 'Nombre demasiado largo'),
  email: z.string().trim().email('Email no válido').max(255, 'Email demasiado largo'),
  subject: z.string().min(1, 'Selecciona un asunto'),
  message: z.string().trim().min(10, 'El mensaje debe tener al menos 10 caracteres').max(2000, 'Mensaje demasiado largo'),
});

const subjects = [
  { value: 'general', label: 'Información general' },
  { value: 'support', label: 'Soporte técnico' },
  { value: 'billing', label: 'Facturación' },
  { value: 'partnership', label: 'Colaboraciones' },
  { value: 'other', label: 'Otro' },
];

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Mensaje enviado correctamente. Te responderemos pronto.');
  };

  return (
    <PublicLayout>
      <SEOHead 
        title="Contacto"
        description="Contacta con Blooglee. Resolvemos tus dudas sobre automatización de blogs con IA para WordPress. Respuesta en menos de 24h."
        canonicalUrl="/contact"
        keywords="contacto Blooglee, soporte técnico, atención cliente, Barcelona"
      />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg mb-6">
            <Mail className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Contacto</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              Contacta
            </span>{' '}
            con nosotros
          </h1>
          <p className="text-lg sm:text-xl text-foreground/60">
            ¿Tienes preguntas sobre Blooglee? Estamos aquí para ayudarte.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-6">
              <h2 className="font-display text-xl font-bold mb-6">Información de contacto</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Email</h3>
                    <a href="mailto:info@blooglee.com" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                      info@blooglee.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Ubicación</h3>
                    <p className="text-foreground/60 text-sm">
                      Barcelona, España
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Horario de atención</h3>
                    <p className="text-foreground/60 text-sm">
                      Lun - Vie: 9:00 - 18:00 CET
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 rounded-2xl p-6 text-white">
              <h3 className="font-display text-lg font-bold mb-2">¿Necesitas soporte técnico?</h3>
              <p className="text-white/80 text-sm mb-4">
                Si ya eres usuario de Blooglee, accede a tu cuenta para obtener soporte prioritario.
              </p>
              <Button variant="secondary" className="w-full bg-white text-violet-600 hover:bg-white/90">
                Acceder al soporte
              </Button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/50 shadow-xl p-6 sm:p-8 lg:p-10">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2">¡Mensaje enviado!</h2>
                  <p className="text-foreground/60 mb-6">
                    Gracias por contactarnos. Te responderemos lo antes posible.
                  </p>
                  <Button onClick={() => setIsSubmitted(false)} variant="outline">
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold mb-6">Envíanos un mensaje</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                          id="name"
                          placeholder="Tu nombre"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Asunto *</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      >
                        <SelectTrigger className={errors.subject ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Selecciona un asunto" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje *</Label>
                      <Textarea
                        id="message"
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className={errors.message ? 'border-destructive' : ''}
                      />
                      {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:opacity-90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        'Enviando...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar mensaje
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ContactPage;
