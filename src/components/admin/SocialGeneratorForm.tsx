import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Wand2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  onGenerate: (params: {
    blogPostId?: string;
    platform: string;
    contentType: string;
    language: string;
    customTopic?: string;
  }) => Promise<any>;
  isGenerating: boolean;
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
];

export function SocialGeneratorForm({ onGenerate, isGenerating }: Props) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'blog' | 'bulk' | 'custom'>('blog');
  const [selectedPost, setSelectedPost] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [language, setLanguage] = useState('spanish');
  const [customTopic, setCustomTopic] = useState('');
  const [customPlatform, setCustomPlatform] = useState('instagram');
  const [bulkGenerating, setBulkGenerating] = useState<string | null>(null);

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['blog-posts-for-social'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, image_url, excerpt, audience')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      return data || [];
    },
  });

  // Get blog_post_ids that already have social content
  const { data: existingSocialIds = [] } = useQuery({
    queryKey: ['social-content-blog-ids'],
    queryFn: async () => {
      const { data } = await supabase
        .from('social_content' as any)
        .select('blog_post_id')
        .not('blog_post_id', 'is', null);
      const ids = new Set((data || []).map((d: any) => d.blog_post_id));
      return Array.from(ids) as string[];
    },
  });

  const postsWithoutSocial = blogPosts.filter(p => !existingSocialIds.includes(p.id));

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleGenerateFromBlog = async () => {
    if (!selectedPost || selectedPlatforms.length === 0) return;
    for (const platform of selectedPlatforms) {
      await onGenerate({ blogPostId: selectedPost, platform, contentType: 'post', language });
    }
  };

  const handleGenerateCustom = async () => {
    if (!customTopic.trim()) return;
    await onGenerate({ platform: customPlatform, contentType: 'post', language, customTopic });
  };

  const handleGenerateAllPlatforms = async (post: typeof blogPosts[0]) => {
    setBulkGenerating(post.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-from-blog', {
        body: {
          blogPostId: post.id,
          title: post.title,
          excerpt: post.excerpt || '',
          slug: post.slug,
          imageUrl: post.image_url,
          audience: post.audience || 'empresas',
        },
      });
      if (error) throw error;
      toast({
        title: 'Social generado',
        description: `Se han generado ${data?.platforms?.succeeded || 4} posts para "${post.title.substring(0, 40)}..."`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al generar contenido social',
        variant: 'destructive',
      });
    } finally {
      setBulkGenerating(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          Generar Contenido Social
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="bulk" className="flex-1 text-xs">
              4 Redes
              {postsWithoutSocial.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{postsWithoutSocial.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex-1 text-xs">Individual</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1 text-xs">Libre</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Genera posts para las 4 redes sociales con imagen adaptada automáticamente desde un blog post.
            </p>
            {postsWithoutSocial.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">Todos los posts tienen contenido social</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {postsWithoutSocial.map(post => (
                  <div key={post.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card">
                    <span className="text-xs line-clamp-2 flex-1">{post.title}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateAllPlatforms(post)}
                      disabled={bulkGenerating !== null || isGenerating}
                      className="shrink-0"
                    >
                      {bulkGenerating === post.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blog" className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Blog Post</Label>
              <Select value={selectedPost} onValueChange={setSelectedPost}>
                <SelectTrigger><SelectValue placeholder="Seleccionar artículo..." /></SelectTrigger>
                <SelectContent>
                  {blogPosts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Plataformas</Label>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedPlatforms.includes(p.id)}
                      onCheckedChange={() => togglePlatform(p.id)}
                    />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spanish">Español</SelectItem>
                  <SelectItem value="catalan">Catalán</SelectItem>
                  <SelectItem value="english">Inglés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateFromBlog}
              disabled={isGenerating || !selectedPost || selectedPlatforms.length === 0}
              className="w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 text-white"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generar {selectedPlatforms.length} adaptación(es)
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Tema</Label>
              <Textarea
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Escribe el tema o idea para el post..."
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Plataforma</Label>
              <Select value={customPlatform} onValueChange={setCustomPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spanish">Español</SelectItem>
                  <SelectItem value="catalan">Catalán</SelectItem>
                  <SelectItem value="english">Inglés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateCustom}
              disabled={isGenerating || !customTopic.trim()}
              className="w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 text-white"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generar
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
