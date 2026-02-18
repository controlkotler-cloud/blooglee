import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ExtractionStatus = 'idle' | 'extracting' | 'done' | 'failed';

/** Parse comma-separated hex string into array, handling the 'extracted:' marker */
function parsePalette(raw: string | null | undefined): string[] {
  if (!raw || !raw.includes('#')) return [];
  // Remove 'extracted:' prefix if present
  const cleaned = raw.replace(/^extracted:/, '');
  if (!cleaned) return [];
  return cleaned.split(',').map(c => c.trim()).filter(c => /^#[0-9a-fA-F]{6}$/.test(c));
}

/** Check if value indicates extraction has completed */
function isExtractionDone(raw: string | null | undefined): boolean {
  if (!raw) return false;
  // 'extracted:' means extraction ran but found no colors
  if (raw.startsWith('extracted:')) return true;
  // Contains hex colors = extraction done with results
  if (raw.includes('#')) return true;
  return false;
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

    console.log('[useColorPalette] Triggering extraction for:', url, 'site:', siteId);

    // Fire-and-forget: invoke edge function
    supabase.functions.invoke('extract-color-palette', {
      body: { url, site_id: siteId },
    }).then((res) => {
      console.log('[useColorPalette] Edge function response:', res.data);
    }).catch((err) => {
      console.error('[useColorPalette] Edge function error:', err);
    });

    // Poll sites table for color_palette updates
    let elapsed = 0;
    const POLL_INTERVAL = 3000;
    const MAX_WAIT = 45000;

    stopPolling();

    pollRef.current = setInterval(async () => {
      elapsed += POLL_INTERVAL;

      const { data } = await supabase
        .from('sites')
        .select('color_palette')
        .eq('id', siteId)
        .single();

      const raw = data?.color_palette as string | null;

      if (isExtractionDone(raw)) {
        const palette = parsePalette(raw);
        setColors(palette);
        setExtractionStatus('done');
        stopPolling();
        console.log('[useColorPalette] Extraction complete, colors:', palette);
        return;
      }

      if (elapsed >= MAX_WAIT) {
        console.log('[useColorPalette] Polling timed out');
        setExtractionStatus('failed');
        stopPolling();
      }
    }, POLL_INTERVAL);
  }, [stopPolling]);

  return { colors, extractionStatus, triggerExtraction };
}
