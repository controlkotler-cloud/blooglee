import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Briefcase, Download, Loader2 } from 'lucide-react';
import { useNewsletterSubscribe } from '@/hooks/useNewsletterSubscribe';
import { LeadMagnet } from './LeadMagnetCard';

interface LeadMagnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadMagnet: LeadMagnet | null;
}

export const LeadMagnetModal = ({ isOpen, onClose, leadMagnet }: LeadMagnetModalProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [audience, setAudience] = useState<'empresas' | 'agencias' | null>(null);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  const { subscribe, isLoading } = useNewsletterSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audience) return;

    const result = await subscribe({
      name,
      email,
      audience,
      gdprConsent,
      marketingConsent,
      source: `lead-magnet-${leadMagnet?.id || 'unknown'}`,
    });

    if (result.success) {
      setDownloadReady(true);
    }
  };

  const handleDownload = () => {
    // Open resource in new tab - user can print to PDF
    window.open(`/resources/${leadMagnet?.fileName || 'resource.html'}`, '_blank');
    
    // Reset and close
    setTimeout(() => {
      setName('');
      setEmail('');
      setAudience(null);
      setGdprConsent(false);
      setMarketingConsent(false);
      setDownloadReady(false);
      onClose();
    }, 500);
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setAudience(null);
    setGdprConsent(false);
    setMarketingConsent(false);
    setDownloadReady(false);
    onClose();
  };

  if (!leadMagnet) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {downloadReady ? '¡Listo para descargar!' : `Descarga: ${leadMagnet.title}`}
          </DialogTitle>
          <DialogDescription>
            {downloadReady 
              ? 'Gracias por suscribirte. Tu descarga está lista.'
              : 'Introduce tus datos para recibir el recurso gratuito.'}
          </DialogDescription>
        </DialogHeader>

        {downloadReady ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4">
              <Download className="w-8 h-8 text-white" />
            </div>
            <Button 
              onClick={handleDownload}
              className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar {leadMagnet.type}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>¿Qué te define mejor?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={audience === 'empresas' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAudience('empresas')}
                  className={audience === 'empresas' ? 'bg-violet-600' : ''}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Empresa
                </Button>
                <Button
                  type="button"
                  variant={audience === 'agencias' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAudience('agencias')}
                  className={audience === 'agencias' ? 'bg-violet-600' : ''}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Agencia
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="gdpr"
                  checked={gdprConsent}
                  onCheckedChange={(checked) => setGdprConsent(checked === true)}
                />
                <Label htmlFor="gdpr" className="text-xs text-foreground/70 leading-tight cursor-pointer">
                  Acepto la <a href="/privacy" className="underline">política de privacidad</a> y el tratamiento de mis datos.
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="marketing"
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                />
                <Label htmlFor="marketing" className="text-xs text-foreground/70 leading-tight cursor-pointer">
                  Quiero recibir recursos y consejos de marketing por email.
                </Label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400"
              disabled={isLoading || !audience || !gdprConsent || !marketingConsent}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Obtener recurso gratis
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
