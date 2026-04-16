import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WordPressSetup } from "@/components/wordpress/WordPressSetup";
import { useWordPressConfig } from "@/hooks/useWordPressConfigSaas";
import { usePublishToWordPressSaas } from "@/hooks/useArticlesSaas";
import { track } from "@/lib/analytics";
import { CheckCircle2, ExternalLink, Loader2, Send, AlertTriangle, RefreshCw } from "lucide-react";
import type { OnboardingStepData } from "@/hooks/useOnboarding";
import type { ArticleContent } from "@/hooks/useArticlesSaas";
import { Card, CardContent } from "@/components/ui/card";
import { CodeSnippetsLibrary } from "@/components/saas/CodeSnippetsLibrary";

interface WordPressOnboardingStepProps {
  onFinish: () => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

type Phase = "setup" | "preflight" | "connected" | "publishing" | "published";

interface DiagnosticCheck {
  ok: boolean;
  message: string;
}

export function WordPressOnboardingStep({ onFinish, stepData, siteId }: WordPressOnboardingStepProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("setup");
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [skipAvailable, setSkipAvailable] = useState(false);
  const [isRunningPreflight, setIsRunningPreflight] = useState(false);
  const [yoastCheck, setYoastCheck] = useState<DiagnosticCheck | null>(null);
  const [elementorCheck, setElementorCheck] = useState<DiagnosticCheck | null>(null);
  const [polylangCheck, setPolylangCheck] = useState<DiagnosticCheck | null>(null);

  const articleId = stepData?.step5?.article_id as string | undefined;
  const hasCatalan = !!(stepData?.step_content_prefs as Record<string, unknown> | undefined)?.catalan;
  const { data: wpConfig } = useWordPressConfig(siteId || "");
  const publishMutation = usePublishToWordPressSaas();

  const finalizeWpConnected = async () => {
    if (user?.id && siteId) {
      await supabase
        .from("onboarding_checklist")
        .update({ status: "completed", completed_at: new Date().toISOString() } as any)
        .eq("user_id", user.id)
        .eq("site_id", siteId)
        .eq("step_key", "wordpress_connect");
    }

    track("onboarding_wp_connected");
    queryClient.invalidateQueries({ queryKey: ["wordpress-config"] });
    queryClient.invalidateQueries({ queryKey: ["wordpress-diagnostics"] });
    setPhase("connected");
  };

  const runPreflightChecks = async (): Promise<boolean> => {
    if (!siteId) return false;
    setIsRunningPreflight(true);
    try {
      const { data: freshConfig } = await supabase
        .from("wordpress_configs")
        .select("id")
        .eq("site_id", siteId)
        .single();

      if (!freshConfig?.id) {
        toast.error("No se encontró configuración WordPress para verificar.");
        return false;
      }

      const { data, error } = await supabase.functions.invoke("sync-wordpress-taxonomies-saas", {
        body: { wordpress_config_id: freshConfig.id, analyze_content: true },
      });

      if (error || data?.error) {
        toast.error("No se pudo ejecutar la verificación de WordPress.");
        return false;
      }

      const nextYoast = (data?.yoast_check as DiagnosticCheck | null) || null;
      const nextElementor = (data?.elementor_check as DiagnosticCheck | null) || null;
      const nextPolylang = (data?.polylang_check as DiagnosticCheck | null) || null;

      setYoastCheck(nextYoast);
      setElementorCheck(nextElementor);
      setPolylangCheck(nextPolylang);

      const hasIssues =
        Boolean(nextYoast && !nextYoast.ok) ||
        Boolean(nextElementor && !nextElementor.ok) ||
        Boolean(hasCatalan && nextPolylang && !nextPolylang.ok);

      return !hasIssues;
    } catch (err) {
      console.error("Preflight check error:", err);
      toast.error("Error ejecutando la verificación final.");
      return false;
    } finally {
      setIsRunningPreflight(false);
    }
  };

  const handleSetupComplete = async () => {
    try {
      const checksOk = await runPreflightChecks();
      if (checksOk) {
        await finalizeWpConnected();
      } else {
        setPhase("preflight");
      }
    } catch (err) {
      console.error("Failed to start auto-sync:", err);
      setPhase("preflight");
    }
  };

  const handlePublish = async () => {
    if (!articleId || !siteId) return;

    setPhase("publishing");

    try {
      const { data: article } = await supabase.from("articles").select("*").eq("id", articleId).single();

      if (!article) throw new Error("Artículo no encontrado");

      const content = article.content_spanish as unknown as ArticleContent | null;
      if (!content) throw new Error("Sin contenido del artículo");

      // Allow future auto-publish now that user explicitly authorized publishing
      await supabase.from("articles").update({ skip_auto_publish: false } as any).eq("id", articleId);

      const result = await publishMutation.mutateAsync({
        site_id: siteId,
        title: content.title,
        seo_title: content.seo_title,
        content: content.content,
        slug: content.slug,
        status: "publish",
        image_url: article.image_url || undefined,
        image_alt: content.title,
        meta_description: content.meta_description,
        excerpt: content.excerpt || content.meta_description,
        focus_keyword: content.focus_keyword,
        lang: "es",
      });

      if (result.success) {
        if (result.post_url) {
          await supabase.from("articles").update({ wp_post_url: result.post_url }).eq("id", articleId);
          setPublishUrl(result.post_url);
        }

        if (user?.id) {
          await supabase
            .from("onboarding_checklist")
            .update({ status: "completed", completed_at: new Date().toISOString() } as any)
            .eq("user_id", user.id)
            .eq("site_id", siteId)
            .eq("step_key", "first_publish");
        }

        track("onboarding_first_publish_completed");
        setPhase("published");
      } else {
        throw new Error(result.error || "Error al publicar");
      }
    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error(err.message || "Error al publicar el artículo");
      setPhase("connected");
    }
  };

  const handleGoToDashboard = async () => {
    await onFinish();
    navigate("/dashboard");
  };

  // Setup phase
  if (phase === "setup") {
    if (!siteId) {
      return (
        <div className="space-y-4 py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando configuración...</p>
        </div>
      );
    }
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <WordPressSetup siteId={siteId} onClose={handleGoToDashboard} onComplete={handleSetupComplete} />
      </div>
    );
  }

  // Preflight phase - fix Yoast/Polylang/Elementor before continuing
  if (phase === "preflight") {
    return (
      <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-500 py-2 sm:py-4">
        <div className="text-center space-y-2">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">
            Revisión final antes de publicar
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Hemos detectado ajustes pendientes en tu WordPress. Te indicamos exactamente qué cambiar y luego lo
            verificamos.
          </p>
        </div>

        {yoastCheck && !yoastCheck.ok && (
          <Card className="border-amber-300 bg-amber-50/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Yoast SEO necesita ajuste</p>
                  <p className="text-sm text-amber-800">{yoastCheck.message}</p>
                </div>
              </div>
              <CodeSnippetsLibrary filterPlugin="yoast" />
            </CardContent>
          </Card>
        )}

        {hasCatalan && polylangCheck && !polylangCheck.ok && (
          <Card className="border-amber-300 bg-amber-50/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Polylang necesita ajuste</p>
                  <p className="text-sm text-amber-800">{polylangCheck.message}</p>
                </div>
              </div>
              <CodeSnippetsLibrary filterPlugin="polylang" />
            </CardContent>
          </Card>
        )}

        {elementorCheck && !elementorCheck.ok && (
          <Card className="border-amber-300 bg-amber-50/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Elementor necesita revisión</p>
                  <p className="text-sm text-amber-800">{elementorCheck.message}</p>
                </div>
              </div>
              <ol className="list-decimal list-inside text-sm text-amber-900 space-y-1">
                <li>WordPress → Elementor → Theme Builder → Single Post</li>
                <li>
                  Verifica que la plantilla incluya el widget <strong>Post Content</strong>
                </li>
                <li>
                  En Display Conditions, incluye <strong>All Posts</strong> o las categorías del blog
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={async () => {
              const ok = await runPreflightChecks();
              if (ok) {
                await finalizeWpConnected();
              } else {
                toast.warning("Aún quedan ajustes pendientes. Revisa los bloques y verifica de nuevo.");
              }
            }}
            disabled={isRunningPreflight}
            className="w-full sm:w-auto"
          >
            {isRunningPreflight ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Ya lo he hecho, verificar
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={handleGoToDashboard} className="w-full sm:w-auto">
            Lo revisaré más tarde
          </Button>
        </div>
      </div>
    );
  }

  // Connected — offer to publish
  if (phase === "connected") {
    return (
      <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-500 py-2 sm:py-4">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">✅ ¡WordPress conectado!</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Ya puedes publicar tu artículo directamente en tu blog. ¿Quieres publicarlo ahora?
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handlePublish}
            className="w-full h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white gap-2 text-base"
            size="lg"
          >
            <Send className="w-4 h-4" />
            Publicar en mi blog →
          </Button>

          <Button variant="ghost" onClick={handleGoToDashboard} className="w-full h-11 text-muted-foreground">
            Prefiero revisarlo antes →
          </Button>
        </div>
      </div>
    );
  }

  // Publishing
  if (phase === "publishing") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 py-6 sm:py-8">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">Publicando tu artículo...</h2>
          <p className="text-sm text-muted-foreground">Esto solo tardará unos segundos.</p>
        </div>
      </div>
    );
  }

  // Published
  if (phase === "published") {
    return (
      <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-500 py-2 sm:py-4">
        <div className="text-center space-y-3">
          <div className="text-4xl sm:text-5xl">🚀</div>
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">¡Artículo publicado!</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tu primer artículo ya está en tu blog. ¡Felicidades!
          </p>
        </div>

        {publishUrl && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <a
              href={publishUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Ver artículo en tu blog
            </a>
          </div>
        )}

        <Button
          onClick={handleGoToDashboard}
          className="w-full h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white text-base"
          size="lg"
        >
          Ir al dashboard →
        </Button>
      </div>
    );
  }
  // Fallback: should not reach here
  return (
    <div className="space-y-4 py-8 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  );
}
