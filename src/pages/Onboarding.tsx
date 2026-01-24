import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useCreateSite } from '@/hooks/useSites';
import { useUpsertWordPressConfig } from '@/hooks/useWordPressConfigSaas';
import { Sparkles, ArrowRight, ArrowLeft, Globe, Languages, Link2 } from 'lucide-react';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';

const SECTORS = [
  { value: 'farmacia', label: 'Farmacia' },
  { value: 'clinica_dental', label: 'Clínica Dental' },
  { value: 'clinica_estetica', label: 'Clínica Estética' },
  { value: 'fisioterapia', label: 'Fisioterapia' },
  { value: 'psicologia', label: 'Psicología' },
  { value: 'nutricion', label: 'Nutrición' },
  { value: 'veterinaria', label: 'Veterinaria' },
  { value: 'abogados', label: 'Abogados' },
  { value: 'arquitectura', label: 'Arquitectura' },
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'gimnasio', label: 'Gimnasio' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'consultoria', label: 'Consultoría' },
  { value: 'otro', label: 'Otro' },
];

const GEOGRAPHIC_SCOPES = [
  { value: 'local', label: 'Local', description: 'Ciudad o barrio' },
  { value: 'regional', label: 'Regional', description: 'Comunidad autónoma' },
  { value: 'national', label: 'Nacional', description: 'Todo el país' },
  { value: 'international', label: 'Internacional', description: 'Varios países' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: Basic info
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [customSector, setCustomSector] = useState('');
  
  // Step 2: Location
  const [location, setLocation] = useState('');
  const [geographicScope, setGeographicScope] = useState('local');
  
  // Step 3: Languages
  const [languages, setLanguages] = useState<string[]>(['spanish']);
  
  // Step 4: WordPress (optional)
  const [configureWordPress, setConfigureWordPress] = useState(false);
  const [wpUrl, setWpUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpAppPassword, setWpAppPassword] = useState('');

  const createSite = useCreateSite();
  const upsertWpConfig = useUpsertWordPressConfig();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim() !== '' && (sector !== '' || customSector.trim() !== '');
      case 2: return location.trim() !== '';
      case 3: return languages.length > 0;
      case 4: return !configureWordPress || (wpUrl.trim() !== '' && wpUsername.trim() !== '' && wpAppPassword.trim() !== '');
      default: return false;
    }
  };

  const handleLanguageToggle = (lang: string) => {
    if (lang === 'spanish') return; // Spanish is always required
    setLanguages(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const finalSector = sector === 'otro' ? customSector : sector;
      
      const site = await createSite.mutateAsync({
        name: name.trim(),
        sector: finalSector,
        location: location.trim(),
        geographic_scope: geographicScope as 'local' | 'regional' | 'national' | 'international',
        languages,
      });

      if (configureWordPress && wpUrl && wpUsername && wpAppPassword) {
        await upsertWpConfig.mutateAsync({
          site_id: site.id,
          site_url: wpUrl.trim(),
          wp_username: wpUsername.trim(),
          wp_app_password: wpAppPassword.trim(),
        });
      }

      navigate('/');
    } catch (error) {
      console.error('Error creating site:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BloogleeLogo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl">Configura tu primer sitio</CardTitle>
          <CardDescription>Paso {step} de {totalSteps}</CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del sitio o negocio</Label>
                <Input
                  id="name"
                  placeholder="Ej: Mi Farmacia, Clínica Dental García..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {sector === 'otro' && (
                <div className="space-y-2">
                  <Label htmlFor="customSector">Especifica el sector</Label>
                  <Input
                    id="customSector"
                    placeholder="Describe tu sector"
                    value={customSector}
                    onChange={(e) => setCustomSector(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Globe className="w-5 h-5" />
                <span>Ubicación y ámbito</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación principal</Label>
                <Input
                  id="location"
                  placeholder="Ej: Barcelona, Madrid Centro..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ámbito geográfico de tu negocio</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GEOGRAPHIC_SCOPES.map(scope => (
                    <button
                      key={scope.value}
                      type="button"
                      onClick={() => setGeographicScope(scope.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        geographicScope === scope.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{scope.label}</div>
                      <div className="text-xs text-muted-foreground">{scope.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Languages */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Languages className="w-5 h-5" />
                <span>Idiomas de los artículos</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-3 rounded-lg border bg-muted/50">
                  <Checkbox id="spanish" checked disabled />
                  <Label htmlFor="spanish" className="flex-1">
                    <span className="font-medium">Español</span>
                    <span className="text-xs text-muted-foreground ml-2">(obligatorio)</span>
                  </Label>
                </div>
                <div 
                  className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    languages.includes('catalan') ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleLanguageToggle('catalan')}
                >
                  <Checkbox 
                    id="catalan" 
                    checked={languages.includes('catalan')} 
                    onCheckedChange={() => handleLanguageToggle('catalan')}
                  />
                  <Label htmlFor="catalan" className="flex-1 cursor-pointer">
                    <span className="font-medium">Catalán</span>
                    <span className="text-xs text-muted-foreground ml-2">(opcional)</span>
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: WordPress */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Link2 className="w-5 h-5" />
                <span>Configuración de WordPress (opcional)</span>
              </div>
              
              <div 
                className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  configureWordPress ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => setConfigureWordPress(!configureWordPress)}
              >
                <Checkbox 
                  checked={configureWordPress} 
                  onCheckedChange={(checked) => setConfigureWordPress(checked === true)}
                />
                <Label className="flex-1 cursor-pointer">
                  <span className="font-medium">Quiero publicar en WordPress</span>
                </Label>
              </div>

              {configureWordPress && (
                <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="wpUrl">URL del sitio WordPress</Label>
                    <Input
                      id="wpUrl"
                      placeholder="https://tusitio.com"
                      value={wpUrl}
                      onChange={(e) => setWpUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wpUsername">Usuario de WordPress</Label>
                    <Input
                      id="wpUsername"
                      placeholder="admin"
                      value={wpUsername}
                      onChange={(e) => setWpUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wpAppPassword">Contraseña de aplicación</Label>
                    <Input
                      id="wpAppPassword"
                      type="password"
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={wpAppPassword}
                      onChange={(e) => setWpAppPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Genera una en WordPress → Usuarios → Tu perfil → Contraseñas de aplicación
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>
            ) : (
              <div />
            )}
            
            {step < totalSteps ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={!canProceed() || isLoading}>
                {isLoading ? 'Creando...' : 'Finalizar'}
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
