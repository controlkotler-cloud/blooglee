import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle2, Calendar, FileText, Bell } from 'lucide-react';

const FREQUENCIES = [
  { value: 'weekly', label: '1 artículo por semana', sublabel: '(recomendado)' },
  { value: 'biweekly', label: '2 artículos por semana', sublabel: '' },
  { value: 'fortnightly', label: '1 artículo cada dos semanas', sublabel: '' },
  { value: 'monthly', label: '1 artículo al mes', sublabel: '' },
];

const DAYS = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
  { value: '0', label: 'Domingo' },
];

const HOURS = Array.from({ length: 13 }, (_, i) => {
  const h = i + 8;
  return { value: String(h), label: `${String(h).padStart(2, '0')}:00` };
});

interface AutoPublishStepProps {
  onActivate: (config: {
    frequency: string;
    dayOfWeek: number;
    hourUtc: number;
    reviewMode: 'review' | 'auto';
    includeFeaturedImage: boolean;
  }) => void;
  onBack: () => void;
}

export function AutoPublishStep({ onActivate, onBack }: AutoPublishStepProps) {
  const [frequency, setFrequency] = useState('weekly');
  const [dayOfWeek, setDayOfWeek] = useState('2'); // Tuesday
  const [hour, setHour] = useState('10');
  const [reviewMode, setReviewMode] = useState<'review' | 'auto'>('auto');
  const [includeFeaturedImage, setIncludeFeaturedImage] = useState(true);
  const [activated, setActivated] = useState(false);

  const handleActivate = () => {
    onActivate({
      frequency,
      dayOfWeek: parseInt(dayOfWeek),
      hourUtc: parseInt(hour),
      reviewMode,
      includeFeaturedImage,
    });
    setActivated(true);
  };

  // Calculate next article date
  const getNextArticleDate = (): string => {
    const now = new Date();
    const targetDay = parseInt(dayOfWeek);
    const daysUntil = (targetDay - now.getDay() + 7) % 7 || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntil);
    next.setHours(parseInt(hour), 0, 0, 0);
    return next.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const frequencyLabel = FREQUENCIES.find(f => f.value === frequency)?.label ?? frequency;

  if (activated) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="text-5xl animate-in zoom-in duration-500">✅</div>
          <h2 className="text-xl font-display font-bold text-foreground">
            ¡Todo listo! Blooglee está trabajando para ti.
          </h2>
        </div>

        <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-sm">Próximo artículo: <strong>{getNextArticleDate()}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="text-sm">Frecuencia: <strong>{frequencyLabel}</strong></span>
            </div>
            {reviewMode === 'review' && (
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span className="text-sm">Te avisaremos antes de publicar</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-display font-bold text-foreground">
          Activa la publicación automática
        </h2>
        <p className="text-sm text-muted-foreground">
          Blooglee puede generar y publicar artículos en tu blog sin que tengas que hacer nada.
        </p>
      </div>

      {/* Frequency */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Frecuencia</Label>
        <RadioGroup value={frequency} onValueChange={setFrequency}>
          <div className="space-y-2">
            {FREQUENCIES.map((f) => (
              <label
                key={f.value}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={f.value} />
                <span className="text-sm text-foreground">
                  {f.label} {f.sublabel && <span className="text-muted-foreground">{f.sublabel}</span>}
                </span>
              </label>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Day and Hour */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Día preferido</Label>
          <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Hora</Label>
          <Select value={hour} onValueChange={setHour}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Review mode */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Revisión</Label>
        <RadioGroup value={reviewMode} onValueChange={(v) => setReviewMode(v as 'review' | 'auto')}>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="review" className="mt-0.5" />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Quiero revisar cada artículo antes de que se publique
                </span>
                <p className="text-xs text-muted-foreground">
                  Recibirás un email con el borrador. Si no haces nada en 48h, se publica automáticamente.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="auto" className="mt-0.5" />
              <div>
                <span className="text-sm font-medium text-foreground">
                  Publicar directamente sin revisión
                </span>
                <p className="text-xs text-muted-foreground">
                  Confío en Blooglee para publicar automáticamente.
                </p>
              </div>
            </label>
          </div>
        </RadioGroup>
      </div>

      {/* Featured image */}
      <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
        <Checkbox
          checked={includeFeaturedImage}
          onCheckedChange={(c) => setIncludeFeaturedImage(!!c)}
        />
        <span className="text-sm text-foreground">
          ☑ Generar imagen destacada con IA para cada artículo
        </span>
      </label>

      <Button onClick={handleActivate} className="w-full">
        Activar publicación automática →
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
