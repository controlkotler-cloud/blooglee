import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ExtractionStatus = "idle" | "extracting" | "done" | "failed";

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
  success?: boolean;
  error?: string;
}

export function useColorPalette() {
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>("idle");
  const [colors, setColors] = useState<string[]>([]);
  const [extractedProfile, setExtractedProfile] = useState<ExtractedSiteProfile | null>(null);

  const resetExtraction = useCallback(() => {
    setExtractionStatus("idle");
    setColors([]);
    setExtractedProfile(null);
  }, []);

  const triggerExtraction = useCallback(async (url: string, siteId?: string) => {
    if (!url?.trim()) return null;

    setExtractionStatus("extracting");
    setColors([]);
    setExtractedProfile(null);

    console.log("[useColorPalette] Triggering extraction for:", url, "site:", siteId || "(preview only)");

    try {
      const PREVIEW_FALLBACK_SITE_ID = "00000000-0000-0000-0000-000000000000";

      const invokeExtraction = async (payloadSiteId: string) =>
        supabase.functions.invoke("extract-color-palette", {
          body: { url, site_id: payloadSiteId },
        });

      // Always send a site_id to stay compatible with old/new edge versions.
      const effectiveSiteId = siteId ?? PREVIEW_FALLBACK_SITE_ID;
      const { data, error } = await invokeExtraction(effectiveSiteId);

      if (error) {
        const errorWithContext = error as { context?: unknown };
        console.error("[useColorPalette] Edge function error:", {
          message: error.message,
          name: error.name,
          context: errorWithContext.context,
        });
        setExtractionStatus("failed");
        return null;
      }

      const profile = (data || null) as ExtractedSiteProfile | null;
      if (!profile) {
        console.error("[useColorPalette] Empty response payload from extract-color-palette");
        setExtractionStatus("failed");
        return null;
      }

      if (profile.success === false) {
        console.error("[useColorPalette] Extract function returned success=false:", profile.error || "unknown");
        setExtractionStatus("failed");
        return null;
      }

      const palette = profile?.colors || [];

      setColors(palette);
      setExtractedProfile(profile);
      setExtractionStatus("done");
      console.log("[useColorPalette] Extraction complete:", profile);

      return profile;
    } catch (err) {
      console.error("[useColorPalette] Unexpected extraction error:", err);
      setExtractionStatus("failed");
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
