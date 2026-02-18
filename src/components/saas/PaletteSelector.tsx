import { useState, useCallback, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ─── Preset palettes ────────────────────────────────────────────────
const PRESET_PALETTES: { key: string; icon: string; label: string; colors: string[] }[] = [
  { key: 'warm', icon: '🌅', label: 'Cálida', colors: ['#D4726A', '#E8A735', '#F5D5C8', '#8B4513', '#FFF8F0'] },
  { key: 'corporate', icon: '🏢', label: 'Corporativa', colors: ['#1F4E79', '#2C7BB6', '#E8E8E8', '#333333', '#FFFFFF'] },
  { key: 'vibrant', icon: '⚡', label: 'Vibrante', colors: ['#FF6B35', '#004E89', '#FFD166', '#06D6A0', '#1A1A2E'] },
  { key: 'natural', icon: '🌿', label: 'Natural', colors: ['#4A7C59', '#8FBC8F', '#F5F5DC', '#D2B48C', '#2F4F4F'] },
  { key: 'minimal', icon: '🎯', label: 'Minimalista', colors: ['#000000', '#333333', '#666666', '#F5F5F5', '#FFFFFF'] },
  { key: 'creative', icon: '💜', label: 'Creativa', colors: ['#6B4C9A', '#E91E63', '#FF9800', '#00BCD4', '#F5F5F5'] },
];

type PresetKey = string;

const MOOD_TO_PRESET: Record<string, PresetKey> = {
  warm_and_welcoming: 'warm',
  clean_and_clinical: 'corporate',
  energetic: 'vibrant',
  calm_and_trustworthy: 'natural',
};

// ─── Helpers ────────────────────────────────────────────────────────
function parseColors(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const cleaned = raw.replace(/^extracted:/, '');
  if (!cleaned || !cleaned.includes('#')) return [];
  return cleaned.split(',').map(c => c.trim()).filter(c => /^#[0-9a-fA-F]{3,6}$/i.test(c));
}

function colorsMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((c, i) => c.toLowerCase() === b[i].toLowerCase());
}

function detectPreset(colors: string[]): PresetKey {
  for (const p of PRESET_PALETTES) {
    if (colorsMatch(colors, p.colors)) return p.key;
  }
  return 'custom';
}

// ─── Component ──────────────────────────────────────────────────────
interface PaletteSelectorProps {
  value: string;               // raw color_palette from form
  onChange: (value: string) => void;
  mood?: string;               // current mood for default preset suggestion
}

export function PaletteSelector({ value, onChange, mood }: PaletteSelectorProps) {
  const colors = parseColors(value);
  const hasExtracted = value?.startsWith('extracted:') || (colors.length > 0 && detectPreset(colors) === 'custom');

  // Determine active preset
  const computeActive = useCallback((): PresetKey => {
    if (colors.length === 0) {
      // No colors yet — pick from mood
      return mood ? (MOOD_TO_PRESET[mood] ?? 'warm') : 'warm';
    }
    const detected = detectPreset(colors);
    if (detected !== 'custom') return detected;
    // Custom colours exist — if value starts with 'extracted:' or was originally extracted, label as 'extracted'
    if (value?.includes('extracted:') || hasExtracted) return 'extracted';
    return 'custom';
  }, [colors, value, mood, hasExtracted]);

  const [activePreset, setActivePreset] = useState<PresetKey>(computeActive);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const editInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // When user picks a preset
  const selectPreset = (key: PresetKey) => {
    setActivePreset(key);
    if (key === 'extracted' || key === 'custom') return; // don't change colors
    const preset = PRESET_PALETTES.find(p => p.key === key);
    if (preset) {
      onChange(preset.colors.join(','));
    }
  };

  // Edit a specific color
  const editColor = (index: number, hex: string) => {
    const updated = [...colors];
    updated[index] = hex;
    onChange(updated.join(','));
    // If it no longer matches a preset, mark custom
    if (detectPreset(updated) === 'custom') {
      setActivePreset('custom');
    }
  };

  // Remove a color
  const removeColor = (index: number) => {
    if (colors.length <= 2) return;
    const updated = colors.filter((_, i) => i !== index);
    onChange(updated.join(','));
    if (detectPreset(updated) === 'custom') setActivePreset('custom');
  };

  // Add a new color
  const addColor = (hex: string) => {
    if (colors.length >= 8) return;
    const updated = [...colors, hex];
    onChange(updated.join(','));
    if (detectPreset(updated) === 'custom') setActivePreset('custom');
  };

  // Build options list
  const options: { key: PresetKey; icon: string; label: string; previewColors: string[] }[] = [];

  // "Extracted" option — only if there are extracted colors
  if (hasExtracted && colors.length > 0 && activePreset === 'extracted') {
    options.push({ key: 'extracted', icon: '🎨', label: 'Personalizada (extraída de tu web)', previewColors: colors });
  }

  // Standard presets
  for (const p of PRESET_PALETTES) {
    options.push({ key: p.key, icon: p.icon, label: p.label, previewColors: [...p.colors] });
  }

  // "Custom (edited)" — show if user manually edited away from any preset
  if (activePreset === 'custom') {
    options.push({ key: 'custom', icon: '✏️', label: 'Personalizada (editada)', previewColors: colors });
  }

  // Active colors to display
  const displayColors = (() => {
    if (activePreset === 'extracted' || activePreset === 'custom') return colors;
    const preset = PRESET_PALETTES.find(p => p.key === activePreset);
    return preset ? [...preset.colors] : colors;
  })();

  // Initialise colors if empty (first render with no palette)
  if (colors.length === 0 && activePreset !== 'extracted' && activePreset !== 'custom') {
    const preset = PRESET_PALETTES.find(p => p.key === activePreset);
    if (preset) {
      // Defer to avoid setState during render
      setTimeout(() => onChange(preset.colors.join(',')), 0);
    }
  }

  return (
    <div className="space-y-3">
      <Label>Paleta de colores de tu marca</Label>

      {/* ── Level 1: Preset selector ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => selectPreset(opt.key)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
              activePreset === opt.key
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-500'
                : 'border-border hover:border-muted-foreground/40',
            )}
          >
            <span className="text-base shrink-0">{opt.icon}</span>
            <div className="min-w-0 flex-1">
              <span className="block truncate font-medium">{opt.label}</span>
              <div className="flex gap-0.5 mt-1">
                {opt.previewColors.slice(0, 5).map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm border border-border/50" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Level 2: Editable swatches ── */}
      <div className="flex items-end gap-3 flex-wrap pt-1">
        {displayColors.map((hex, i) => (
          <div key={i} className="flex flex-col items-center gap-1 group relative">
            {/* Clickable swatch that opens color picker */}
            <button
              type="button"
              onClick={() => editInputRefs.current[i]?.click()}
              className="w-8 h-8 rounded-md border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-violet-400 transition-all"
              style={{ backgroundColor: hex }}
              title="Cambiar color"
            />
            <span className="text-[10px] text-muted-foreground font-mono">{hex}</span>

            {/* Hidden color input for editing */}
            <input
              type="color"
              ref={(el) => { editInputRefs.current[i] = el; }}
              className="sr-only"
              value={hex}
              onChange={(e) => editColor(i, e.target.value)}
            />

            {/* Remove button */}
            {displayColors.length > 2 && (
              <button
                type="button"
                onClick={() => removeColor(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add color button */}
        {displayColors.length < 8 && (
          <label className="flex flex-col items-center gap-1 cursor-pointer" title="Añadir color">
            <div className="w-8 h-8 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground text-sm hover:border-violet-400 transition-colors">
              +
            </div>
            <span className="text-[10px] text-muted-foreground">Añadir</span>
            <input
              ref={colorInputRef}
              type="color"
              className="sr-only"
              onChange={(e) => addColor(e.target.value)}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Haz clic en un color para cambiarlo. Máximo 8 colores, mínimo 2.
      </p>
    </div>
  );
}
