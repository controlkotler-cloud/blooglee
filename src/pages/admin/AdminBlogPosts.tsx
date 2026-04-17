import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import {
  useAllAdminBlogPosts,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  slugify,
  type AdminBlogPost,
} from "@/hooks/useAdminBlogPosts";

const CATEGORIES = ["SEO", "Marketing", "Tutoriales", "Comparativas", "Producto", "Tendencias"];
const AUDIENCES = [
  { value: "todos", label: "Todos" },
  { value: "empresas", label: "Empresas" },
  { value: "agencias", label: "Agencias" },
];
const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "ca", label: "Català" },
];

const EMPTY: Partial<AdminBlogPost> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image_url: "",
  category: "SEO",
  audience: "todos",
  language: "es",
  author_name: "Equipo Blooglee",
  author_role: "Marketing Digital",
  read_time: "5 min",
  seo_keywords: [],
  is_published: false,
};

export default function AdminBlogPosts() {
  const { data: posts = [], isLoading } = useAllAdminBlogPosts();
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const deleteMutation = useDeleteBlogPost();
  const [editing, setEditing] = useState<Partial<AdminBlogPost> | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);

  const isNew = editing && !editing.id;

  const openNew = () => {
    setEditing({ ...EMPTY });
    setAutoSlug(true);
  };

  const openEdit = (post: AdminBlogPost) => {
    setEditing({ ...post });
    setAutoSlug(false);
  };

  const close = () => setEditing(null);

  const handleTitleChange = (value: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      title: value,
      slug: autoSlug ? slugify(value) : editing.slug,
    });
  };

  const handleSave = async (publish: boolean) => {
    if (!editing) return;
    const payload: Partial<AdminBlogPost> = {
      ...editing,
      is_published: publish,
      published_at: publish && !editing.published_at
        ? new Date().toISOString()
        : editing.published_at,
      seo_keywords: Array.isArray(editing.seo_keywords)
        ? editing.seo_keywords
        : typeof editing.seo_keywords === "string"
          ? (editing.seo_keywords as string).split(",").map((k) => k.trim()).filter(Boolean)
          : [],
    };
    if (isNew) {
      await createMutation.mutateAsync(payload);
    } else if (editing.id) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    }
    close();
  };

  const handleDelete = async (post: AdminBlogPost) => {
    if (!confirm(`¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`)) return;
    await deleteMutation.mutateAsync(post.id);
  };

  const published = posts.filter((p) => p.is_published);
  const drafts = posts.filter((p) => !p.is_published);

  const renderPostRow = (post: AdminBlogPost) => (
    <Card key={post.id}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={post.is_published ? "default" : "secondary"}>
                {post.is_published ? "Publicado" : "Borrador"}
              </Badge>
              <Badge variant="outline">{post.category}</Badge>
              {post.audience && post.audience !== "todos" && (
                <Badge variant="outline">{post.audience}</Badge>
              )}
              {post.language === "ca" && <Badge variant="outline">CA</Badge>}
            </div>
            <h3 className="font-semibold truncate">{post.title}</h3>
            <p className="text-xs text-muted-foreground font-mono mt-1">/{post.slug}</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {post.is_published && (
              <Button variant="ghost" size="icon" asChild>
                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(post)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Blog de Blooglee</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los posts del blog propio de Blooglee (blooglee.com/blog).
            </p>
          </div>
          <Button onClick={openNew} className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
            <Plus className="h-4 w-4 mr-2" /> Nuevo post
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {drafts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Borradores ({drafts.length})</h2>
                <div className="space-y-2">{drafts.map(renderPostRow)}</div>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold mb-3">Publicados ({published.length})</h2>
              <div className="space-y-2">{published.map(renderPostRow)}</div>
            </div>
          </>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Crear nuevo post" : "Editar post"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={editing.title || ""}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Título del post"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Slug (URL)</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={autoSlug} onCheckedChange={setAutoSlug} />
                    <span className="text-xs text-muted-foreground">Auto desde título</span>
                  </div>
                </div>
                <Input
                  value={editing.slug || ""}
                  onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                  placeholder="slug-del-post"
                  disabled={autoSlug && isNew}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL: blooglee.com/blog/{editing.slug || "..."}
                </p>
              </div>

              <div>
                <Label>Excerpt (resumen, 150-160 caracteres)</Label>
                <Textarea
                  value={editing.excerpt || ""}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  rows={2}
                  maxLength={250}
                />
                <p className="text-xs text-muted-foreground mt-1">{(editing.excerpt || "").length} chars</p>
              </div>

              <div>
                <Label>Contenido (Markdown)</Label>
                <Textarea
                  value={editing.content || ""}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={18}
                  className="font-mono text-sm"
                  placeholder="## Primera sección&#10;&#10;Contenido en markdown..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(editing.content || "").trim().split(/\s+/).filter(Boolean).length} palabras
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={editing.category || "SEO"}
                    onValueChange={(v) => setEditing({ ...editing, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Audiencia</Label>
                  <Select
                    value={editing.audience || "todos"}
                    onValueChange={(v) => setEditing({ ...editing, audience: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AUDIENCES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Idioma</Label>
                  <Select
                    value={editing.language || "es"}
                    onValueChange={(v) => setEditing({ ...editing, language: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tiempo de lectura</Label>
                  <Input
                    value={editing.read_time || "5 min"}
                    onChange={(e) => setEditing({ ...editing, read_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>URL imagen destacada</Label>
                <Input
                  value={editing.image_url || ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  placeholder="https://..."
                />
                {editing.image_url && (
                  <img
                    src={editing.image_url}
                    alt=""
                    className="w-full max-w-sm mt-2 rounded-lg border"
                  />
                )}
              </div>

              <div>
                <Label>SEO Keywords (separadas por comas)</Label>
                <Input
                  value={
                    Array.isArray(editing.seo_keywords)
                      ? editing.seo_keywords.join(", ")
                      : (editing.seo_keywords as unknown as string) || ""
                  }
                  onChange={(e) => setEditing({ ...editing, seo_keywords: e.target.value as any })}
                  placeholder="seo, marketing de contenidos, wordpress"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Autor</Label>
                  <Input
                    value={editing.author_name || ""}
                    onChange={(e) => setEditing({ ...editing, author_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Rol autor</Label>
                  <Input
                    value={editing.author_role || ""}
                    onChange={(e) => setEditing({ ...editing, author_role: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={close}>Cancelar</Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Guardar como borrador
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500"
            >
              Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
