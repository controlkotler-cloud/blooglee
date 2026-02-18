import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Building2, MapPin, Globe, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useColorPalette } from '@/hooks/useColorPalette';
import type { OnboardingStepData } from '@/hooks/useOnboarding';

const SECTORS = [
  { value: 'farmacia', label: 'Farmacia', icon: '💊' },
  { value: 'clinica_dental', label: 'Clínica dental', icon: '🦷' },
  { value: 'restaurante', label: 'Restaurante', icon: '🍽️' },
  { value: 'peluqueria', label: 'Peluquería', icon: '💇' },
  { value: 'veterinaria', label: 'Clínica veterinaria', icon: '🐾' },
  { value: 'ecommerce', label: 'Tienda online', icon: '🛒' },
  { value: 'marketing', label: 'Agencia de marketing', icon: '📈' },
  { value: 'gimnasio', label: 'Gimnasio / Centro deportivo', icon: '💪' },
  { value: 'asesoria', label: 'Asesoría / Gestoría', icon: '📋' },
  { value: 'inmobiliaria', label: 'Inmobiliaria', icon: '🏠' },
  { value: 'otro', label: 'Otro', icon: '🏢' },
];

const SCOPES = [
  { value: 'local', label: 'A clientes de mi zona', icon: '📍' },
  { value: 'national', label: 'A clientes de toda España', icon: '🇪🇸' },
  { value: 'international', label: 'A clientes internacionales', icon: '🌍' },
];

interface BusinessStepProps {
  onNext: () => void;
  saveStepData: (key: string, data: object) => void;
  createProgress: (siteId: string) => Promise<unknown>;
  initialData?: OnboardingStepData['step1'];
}

export function BusinessStep({ onNext, saveStepData, createProgress, initialData }: BusinessStepProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerExtraction } = useColorPalette();

  const [businessName, setBusinessName] = useState(initialData?.business_name ?? '');
  const [sector, setSector] = useState(initialData?.sector ?? '');
  const [customSector, setCustomSector] = useState('');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [scope, setScope] = useState(initialData?.scope ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const finalSector = sector === 'otro' ? customSector.trim() : sector;

  const canProceed =
    businessName.trim().length > 0 &&
    finalSector.length > 0 &&
    location.trim().length > 0 &&
    scope.length > 0;

  const handleNext = async () => {
    if (!canProceed || !user?.id) return;
    setIsSaving(true);

    try {
      // 1. Create site
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .insert({
          user_id: user.id,
          name: businessName.trim(),
          sector: finalSector,
          location: location.trim(),
          geographic_scope: scope,
          blog_url: websiteUrl.trim() || null,
        })
        .select()
        .single();

      if (siteError) throw siteError;

      // 2. Create onboarding_progress linked to the site
      await createProgress(site.id);

      // 3. Save step data
      const stepData = {
        business_name: businessName.trim(),
        sector: finalSector,
        location: location.trim(),
        scope,
        website_url: websiteUrl.trim() || '',
      };
      await saveStepData('step1', stepData);

      // 4. Trigger color extraction in background (fire-and-forget)
      if (websiteUrl.trim()) {
        triggerExtraction(websiteUrl.trim(), site.id);
      }

      // 5. Refresh sites cache
      await queryClient.refetchQueries({ queryKey: ['sites', user.id] });

      // 6. Advance
      onNext();
    } catch (err: any) {
      console.error('Error in BusinessStep:', err);
      toast.error('Error al guardar los datos. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Cuéntanos sobre tu negocio
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Con esta información, nuestra IA creará artículos perfectos para tu blog. Solo necesitamos lo básico.
        </p>
      </div>

      {/* Business name */}
      <div className="space-y-2">
        <Label htmlFor="business-name" className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="w-4 h-4 text-violet-500" />
          Nombre de tu negocio <span className="text-destructive">*</span>
        </Label>
        <Input
          id="business-name"
          placeholder="Ej: Farmacia López"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="h-12 text-base"
          maxLength={100}
          autoFocus
        />
      </div>

      {/* Sector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <span className="text-lg">🏷️</span>
          ¿A qué se dedica tu negocio? <span className="text-destructive">*</span>
        </Label>
        <Select value={sector} onValueChange={setSector}>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Selecciona un sector..." />
          </SelectTrigger>
          <SelectContent>
            {SECTORS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <span className="mr-2">{s.icon}</span>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {sector === 'otro' && (
          <Input
            placeholder="Describe tu sector"
            value={customSector}
            onChange={(e) => setCustomSector(e.target.value)}
            className="h-11 mt-2 animate-in fade-in duration-200"
            maxLength={60}
          />
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4 text-violet-500" />
          ¿Dónde está tu negocio? <span className="text-destructive">*</span>
        </Label>
        <Input
          id="location"
          placeholder="Ej: Logroño, La Rioja"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-12 text-base"
          maxLength={100}
        />
      </div>

      {/* Scope */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Globe className="w-4 h-4 text-violet-500" />
          ¿A quién quieres llegar? <span className="text-destructive">*</span>
        </Label>
        <div className="grid gap-2">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setScope(s.value)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all hover:scale-[1.01] ${
                scope === s.value
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-sm'
                  : 'border-border hover:border-violet-300'
              }`}
            >
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Website URL */}
      <div className="space-y-2">
        <Label htmlFor="website-url" className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="w-4 h-4 text-violet-500" />
          URL de tu web <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="website-url"
          placeholder="Ej: www.farmacialopez.es"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="h-12 text-base"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          Si tienes web, la usaremos para adaptar las imágenes a los colores de tu marca.
        </p>
      </div>

      {/* Next button */}
      <div className="pt-4 border-t">
        <Button
          onClick={handleNext}
          disabled={!canProceed || isSaving}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white gap-2"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
