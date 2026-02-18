import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ExtractionStatus = 'idle' | 'extracting' | 'done' | 'failed';

export function useColorPalette() {
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('idle');
  const [colors, setColors] = useState<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const triggerExtraction = useCallback(async (url: string, siteId: string) => {
    if (!url || !siteId) return;

    setExtractionStatus('extracting');
    setColors([]);

    // Fire-and-forget: invoke edge function
    supabase.functions.invoke('extract-color-palette', {
      body: { url, site_id: siteId },
    }).catch((err) => {
      console.error('Color extraction invoke error:', err);
    });

    // Poll sites table for color_palette updates
    let elapsed = 0;
    const POLL_INTERVAL = 3000;
    const MAX_WAIT = 30000;

    stopPolling();

    pollRef.current = setInterval(async () => {
      elapsed += POLL_INTERVAL;

      const { data } = await supabase
        .from('sites')
        .select('color_palette')
        .eq('id', siteId)
        .single();

      const palette = data?.color_palette as unknown as string[] | null;

      if (palette && Array.isArray(palette) && palette.length > 0) {
        setColors(palette);
        setExtractionStatus('done');
        stopPolling();
        return;
      }

      if (elapsed >= MAX_WAIT) {
        setExtractionStatus('failed');
        stopPolling();
      }
    }, POLL_INTERVAL);
  }, [stopPolling]);

  return { colors, extractionStatus, triggerExtraction };
}
