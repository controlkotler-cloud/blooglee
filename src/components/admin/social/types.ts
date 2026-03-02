export interface ReelScene {
  scene_number: number;
  duration_seconds: number;
  scene_type: 'cover' | 'content' | 'cta';
  headline: string;
  body: string;
  voiceover: string;
  visual_suggestion: string;
  image_url: string | null;
}

export interface ReelData {
  title: string;
  hook: string;
  caption: string;
  hashtags: string[];
  best_posting_time: string;
  video_scenes: ReelScene[];
}

export function parseReelData(content: string): ReelData | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.video_scenes)) return parsed as ReelData;
    return null;
  } catch {
    return null;
  }
}

export function getTotalDuration(scenes: ReelScene[]): number {
  return scenes.reduce((sum, s) => sum + (s.duration_seconds || 3), 0);
}
