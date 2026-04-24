import { useState, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Rocket } from "lucide-react";
import type { OnboardingStepData } from "@/hooks/useOnboarding";
import type { ArticleContent } from "@/hooks/useArticlesSaas";

interface ArticleReadyStepProps {
  onFinish: () => void;
  onConnectWordPress?: () => void;
  stepData?: OnboardingStepData;
  siteId?: string;
}

const BASE_CHECKLIST_ITEMS = [
  { step_key: "business_setup", status: "completed" },
  { step_key: "style_setup", status: "completed" },
  { step_key: "first_article", status: "completed" },
  { step_key: "wordpress_connect", status: "pending" },
  { step_key: "first_publish", status: "pending" },
  { step_key: "content_profile", status: "pending" },
  { step_key: "auto_publish", status: "pending" },
];

function buildChecklistItems(hasCatalan: boolean) {
  const items = [...BASE_CHECKLIST_ITEMS];
  if (hasCatalan) {
    const wpIndex = items.findIndex((i) => i.step_key === "wordpress_connect");
    items.splice(wpIndex, 0, { step_key: "polylang_setup", status: "pending" });
  }
  return items;
}

const CONFETTI_COLORS = ["#8B5CF6", "#D946EF", "#F97316", "#22C55E", "#3B82F6", "#EAB308"];

function ConfettiParticles() {
  const [visible, setVisible] = useState(true);
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 1.5}s`,
        duration: `${1.5 + Math.random() * 1.5}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 4 + Math.random() * 6,
      })),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

const ALLOWED_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "a",
  "blockquote",
  "code",
  "pre",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "div",
  "span",
  "hr",
  "img",
  "br",
];
const ALLOWED_ATTR = ["href", "target", "rel", "class", "id", "src", "alt"];

function ArticlePreview({ content, imageUrl }: { content: ArticleContent; imageUrl?: string | null }) {
  return (
    <div className="p-3 sm:p-4 space-y-4">
      {imageUrl && <img src={imageUrl} alt={content.title} className="w-full max-h-48 object-cover rounded-lg" />}
      <h3 className="text-base font-semibold leading-snug">{content.title}</h3>
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content.content, {
            ALLOWED_TAGS,
            ALLOWED_ATTR,
            ALLOW_DATA_ATTR: false,
          }),
        }}
      />
    </div>
  );
}

export function ArticleReadyStep({ onFinish: _onFinish, onConnectWordPress, stepData, siteId }: ArticleReadyStepProps) {
  const { user } = useAuth();
  const [article, setArticle] = useState<{
    content_spanish: ArticleContent | null;
    content_catalan: ArticleContent | null;
    image_url: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const articleId = stepData?.step5?.article_id as string | undefined;
  const hasCatalan = !!(stepData?.step_content_prefs as Record<string, unknown> | undefined)?.catalan;

  useEffect(() => {
    if (!articleId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("articles")
        .select("content_spanish, content_catalan, image_url")
        .eq("id", articleId)
        .single();
      if (data) {
        setArticle({
          content_spanish: data.content_spanish as unknown as ArticleContent | null,
          content_catalan: data.content_catalan as unknown as ArticleContent | null,
          image_url: data.image_url,
        });
      }
      setIsLoading(false);
    };
    load();
  }, [articleId]);

  const spanishContent = article?.content_spanish;
  const catalanContent = article?.content_catalan;
  const showTabs = hasCatalan && catalanContent && spanishContent;
  const primaryContent = spanishContent || catalanContent;

  const wordCount = primaryContent?.content
    ? primaryContent.content
        .replace(/<[^>]*>/g, "")
        .split(/\s+/)
        .filter(Boolean).length
    : 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  const handleComplete = async () => {
    if (user?.id && siteId) {
      const items = buildChecklistItems(hasCatalan).map((item) => ({
        user_id: user.id,
        site_id: siteId,
        step_key: item.step_key,
        status: item.status,
        completed_at: item.status === "completed" ? new Date().toISOString() : null,
      }));
      const { error } = await supabase.from("onboarding_checklist").insert(items as any);
      if (error) console.error("Error creating checklist:", error);
    }
    if (onConnectWordPress) onConnectWordPress();
  };

  return (
    <div className="relative space-y-5 sm:space-y-6 py-2">
      <ConfettiParticles />

      <div className="relative z-10 text-center space-y-2 sm:space-y-3">
        <div className="text-4xl sm:text-5xl animate-bounce-in">🎉</div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">¡Tu primer artículo está listo!</h2>
        {primaryContent?.title && (
          <p className="text-sm sm:text-base font-medium text-foreground italic max-w-lg mx-auto leading-snug">
            &ldquo;{primaryContent.title}&rdquo;
          </p>
        )}
        {wordCount > 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            📝 {wordCount.toLocaleString()} palabras · ⏱️ {readTime} min de lectura
            {showTabs && <span> · 🌐 Disponible en español y catalán</span>}
          </p>
        )}
      </div>

      <div
        className="relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-500"
        style={{ animationDelay: "300ms", animationFillMode: "both" }}
      >
        {isLoading ? (
          <div className="h-[260px] sm:h-[320px] rounded-xl border border-border bg-card flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : showTabs && spanishContent && catalanContent ? (
          <Tabs defaultValue="es" className="rounded-xl border border-border bg-card">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-10 px-2">
              <TabsTrigger value="es" className="text-xs">
                🇪🇸 Español
              </TabsTrigger>
              <TabsTrigger value="ca" className="text-xs">
                🏴󠁥󠁳󠁣󠁴󠁿 Català
              </TabsTrigger>
            </TabsList>
            <TabsContent value="es" className="m-0">
              <ScrollArea className="h-[260px] sm:h-[320px]">
                <ArticlePreview content={spanishContent} imageUrl={article?.image_url} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="ca" className="m-0">
              <ScrollArea className="h-[260px] sm:h-[320px]">
                <ArticlePreview content={catalanContent} imageUrl={article?.image_url} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : primaryContent ? (
          <ScrollArea className="h-[260px] sm:h-[320px] rounded-xl border border-border bg-card">
            <ArticlePreview content={primaryContent} imageUrl={article?.image_url} />
          </ScrollArea>
        ) : (
          <div className="h-[260px] sm:h-[320px] rounded-xl border border-border bg-card flex items-center justify-center">
            <p className="text-center text-muted-foreground py-8">No se pudo cargar la vista previa del artículo.</p>
          </div>
        )}
      </div>

      <div className="relative z-10 space-y-3 pt-1 sm:pt-2">
        <Button
          onClick={handleComplete}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white gap-2 rounded-lg shadow-md"
          size="lg"
        >
          <Rocket className="w-5 h-5" />
          Conectar WordPress y publicar
        </Button>
        <p className="text-xs text-center text-muted-foreground py-2 sm:py-0">
          No te preocupes, nada se publicará hasta que tú lo decidas.
        </p>
      </div>
    </div>
  );
}
