import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { GripVertical, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import type { ReelScene, ReelData } from './types';
import { getTotalDuration } from './types';

interface Props {
  data: ReelData;
  onChange: (data: ReelData) => void;
  onGenerateImage?: (sceneIndex: number) => void;
  isGeneratingImage?: boolean;
}

export function ReelSceneEditor({ data, onChange, onGenerateImage, isGeneratingImage }: Props) {
  const [expandedScene, setExpandedScene] = useState<number | null>(0);

  const updateScene = (index: number, patch: Partial<ReelScene>) => {
    const scenes = [...data.video_scenes];
    scenes[index] = { ...scenes[index], ...patch };
    onChange({ ...data, video_scenes: scenes });
  };

  const removeScene = (index: number) => {
    const scenes = data.video_scenes.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      scene_number: i + 1,
    }));
    onChange({ ...data, video_scenes: scenes });
  };

  const addScene = () => {
    const newScene: ReelScene = {
      scene_number: data.video_scenes.length + 1,
      duration_seconds: 3,
      scene_type: 'content',
      headline: '',
      body: '',
      voiceover: '',
      visual_suggestion: '',
      image_url: null,
    };
    onChange({ ...data, video_scenes: [...data.video_scenes, newScene] });
    setExpandedScene(data.video_scenes.length);
  };

  const totalDuration = getTotalDuration(data.video_scenes);

  return (
    <div className="space-y-4">
      {/* Reel metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium">Título del reel</Label>
          <Input
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs font-medium">Mejor hora para publicar</Label>
          <Input
            value={data.best_posting_time}
            onChange={(e) => onChange({ ...data, best_posting_time: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium">Hook (gancho inicial)</Label>
        <Input
          value={data.hook}
          onChange={(e) => onChange({ ...data, hook: e.target.value })}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium">Caption para publicar</Label>
        <Textarea
          value={data.caption}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
          rows={2}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium">Hashtags</Label>
        <Input
          value={data.hashtags.join(' ')}
          onChange={(e) => onChange({ ...data, hashtags: e.target.value.split(/\s+/).filter(Boolean) })}
          placeholder="#Blooglee #SEO"
          className="mt-1"
        />
      </div>

      {/* Duration indicator */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-sm">
        <span className="font-medium">{data.video_scenes.length} escenas</span>
        <span className={`font-semibold ${totalDuration > 25 ? 'text-destructive' : totalDuration < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
          {totalDuration.toFixed(1)}s total
        </span>
      </div>

      {/* Scenes */}
      <div className="space-y-2">
        {data.video_scenes.map((scene, index) => {
          const isExpanded = expandedScene === index;
          const typeColors: Record<string, string> = {
            cover: 'border-l-violet-500',
            content: 'border-l-fuchsia-500',
            cta: 'border-l-orange-500',
          };

          return (
            <Card
              key={index}
              className={`border-l-4 ${typeColors[scene.scene_type] || 'border-l-muted'} cursor-pointer transition-all`}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                onClick={() => setExpandedScene(isExpanded ? null : index)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-bold text-muted-foreground w-6">#{scene.scene_number}</span>
                <span className="text-sm font-medium flex-1 truncate">
                  {scene.headline || `Escena ${scene.scene_number}`}
                </span>
                <span className="text-xs text-muted-foreground">{scene.duration_seconds}s</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); removeScene(index); }}
                  className="h-6 w-6 p-0 text-destructive/60 hover:text-destructive"
                  disabled={data.video_scenes.length <= 2}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {isExpanded && (
                <CardContent className="pt-0 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tipo de escena</Label>
                      <Select
                        value={scene.scene_type}
                        onValueChange={(v) => updateScene(index, { scene_type: v as ReelScene['scene_type'] })}
                      >
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cover</SelectItem>
                          <SelectItem value="content">Contenido</SelectItem>
                          <SelectItem value="cta">CTA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Duración (s)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Slider
                          value={[scene.duration_seconds]}
                          onValueChange={([v]) => updateScene(index, { duration_seconds: v })}
                          min={1}
                          max={8}
                          step={0.5}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono w-8 text-right">{scene.duration_seconds}s</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Headline (texto grande en pantalla)</Label>
                    <Input
                      value={scene.headline}
                      onChange={(e) => updateScene(index, { headline: e.target.value })}
                      className="mt-1 h-8 text-sm"
                      maxLength={60}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Body (texto secundario)</Label>
                    <Textarea
                      value={scene.body}
                      onChange={(e) => updateScene(index, { body: e.target.value })}
                      rows={2}
                      className="mt-1 text-sm"
                      maxLength={120}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Voz en off (guion hablado)</Label>
                    <Textarea
                      value={scene.voiceover}
                      onChange={(e) => updateScene(index, { voiceover: e.target.value })}
                      rows={2}
                      className="mt-1 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Sugerencia visual</Label>
                    <Input
                      value={scene.visual_suggestion}
                      onChange={(e) => updateScene(index, { visual_suggestion: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Imagen URL</Label>
                      <Input
                        value={scene.image_url || ''}
                        onChange={(e) => updateScene(index, { image_url: e.target.value || null })}
                        placeholder="URL de imagen o vacío para fondo corporativo"
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    {onGenerateImage && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-5 h-8"
                        onClick={() => onGenerateImage(index)}
                        disabled={isGeneratingImage}
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        IA
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {data.video_scenes.length < 7 && (
        <Button variant="outline" size="sm" onClick={addScene} className="w-full">
          <Plus className="h-3 w-3 mr-1" /> Añadir escena
        </Button>
      )}
    </div>
  );
}
