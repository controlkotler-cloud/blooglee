import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ExtractionStatus = 'idle' | 'extracting' | 'done' | 'failed';

/** Parse comma-separated hex string into array */
function parsePalette(raw: string | null | undefined): string[] {
  if (!raw || !raw.includes('#')) return [];
  return raw.split(',').map(c => c.trim()).filter(c => /^#[0-9a-fA-F]{6}$/.test(c));
}

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

      const raw = data?.color_palette as string | null;

      // color_palette is now a comma-separated hex string
      // Empty string means extraction completed but found no colors
      if (raw !== null && raw !== undefined) {
        const palette = parsePalette(raw);
        if (palette.length > 0) {
          setColors(palette);
          setExtractionStatus('done');
          stopPolling();
          return;
        }
        // If raw is empty string or has no valid hex, extraction is done with no results
        if (raw === '' || (raw && !raw.includes('#'))) {
          // Could be empty result or legacy preset — check elapsed time
          if (elapsed >= POLL_INTERVAL * 2) {
            setExtractionStatus('done');
            stopPolling();
            return;
          }
        }
      }

      if (elapsed >= MAX_WAIT) {
        setExtractionStatus('failed');
        stopPolling();
      }
    }, POLL_INTERVAL);
  }, [stopPolling]);

  return { colors, extractionStatus, triggerExtraction };
}
