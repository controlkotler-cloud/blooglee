import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { ReelScene } from './types';
import { getTotalDuration } from './types';

interface Props {
  scenes: ReelScene[];
  autoPlay?: boolean;
}

const GRADIENT_BG = 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F97316 100%)';
const DARK_OVERLAY = 'rgba(0,0,0,0.45)';

export function ReelPreview({ scenes, autoPlay = false }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scene = scenes[currentIndex];
  const totalDuration = getTotalDuration(scenes);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advanceScene = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= scenes.length) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
      setProgress(0);
      startTimeRef.current = Date.now();
      setTransitioning(false);
    }, 300);
  }, [scenes.length]);

  useEffect(() => {
    stopTimer();
    if (!isPlaying || !scene) return;

    startTimeRef.current = Date.now();
    const duration = (scene.duration_seconds || 3) * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct >= 1) {
        stopTimer();
        advanceScene();
      }
    }, 50);

    return stopTimer;
  }, [isPlaying, currentIndex, scene, stopTimer, advanceScene]);

  const handlePlayPause = () => {
    if (!isPlaying && currentIndex >= scenes.length - 1 && progress >= 1) {
      setCurrentIndex(0);
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    stopTimer();
    setIsPlaying(false);
    setCurrentIndex(0);
    setProgress(0);
    setTransitioning(false);
  };

  if (!scene) return null;

  const bgStyle = scene.image_url
    ? { backgroundImage: `url(${scene.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: GRADIENT_BG };

  // Compute elapsed time up to current scene
  let elapsed = 0;
  for (let i = 0; i < currentIndex; i++) elapsed += scenes[i].duration_seconds || 3;
  elapsed += progress * (scene.duration_seconds || 3);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Phone frame */}
      <div className="relative rounded-[2rem] border-4 border-foreground/10 bg-black overflow-hidden shadow-2xl"
        style={{ width: 270, height: 480 }}
      >
        {/* Scene content */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            ...bgStyle,
            opacity: transitioning ? 0 : 1,
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0" style={{ background: DARK_OVERLAY }} />

          {/* Text content */}
          <div className="relative z-10 flex flex-col justify-center items-center h-full px-6 text-center text-white">
            {scene.scene_type === 'cover' && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-70 font-medium">Blooglee</p>
                <h2 className="text-lg font-bold leading-tight drop-shadow-lg">{scene.headline}</h2>
                {scene.body && <p className="text-xs opacity-80 leading-relaxed">{scene.body}</p>}
              </div>
            )}

            {scene.scene_type === 'content' && (
              <div className="space-y-3 animate-fade-in">
                <h3 className="text-base font-bold leading-tight drop-shadow-lg">{scene.headline}</h3>
                {scene.body && (
                  <p className="text-[11px] opacity-90 leading-relaxed max-w-[200px]">{scene.body}</p>
                )}
              </div>
            )}

            {scene.scene_type === 'cta' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold leading-tight drop-shadow-lg">{scene.headline}</h3>
                {scene.body && <p className="text-xs opacity-90">{scene.body}</p>}
                <div className="inline-block px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                  <span className="text-xs font-semibold">blooglee.com</span>
                </div>
              </div>
            )}
          </div>

          {/* Scene indicator dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
            {scenes.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-200"
                style={{
                  width: i === currentIndex ? 16 : 6,
                  background: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>

          {/* Progress bar at top */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-20">
            <div
              className="h-full bg-white/80 transition-[width] duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={handleReset} className="h-8 w-8 p-0">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          onClick={handlePlayPause}
          className="h-8 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
          {isPlaying ? 'Pausar' : 'Reproducir'}
        </Button>
        <span className="text-xs text-muted-foreground font-mono">
          {elapsed.toFixed(1)}s / {totalDuration.toFixed(1)}s
        </span>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} width={1080} height={1920} className="hidden" />
    </div>
  );
}
