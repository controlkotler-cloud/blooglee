import { useState, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Globe, Link2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useColorPalette } from '@/hooks/useColorPalette';
import { OnboardingNavButtons } from '../OnboardingNavButtons';
import type { OnboardingStepData } from '@/hooks/useOnboarding';

// Define constants for sectors and scopes
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

type UrlStatus = 'empty' | 'valid' | 'missing_protocol' | 'http_only' | 'invalid';

function analyzeUrl(raw: string): { status: UrlStatus; suggestions?: string[] } {
  const trimmed = raw.trim();
  if (!trimmed) return { status: 'empty' };

  // Already has https://
  if (/^https:\/\/.*?\..+/.test(trimmed)) return { status: 'valid' };

  // Has http:// but not https
  if (/^http:\/\/.*?\..+/.test(trimmed)) return { status: 'http_only' };

  // Looks like a domain without protocol
  if (/^(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/.test(trimmed)) {
    const withoutWww = trimmed.replace(/^www\./, '');
    const withWww = trimmed.startsWith('www.') ? trimmed : `www.${trimmed}`;
    return {
      status: 'missing_protocol',
      suggestions: [`https://${withoutWww}`, `https://${withWww}`],
    };
  }

  // Anything else with a dot might be a malformed URL
  if (trimmed.includes('.')) return { status: 'invalid' };

  return { status: 'invalid' };
}

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
  const submittingRef = useRef(false);

  const finalSector = sector === 'otro' ? customSector.trim() : sector;

  const urlAnalysis = useMemo(() => analyzeUrl(websiteUrl), [websiteUrl]);

  const isUrlAcceptable = urlAnalysis.status === 'valid' || urlAnalysis.status === 'http_only';

  const canProceed =
    businessName.trim().length > 0 &&
    finalSector.length > 0 &&
    location.trim().length > 0 &&
    scope.length > 0 &&
    websiteUrl.trim().length > 0;

  const applySuggestion = (suggestion: string) => {
    setWebsiteUrl(suggestion);
  };

  const handleNext = async () => {
    if (!canProceed || !user?.id || submittingRef.current) return;

    // Auto-fix URL without protocol
    let finalUrl = websiteUrl.trim();
    if (urlAnalysis.status === 'missing_protocol') {
      finalUrl = `https://${finalUrl.replace(/^www\./, '')}`;
      setWebsiteUrl(finalUrl);
      toast.info('Hemos añadido https:// a tu URL. Verifica que es correcta.');
    }

    submittingRef.current = true;
    setIsSaving(true);

    try {
      // Deduplication: check if user already has a site with the same blog_url
      if (finalUrl) {
        const normalizedUrl = finalUrl.toLowerCase().replace(/\/+$/, '').replace(/^https?:\/\//, '').replace(/^www\./, '');
        const { data: existingSites } = await supabase
          .from('sites')
          .select('id, name, blog_url')
          .eq('user_id', user.id);

        const duplicate = existingSites?.find(s => {
          if (!s.blog_url) return false;
          const existing = s.blog_url.toLowerCase().replace(/\/+$/, '').replace(/^https?:\/\//, '').replace(/^www\./, '');
          return existing === normalizedUrl;
        });

        if (duplicate) {
          toast.error(`Ya tienes un sitio con esta URL: "${duplicate.name}". Ve al dashboard para gestionarlo.`);
          setIsSaving(false);
          submittingRef.current = false;
          return;
        }
      }

      const { data: site, error: siteError } = await supabase
        .from('sites')
        .insert({
          user_id: user.id,
          name: businessName.trim(),
          sector: finalSector,
          location: location.trim(),
          geographic_scope: scope,
          blog_url: finalUrl || null,
        })
        .select()
        .single();

      if (siteError) throw siteError;

      await createProgress(site.id);

      const stepData = {
        business_name: businessName.trim(),
        sector: finalSector,
        location: location.trim(),
        scope,
        website_url: finalUrl || '',
      };
      await saveStepData('step1', stepData);

      if (finalUrl) {
        triggerExtraction(finalUrl, site.id);
      }

      await queryClient.refetchQueries({ queryKey: ['sites', user.id] });
      onNext();
    } catch (err: any) {
      console.error('Error in BusinessStep:', err);
      toast.error('Error al guardar los datos. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Cuéntanos sobre tu negocio
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Con esta información, nuestra IA creará artículos perfectos para tu blog.
        </p>
      </div>

      {/* Business name */}
      <div className="space-y-1.5">
        <Label htmlFor="business-name" className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="w-4 h-4 text-primary" />
          Nombre de tu negocio <span className="text-destructive">*</span>
        </Label>
        <Input
          id="business-name"
          placeholder="Ej: Farmacia López"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="h-12 sm:h-11 text-base rounded-lg"
          maxLength={100}
          autoFocus
          autoComplete="off"
          data-1p-ignore
        />
      </div>

      {/* Sector */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <span className="text-lg">🏷️</span>
          ¿A qué se dedica tu negocio? <span className="text-destructive">*</span>
        </Label>
        <Select value={sector} onValueChange={setSector}>
          <SelectTrigger className="h-12 sm:h-11 text-base rounded-lg">
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
            className="h-12 sm:h-11 mt-2 animate-in fade-in duration-200 rounded-lg text-base"
            maxLength={60}
          />
        )}
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4 text-primary" />
          ¿Dónde está tu negocio? <span className="text-destructive">*</span>
        </Label>
        <Input
          id="location"
          placeholder="Ej: Logroño, La Rioja"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-12 sm:h-11 text-base rounded-lg"
          maxLength={100}
        />
      </div>

      {/* Scope — mini cards */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Globe className="w-4 h-4 text-primary" />
          ¿A quién quieres llegar? <span className="text-destructive">*</span>
        </Label>
        <div className="grid gap-2">
          {SCOPES.map((s) => {
            const isSelected = scope === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setScope(s.value)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all duration-200 min-h-[48px] ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:shadow-sm'
                }`}
              >
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm font-medium">{s.label}</span>
                {isSelected && (
                  <span className="ml-auto text-primary text-sm">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Website URL */}
      <div className="space-y-1.5">
        <Label htmlFor="website-url" className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="w-4 h-4 text-primary" />
          URL de tu web <span className="text-destructive">*</span>
          {urlAnalysis.status === 'valid' && (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          )}
        </Label>
        <Input
          id="website-url"
          type="url"
          placeholder="https://www.tusitio.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className={`h-12 sm:h-11 text-base rounded-lg ${
            urlAnalysis.status === 'valid' ? 'border-emerald-500/50 focus-visible:ring-emerald-500/30' :
            urlAnalysis.status === 'invalid' ? 'border-destructive/50 focus-visible:ring-destructive/30' : ''
          }`}
          maxLength={200}
        />

        {/* Helper text — always visible when no inline feedback */}
        {(urlAnalysis.status === 'empty' || urlAnalysis.status === 'valid') && (
          <p className="text-[13px] text-muted-foreground">
            Escribe la URL completa tal como aparece en tu navegador, incluyendo https:// y www si tu web lo usa
          </p>
        )}

        {/* Missing protocol suggestions */}
        {urlAnalysis.status === 'missing_protocol' && urlAnalysis.suggestions && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Parece que falta el protocolo. ¿Cuál es la correcta?
                </p>
                <div className="flex flex-wrap gap-2">
                  {urlAnalysis.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="px-3 py-1.5 text-sm font-medium rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors border border-amber-300 dark:border-amber-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HTTP warning */}
        {urlAnalysis.status === 'http_only' && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Tu web usa http en vez de https. Si tienes SSL activado, usa https://
                </p>
                <button
                  type="button"
                  onClick={() => setWebsiteUrl(websiteUrl.replace(/^http:\/\//, 'https://'))}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors border border-amber-300 dark:border-amber-700"
                >
                  Cambiar a https://
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invalid URL */}
        {urlAnalysis.status === 'invalid' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-200">
            <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-[13px] text-destructive">
              La URL no parece válida. Debe ser algo como https://www.tusitio.com
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <OnboardingNavButtons
        onNext={handleNext}
        nextDisabled={!canProceed}
        isSaving={isSaving}
      />
    </div>
  );
}
