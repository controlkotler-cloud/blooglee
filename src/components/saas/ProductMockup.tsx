import { useState, useEffect } from 'react';
import { Sparkles, FileText, Globe, Zap, Check } from 'lucide-react';
import bloogleeLogo from '@/assets/blooglee-logo.png';

const mockArticles = [
  { title: "10 tendencias de belleza para 2024", status: "published", lang: "ES" },
  { title: "Cómo cuidar tu piel en invierno", status: "generating", lang: "ES" },
  { title: "Els millors tractaments facials", status: "draft", lang: "CA" },
];


export function ProductMockup() {
  const [activeArticle, setActiveArticle] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [animationsReady, setAnimationsReady] = useState(false);
  const fullText = "Contenido generado automáticamente con IA...";

  // Defer animations until after LCP (~2s) to improve PageSpeed
  useEffect(() => {
    const timer = setTimeout(() => setAnimationsReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!animationsReady) return;
    const interval = setInterval(() => {
      setActiveArticle((prev) => (prev + 1) % mockArticles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [animationsReady]);

  useEffect(() => {
    if (!animationsReady) return;
    let index = 0;
    setTypingText("");
    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        setTypingText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);
    return () => clearInterval(typeInterval);
  }, [activeArticle, animationsReady]);

  return (
    <div className="mockup-container w-full max-w-lg mx-auto">
      {/* Glow effect behind mockup */}
      <div className="mockup-glow" />
      
      {/* Floating mockup */}
      <div className="mockup-float">
        {/* Browser window frame */}
        <div className="glass-card-strong rounded-2xl overflow-hidden">
          {/* Browser header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/70" />
              <div className="w-3 h-3 rounded-full bg-warning/70" />
              <div className="w-3 h-3 rounded-full bg-success/70" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-background/80 rounded-lg px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Globe className="w-3 h-3" />
                <span>app.blooglee.com/dashboard</span>
              </div>
            </div>
          </div>

          {/* App content */}
          <div className="p-5 bg-gradient-to-b from-background to-muted/20">
            {/* Mini header */}
            <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <img 
                src={bloogleeLogo} 
                alt="Blooglee" 
                className="w-10 h-10 object-contain"
              />
              <span className="font-display font-semibold text-sm bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent">Blooglee</span>
            </div>
              <div className="badge-aurora text-xs py-1 px-2.5">
                <Zap className="w-3 h-3" />
                Pro
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { value: "24", label: "Artículos" },
                { value: "12.4k", label: "Visitas" },
                { value: "98%", label: "SEO Score" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-background/60 border border-border/30">
                  <div className="font-display font-bold text-lg text-aurora">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Articles list */}
            <div className="space-y-2.5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Últimos artículos
              </div>
              {mockArticles.map((article, i) => (
                <div 
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                    i === activeArticle 
                      ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 scale-[1.02]' 
                      : 'bg-background/40 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    article.status === 'published' ? 'bg-success/20' :
                    article.status === 'generating' ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    {article.status === 'published' ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : article.status === 'generating' ? (
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{article.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {i === activeArticle && article.status === 'generating' ? (
                        <span className="text-primary">{typingText}<span className="animate-pulse">|</span></span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            article.status === 'published' ? 'bg-success' :
                            article.status === 'generating' ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
                          }`} />
                          {article.status === 'published' ? 'Publicado' : article.status === 'generating' ? 'Generando...' : 'Borrador'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    {article.lang}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA mini */}
            <button className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Sparkles className="w-4 h-4" />
              Generar nuevo artículo
            </button>
          </div>
        </div>
      </div>

      {/* Shadow below */}
      <div className="mockup-shadow" />
    </div>
  );
}
