import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ExtractionStatus = 'idle' | 'extracting' | 'done' | 'failed';

export interface ExtractedSiteProfile {
  colors: string[];
  description?: string;
  social_link?: string;
  blog_url?: string;
  keywords?: string;
  business_name?: string;
  business_type?: string;
  sector?: string;
  location?: string;
  tone_suggestion?: string;
  audience_suggestion?: string;
  content_goal_suggestion?: string;
  editorial_focus_suggestion?: string;
  languages?: string[];
  source: string;
}

export function useColorPalette() {
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('idle');
  const [colors, setColors] = useState<string[]>([]);
  const [extractedProfile, setExtractedProfile] = useState<ExtractedSiteProfile | null>(null);

  const resetExtraction = useCallback(() => {
    setExtractionStatus('idle');
    setColors([]);
    setExtractedProfile(null);
  }, []);

  const triggerExtraction = useCallback(async (url: string, siteId?: string) => {
    if (!url?.trim()) return null;

    setExtractionStatus('extracting');
    setColors([]);
    setExtractedProfile(null);

    console.log('[useColorPalette] Triggering extraction for:', url, 'site:', siteId || '(preview only)');

    try {
      const { data, error } = await supabase.functions.invoke('extract-color-palette', {
        body: { url, site_id: siteId ?? null },
      });

      if (error) {
        console.error('[useColorPalette] Edge function error:', error);
        setExtractionStatus('failed');
        return null;
      }

      const profile = (data || null) as ExtractedSiteProfile | null;
      const palette = profile?.colors || [];

      setColors(palette);
      setExtractedProfile(profile);
      setExtractionStatus('done');
      console.log('[useColorPalette] Extraction complete:', profile);

      return profile;
    } catch (err) {
      console.error('[useColorPalette] Unexpected extraction error:', err);
      setExtractionStatus('failed');
      return null;
    }
  }, []);

  return {
    colors,
    extractedProfile,
    extractionStatus,
    resetExtraction,
    triggerExtraction,
  };
}
