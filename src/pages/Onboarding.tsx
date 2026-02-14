import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useCreateSite, useSites } from '@/hooks/useSites';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Sparkles, ArrowRight, ArrowLeft, Globe, Languages, Building2, MapPin, Calendar } from 'lucide-react';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';
import { toast } from 'sonner';
const SECTORS = [
  { value: 'farmacia', label: 'Farmacia', icon: '💊' },
  { value: 'clinica_dental', label: 'Clínica Dental', icon: '🦷' },
  { value: 'clinica_estetica', label: 'Clínica Estética', icon: '✨' },
  { value: 'fisioterapia', label: 'Fisioterapia', icon: '🏃' },
  { value: 'psicologia', label: 'Psicología', icon: '🧠' },
  { value: 'nutricion', label: 'Nutrición', icon: '🥗' },
  { value: 'veterinaria', label: 'Veterinaria', icon: '🐾' },
  { value: 'abogados', label: 'Abogados', icon: '⚖️' },
  { value: 'arquitectura', label: 'Arquitectura', icon: '🏛️' },
  { value: 'inmobiliaria', label: 'Inmobiliaria', icon: '🏠' },
  { value: 'restaurante', label: 'Restaurante', icon: '🍽️' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'gimnasio', label: 'Gimnasio', icon: '💪' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { value: 'tecnologia', label: 'Tecnología', icon: '💻' },
  { value: 'marketing', label: 'Marketing', icon: '📈' },
  { value: 'consultoria', label: 'Consultoría', icon: '💼' },
  { value: 'otro', label: 'Otro', icon: '🏢' },
];

const GEOGRAPHIC_SCOPES = [
  { value: 'local', label: 'Local', description: 'Ciudad o barrio', icon: '📍' },
  { value: 'regional', label: 'Regional', description: 'Comunidad autónoma', icon: '🗺️' },
  { value: 'national', label: 'Nacional', description: 'Todo el país', icon: '🇪🇸' },
  { value: 'international', label: 'Internacional', description: 'Varios países', icon: '🌍' },
];

const PUBLISH_FREQUENCIES = [
  { value: 'daily', label: 'Diario', description: 'Un artículo cada día', icon: '🔥' },
  { value: 'daily_weekdays', label: 'Diario (L-V)', description: 'De lunes a viernes', icon: '📅' },
  { value: 'weekly', label: 'Semanal', description: 'Un artículo por semana', icon: '📰' },
  { value: 'biweekly', label: 'Quincenal', description: 'Cada 2 semanas', icon: '📋' },
  { value: 'monthly', label: 'Mensual', description: 'Un artículo por mes', icon: '📆' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Datos de perfil y sitios existentes para validación de límites
  const { data: profile } = useProfile();
  const { data: existingSites = [] } = useSites();
  
  // Validar límite de sitios al montar
  useEffect(() => {
    if (profile && existingSites.length >= profile.sites_limit) {
      toast.error(`Has alcanzado el límite de ${profile.sites_limit} sitio(s) de tu plan`);
      navigate('/dashboard');
    }
  }, [profile, existingSites, navigate]);
  
  // Step 1: Basic info
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [customSector, setCustomSector] = useState('');
  const [description, setDescription] = useState('');
  
  // Step 2: Location
  const [location, setLocation] = useState('');
  const [geographicScope, setGeographicScope] = useState('local');
  
  // Step 3: Languages & Frequency
  const [languages, setLanguages] = useState<string[]>(['spanish']);
  const [publishFrequency, setPublishFrequency] = useState('weekly');

  const createSite = useCreateSite();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim() !== '' && (sector !== '' || customSector.trim() !== '');
      case 2: return true; // Location is now optional for faster flow
      case 3: return languages.length > 0;
      default: return false;
    }
  };

  const handleLanguageToggle = (lang: string) => {
    if (lang === 'spanish') return;
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
      
      await createSite.mutateAsync({
        name: name.trim(),
        sector: finalSector,
        description: description.trim() || null,
        location: location.trim() || null,
        geographic_scope: geographicScope as 'local' | 'regional' | 'national' | 'international',
        languages,
        publish_frequency: publishFrequency,
      });

      // IMPORTANTE: Esperar a que el cache de sites se actualice
      // antes de navegar para evitar que ProtectedRoute redirija de vuelta
      await queryClient.refetchQueries({ queryKey: ['sites', user?.id] });

      // Ahora navegar al dashboard (ProtectedRoute verá sites.length > 0)
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating site:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = [
    { title: 'Tu negocio', icon: Building2 },
    { title: 'Ubicación', icon: MapPin },
    { title: 'Preferencias', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-orange-50 dark:from-background dark:to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <BloogleeLogo size="lg" showText={false} />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-4">
            {stepTitles.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = step === i + 1;
              const isCompleted = step > i + 1;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg' 
                      : isCompleted 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <StepIcon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                  <span className="text-sm font-medium sm:hidden">{i + 1}</span>
                </div>
              );
            })}
          </div>

          <CardTitle className="text-2xl font-display bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
            {stepTitles[step - 1].title}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Con estos datos, la IA generará artículos relevantes para tu sector y audiencia'}
            {step === 2 && 'Añade tu ubicación para que los artículos incluyan referencias locales (puedes saltarlo)'}
            {step === 3 && 'Elige en qué idiomas quieres tus artículos y con qué frecuencia publicarlos'}
          </CardDescription>
          <Progress value={progress} className="mt-4 h-2" />
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">¿Cómo se llama tu negocio? *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Farmacia Central, Clínica García, Mi Tienda Online..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-base"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-base">¿A qué sector pertenece? *</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {SECTORS.slice(0, 8).map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSector(s.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                        sector === s.value 
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md' 
                          : 'border-border hover:border-violet-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <div className="text-xs font-medium truncate">{s.label}</div>
                    </button>
                  ))}
                </div>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Ver todos los sectores..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="mr-2">{s.icon}</span>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {sector === 'otro' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <Label htmlFor="customSector">Especifica el sector *</Label>
                  <Input
                    id="customSector"
                    placeholder="Describe tu sector"
                    value={customSector}
                    onChange={(e) => setCustomSector(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="description">¿Qué hace especial a tu negocio? (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Ej: Nos especializamos en dermocosmética natural, atendemos sobre todo a familias jóvenes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Cuanto más detalle añadas, más personalizados serán los artículos que genere la IA
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Globe className="w-5 h-5" />
                <span>Ubicación y ámbito geográfico</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">¿Dónde está tu negocio? (opcional)</Label>
                <Input
                  id="location"
                  placeholder="Ej: Barcelona, Madrid Centro, Sevilla..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-12"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  La IA mencionará tu zona en los artículos para conectar con tu audiencia local
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>¿A qué área geográfica te diriges?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {GEOGRAPHIC_SCOPES.map(scope => (
                    <button
                      key={scope.value}
                      type="button"
                      onClick={() => setGeographicScope(scope.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                        geographicScope === scope.value 
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md' 
                          : 'border-border hover:border-violet-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{scope.icon}</div>
                      <div className="font-medium">{scope.label}</div>
                      <div className="text-xs text-muted-foreground">{scope.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Languages & Frequency */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Languages className="w-5 h-5" />
                  <span>Idiomas de los artículos</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 rounded-xl border-2 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
                    <Checkbox id="spanish" checked disabled />
                    <Label htmlFor="spanish" className="flex-1">
                      <span className="font-medium">🇪🇸 Español</span>
                      <span className="text-xs text-muted-foreground ml-2">(siempre incluido)</span>
                    </Label>
                  </div>
                  <div 
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.01] ${
                      languages.includes('catalan') 
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                        : 'border-border hover:border-violet-300'
                    }`}
                    onClick={() => handleLanguageToggle('catalan')}
                  >
                    <Checkbox 
                      id="catalan" 
                      checked={languages.includes('catalan')} 
                      onCheckedChange={() => handleLanguageToggle('catalan')}
                    />
                    <Label htmlFor="catalan" className="flex-1 cursor-pointer">
                      <span className="font-medium">🏴󠁥󠁳󠁣󠁴󠁿 Catalán</span>
                      <span className="text-xs text-muted-foreground ml-2">(opcional)</span>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-5 h-5" />
                  <span>Frecuencia de publicación</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PUBLISH_FREQUENCIES.map(freq => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setPublishFrequency(freq.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                        publishFrequency === freq.value 
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md' 
                          : 'border-border hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{freq.icon}</span>
                        <div>
                          <div className="font-medium">{freq.label}</div>
                          <div className="text-xs text-muted-foreground">{freq.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </Button>
            ) : (
              <div />
            )}
            
            {step < totalSteps ? (
              <Button 
                onClick={() => setStep(s => s + 1)} 
                disabled={!canProceed()}
                className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleFinish} 
                disabled={!canProceed() || isLoading}
                className="gap-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:from-violet-600 hover:via-fuchsia-600 hover:to-orange-500"
              >
                {isLoading ? 'Creando...' : '¡Crear mi sitio!'}
                <Sparkles className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Skip hint for step 2 */}
          {step === 2 && (
            <p className="text-center text-xs text-muted-foreground">
              Puedes saltar este paso y configurarlo más tarde
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
