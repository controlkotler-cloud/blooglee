import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Users, FileText, Ban } from 'lucide-react';

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal y profesional', description: 'Lenguaje institucional y serio' },
  { value: 'casual', label: 'Cercano pero experto', description: 'Accesible sin perder autoridad' },
  { value: 'technical', label: 'Técnico y especializado', description: 'Para audiencia experta' },
  { value: 'educational', label: 'Divulgativo y accesible', description: 'Explica conceptos complejos' },
];

const PILLAR_OPTIONS = [
  { value: 'educational', label: 'Educativo', description: 'Guías, tutoriales, how-to' },
  { value: 'trends', label: 'Tendencias', description: 'Novedades, innovación del sector' },
  { value: 'cases', label: 'Casos prácticos', description: 'Ejemplos reales, testimonios' },
  { value: 'seasonal', label: 'Estacional', description: 'Adaptado a la época del año' },
  { value: 'opinion', label: 'Opinión/Análisis', description: 'Perspectivas del sector' },
];

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Corto (~800 palabras)', description: 'Lectura rápida, ideal para móvil' },
  { value: 'medium', label: 'Medio (~1500 palabras)', description: 'Equilibrado para SEO' },
  { value: 'long', label: 'Largo (~2500 palabras)', description: 'SEO intensivo, guías completas' },
];

interface ContentProfileCardProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  register: any;
}

export function ContentProfileCard({ watch, setValue, register }: ContentProfileCardProps) {
  const watchedTone = watch('tone') || 'casual';
  const watchedPillars = watch('content_pillars') || ['educational', 'trends', 'seasonal'];
  const watchedLength = watch('preferred_length') || 'medium';

  const togglePillar = (pillar: string) => {
    const current = watchedPillars || [];
    if (current.includes(pillar)) {
      if (current.length > 1) {
        setValue('content_pillars', current.filter((p: string) => p !== pillar), { shouldDirty: true });
      }
    } else {
      if (current.length < 4) {
        setValue('content_pillars', [...current, pillar], { shouldDirty: true });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          Perfil de contenido
        </CardTitle>
        <CardDescription>
          Personaliza cómo se generan los artículos para tu sitio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tone selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Tono de voz
          </Label>
          <RadioGroup
            value={watchedTone}
            onValueChange={(v) => setValue('tone', v, { shouldDirty: true })}
            className="grid gap-2"
          >
            {TONE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem value={option.value} id={`tone-${option.value}`} className="mt-1" />
                <div className="grid gap-0.5">
                  <Label htmlFor={`tone-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Target audience */}
        <div className="space-y-2">
          <Label htmlFor="target_audience" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Audiencia objetivo
          </Label>
          <Textarea
            id="target_audience"
            placeholder="Ej: Profesionales del sector salud, 35-55 años, interesados en mejorar su práctica diaria..."
            {...register('target_audience')}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Describe quién leerá tu contenido para personalizarlo mejor
          </p>
        </div>

        {/* Content pillars */}
        <div className="space-y-3">
          <Label>Pilares de contenido (selecciona 2-4)</Label>
          <div className="grid gap-3">
            {PILLAR_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <Checkbox
                  id={`pillar-${option.value}`}
                  checked={watchedPillars.includes(option.value)}
                  onCheckedChange={() => togglePillar(option.value)}
                  disabled={watchedPillars.includes(option.value) && watchedPillars.length <= 1}
                />
                <div className="grid gap-0.5">
                  <Label htmlFor={`pillar-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Los pilares rotan automáticamente para dar variedad a tu contenido
          </p>
        </div>

        {/* Topics to avoid */}
        <div className="space-y-2">
          <Label htmlFor="avoid_topics" className="flex items-center gap-2">
            <Ban className="w-4 h-4" />
            Temas a evitar
          </Label>
          <Textarea
            id="avoid_topics"
            placeholder="Ej: competencia directa, precios específicos, temas políticos..."
            {...register('avoid_topics')}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Separa los temas con comas. El sistema evitará estos temas en la generación.
          </p>
        </div>

        {/* Preferred length */}
        <div className="space-y-3">
          <Label>Longitud preferida</Label>
          <RadioGroup
            value={watchedLength}
            onValueChange={(v) => setValue('preferred_length', v, { shouldDirty: true })}
            className="grid gap-2"
          >
            {LENGTH_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem value={option.value} id={`length-${option.value}`} className="mt-1" />
                <div className="grid gap-0.5">
                  <Label htmlFor={`length-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
