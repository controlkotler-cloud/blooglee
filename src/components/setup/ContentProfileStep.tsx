import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';

const PILLARS = [
  { value: 'educational', label: 'Educativo', description: 'Guías y consejos para tus clientes' },
  { value: 'seasonal', label: 'Estacional', description: 'Contenido según la época del año' },
  { value: 'trends', label: 'Tendencias del sector', description: 'Novedades y actualidad' },
  { value: 'cases', label: 'Casos prácticos', description: 'Historias de tu día a día' },
  { value: 'opinion', label: 'Opinión profesional', description: 'Tu punto de vista experto' },
];

const AVOID_TOPICS_OPTIONS = [
  { value: 'prices', label: 'Precios específicos de productos' },
  { value: 'diagnoses', label: 'Diagnósticos médicos', healthOnly: true },
  { value: 'competitors', label: 'Marcas de la competencia' },
];

interface ContentProfileStepProps {
  site: { sector?: string | null; content_pillars?: string[]; avoid_topics?: string[] };
  onSave: (data: { content_pillars: string[]; avoid_topics: string[]; notes: string }) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function ContentProfileStep({ site, onSave, onSkip, onBack }: ContentProfileStepProps) {
  const [selectedPillars, setSelectedPillars] = useState<string[]>(
    site.content_pillars?.length ? site.content_pillars : ['educational', 'seasonal']
  );
  const [avoidTopics, setAvoidTopics] = useState<string[]>(site.avoid_topics ?? []);
  const [otherAvoid, setOtherAvoid] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [notes, setNotes] = useState('');

  const isHealthSector = ['salud', 'farmacia', 'clinica', 'medicina', 'dental', 'veterinaria', 'health'].some(
    (s) => site.sector?.toLowerCase().includes(s)
  );

  const togglePillar = (value: string) => {
    setSelectedPillars((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const toggleAvoid = (value: string) => {
    setAvoidTopics((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleSave = () => {
    const finalAvoid = [...avoidTopics];
    if (showOther && otherAvoid.trim()) {
      finalAvoid.push(otherAvoid.trim());
    }
    onSave({ content_pillars: selectedPillars, avoid_topics: finalAvoid, notes });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-display font-bold text-foreground">
          Personaliza tu contenido
        </h2>
        <p className="text-sm text-muted-foreground">
          Cuanto más sepamos de tu negocio, mejores serán los artículos.
        </p>
      </div>

      {/* Content Pillars */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Pilares de contenido — ¿Sobre qué temas quieres escribir?</Label>
        <div className="space-y-2">
          {PILLARS.map((pillar) => (
            <label
              key={pillar.value}
              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selectedPillars.includes(pillar.value)}
                onCheckedChange={() => togglePillar(pillar.value)}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-foreground">{pillar.label}</span>
                <p className="text-xs text-muted-foreground">{pillar.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Avoid Topics */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Temas a evitar — ¿Hay algo que prefieras que NO se mencione?</Label>
        <div className="space-y-2">
          {AVOID_TOPICS_OPTIONS.filter((opt) => !opt.healthOnly || isHealthSector).map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={avoidTopics.includes(opt.value)}
                onCheckedChange={() => toggleAvoid(opt.value)}
              />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
            <Checkbox checked={showOther} onCheckedChange={(c) => setShowOther(!!c)} />
            <span className="text-sm text-foreground">Otro</span>
          </label>
          {showOther && (
            <Input
              value={otherAvoid}
              onChange={(e) => setOtherAvoid(e.target.value)}
              placeholder="Especifica qué temas quieres evitar"
              className="ml-10"
            />
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Enfoque de contenido <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Quiero artículos que ayuden a mis clientes a cuidar su salud en casa, con consejos prácticos."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Cuéntanos algo más sobre el estilo de contenido que te gustaría.
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex-1">
          Guardar y continuar →
        </Button>
        <Button variant="outline" onClick={onSkip}>
          Saltar →
        </Button>
      </div>

      <div className="pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Atrás
        </Button>
      </div>
    </div>
  );
}
