import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Film } from 'lucide-react';
import { ReelSceneEditor } from './ReelSceneEditor';
import { ReelPreview } from './ReelPreview';
import { ReelExporter } from './ReelExporter';
import type { ReelData } from './types';
import { parseReelData } from './types';
import type { SocialContent } from '@/hooks/useAdminSocialContent';

interface Props {
  item: SocialContent;
  onBack: () => void;
  onSave: (id: string, content: string) => void;
  isSaving?: boolean;
}

export function ReelWorkflow({ item, onBack, onSave, isSaving }: Props) {
  const [data, setData] = useState<ReelData>(() => {
    const parsed = parseReelData(item.content);
    if (parsed) return parsed;
    // Fallback: treat as plain text script
    return {
      title: item.title,
      hook: '',
      caption: item.content.substring(0, 200),
      hashtags: ['#Blooglee'],
      best_posting_time: '12:00 - 14:00',
      video_scenes: [
        { scene_number: 1, duration_seconds: 3, scene_type: 'cover', headline: item.title, body: '', voiceover: '', visual_suggestion: '', image_url: item.image_url },
        { scene_number: 2, duration_seconds: 4, scene_type: 'content', headline: 'Escena 2', body: '', voiceover: '', visual_suggestion: '', image_url: null },
        { scene_number: 3, duration_seconds: 3, scene_type: 'cta', headline: 'Descúbrelo en Blooglee', body: 'blooglee.com', voiceover: '', visual_suggestion: '', image_url: null },
      ],
    };
  });

  const handleSave = () => {
    onSave(item.id, JSON.stringify(data));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-violet-500" />
          <h2 className="text-lg font-bold">Editor de Reel</h2>
        </div>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
        >
          Guardar cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Editor (left) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Escenas del reel</CardTitle>
            </CardHeader>
            <CardContent>
              <ReelSceneEditor data={data} onChange={setData} />
            </CardContent>
          </Card>
        </div>

        {/* Preview + Export (right) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ReelPreview scenes={data.video_scenes} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <ReelExporter data={data} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
