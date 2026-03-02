import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Film, FileImage, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ReelData, ReelScene } from './types';

interface Props {
  data: ReelData;
}

const W = 1080;
const H = 1920;

const GRADIENT_COLORS = ['#8B5CF6', '#D946EF', '#F97316'];

function createGradient(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, GRADIENT_COLORS[0]);
  grad.addColorStop(0.5, GRADIENT_COLORS[1]);
  grad.addColorStop(1, GRADIENT_COLORS[2]);
  return grad;
}

async function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: ReelScene,
  _index: number
): Promise<void> {
  // Background
  if (scene.image_url) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = scene.image_url!;
      });
      // Cover fill
      const scale = Math.max(W / img.width, H / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
    } catch {
      ctx.fillStyle = createGradient(ctx);
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.fillStyle = createGradient(ctx);
    ctx.fillRect(0, 0, W, H);
  }

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);

  // Text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';

  if (scene.scene_type === 'cover') {
    ctx.font = '600 32px sans-serif';
    ctx.fillText('BLOOGLEE', W / 2, H / 2 - 120);
    ctx.font = 'bold 64px sans-serif';
    wrapText(ctx, scene.headline, W / 2, H / 2, W - 160, 76);
    if (scene.body) {
      ctx.font = '400 36px sans-serif';
      ctx.globalAlpha = 0.8;
      wrapText(ctx, scene.body, W / 2, H / 2 + 160, W - 200, 48);
      ctx.globalAlpha = 1;
    }
  } else if (scene.scene_type === 'cta') {
    ctx.font = 'bold 56px sans-serif';
    wrapText(ctx, scene.headline, W / 2, H / 2 - 60, W - 160, 70);
    if (scene.body) {
      ctx.font = '400 36px sans-serif';
      ctx.globalAlpha = 0.9;
      wrapText(ctx, scene.body, W / 2, H / 2 + 60, W - 200, 48);
      ctx.globalAlpha = 1;
    }
    // CTA button
    const btnY = H / 2 + 180;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(ctx, W / 2 - 160, btnY - 30, 320, 60, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '600 32px sans-serif';
    ctx.fillText('blooglee.com', W / 2, btnY + 10);
  } else {
    ctx.font = 'bold 52px sans-serif';
    wrapText(ctx, scene.headline, W / 2, H / 2 - 40, W - 160, 66);
    if (scene.body) {
      ctx.font = '400 34px sans-serif';
      ctx.globalAlpha = 0.9;
      wrapText(ctx, scene.body, W / 2, H / 2 + 80, W - 200, 46);
      ctx.globalAlpha = 1;
    }
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let ly = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, ly);
      line = word + ' ';
      ly += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, ly);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

export function ReelExporter({ data }: Props) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<'webm' | 'frames' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const exportFrames = async () => {
    setExporting('frames');
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Render each scene as PNG
      for (let i = 0; i < data.video_scenes.length; i++) {
        ctx.clearRect(0, 0, W, H);
        await drawScene(ctx, data.video_scenes[i], i);
        const blob = await new Promise<Blob>((res) =>
          canvas.toBlob((b) => res(b!), 'image/png')
        );
        zip.file(`scene-${String(i + 1).padStart(2, '0')}.png`, blob);
      }

      // Add caption
      zip.file('caption.txt', `${data.caption}\n\n${data.hashtags.join(' ')}`);

      // Add storyboard manifest
      const manifest = {
        title: data.title,
        hook: data.hook,
        total_duration: data.video_scenes.reduce((s, sc) => s + sc.duration_seconds, 0),
        scenes: data.video_scenes.map((sc) => ({
          file: `scene-${String(sc.scene_number).padStart(2, '0')}.png`,
          duration_seconds: sc.duration_seconds,
          type: sc.scene_type,
          headline: sc.headline,
          voiceover: sc.voiceover,
        })),
      };
      zip.file('storyboard.json', JSON.stringify(manifest, null, 2));

      // Add voiceover script
      const voScript = data.video_scenes
        .filter((s) => s.voiceover)
        .map((s) => `[Escena ${s.scene_number} - ${s.duration_seconds}s]\n${s.voiceover}`)
        .join('\n\n');
      if (voScript) zip.file('voiceover-script.txt', voScript);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `reel-${slugify(data.title)}.zip`);

      toast({ title: 'Storyboard exportado', description: `${data.video_scenes.length} frames + guion descargados` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  const exportWebM = async () => {
    setExporting('webm');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Check MediaRecorder support
      if (typeof MediaRecorder === 'undefined') {
        toast({ title: 'No soportado', description: 'Tu navegador no soporta grabación de video. Usa Chrome o Firefox.', variant: 'destructive' });
        setExporting(null);
        return;
      }

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5000000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      recorder.start();

      // Render each scene for its duration
      for (let i = 0; i < data.video_scenes.length; i++) {
        const scene = data.video_scenes[i];
        ctx.clearRect(0, 0, W, H);
        await drawScene(ctx, scene, i);

        // Hold for duration (render frames)
        const durationMs = (scene.duration_seconds || 3) * 1000;
        const frameInterval = 1000 / 30;
        const frames = Math.ceil(durationMs / frameInterval);
        for (let f = 0; f < frames; f++) {
          await new Promise((r) => setTimeout(r, frameInterval));
        }

        // Fade transition (0.3s)
        if (i < data.video_scenes.length - 1) {
          const nextScene = data.video_scenes[i + 1];
          const fadeFrames = 9; // ~0.3s at 30fps
          for (let f = 0; f < fadeFrames; f++) {
            const alpha = f / fadeFrames;
            ctx.clearRect(0, 0, W, H);
            ctx.globalAlpha = 1 - alpha;
            await drawScene(ctx, scene, i);
            ctx.globalAlpha = alpha;
            await drawScene(ctx, nextScene, i + 1);
            ctx.globalAlpha = 1;
            await new Promise((r) => setTimeout(r, 1000 / 30));
          }
        }
      }

      recorder.stop();
      const videoBlob = await recordingDone;
      downloadBlob(videoBlob, `reel-${slugify(data.title)}.webm`);

      toast({ title: 'Video exportado', description: `Reel de ${data.video_scenes.reduce((s, sc) => s + sc.duration_seconds, 0).toFixed(1)}s descargado como WebM` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  const exportCaption = () => {
    const text = `${data.caption}\n\n${data.hashtags.join(' ')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, `caption-${slugify(data.title)}.txt`);
    toast({ title: 'Caption descargado' });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Exportar reel</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={exportWebM} disabled={!!exporting}>
          {exporting === 'webm' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Film className="h-3 w-3 mr-1" />}
          WebM video
        </Button>
        <Button size="sm" variant="outline" onClick={exportFrames} disabled={!!exporting}>
          {exporting === 'frames' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileImage className="h-3 w-3 mr-1" />}
          ZIP (frames + guion)
        </Button>
        <Button size="sm" variant="ghost" onClick={exportCaption} disabled={!!exporting}>
          <FileText className="h-3 w-3 mr-1" />
          Caption
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        WebM funciona en Chrome y Firefox. Para MP4, convierte el WebM con herramientas externas (HandBrake, FFmpeg).
      </p>
    </div>
  );
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 40);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
