import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Check, Sparkles, ExternalLink, Trash2, Plus, Loader2 } from "lucide-react";
import {
  useAdminSectors,
  useUpdateSector,
  type SectorContext,
  type AuthoritySource,
} from "@/hooks/useAdminSectors";

export default function AdminSectors() {
  const { data: sectors = [], isLoading } = useAdminSectors();
  const updateMutation = useUpdateSector();
  const [editing, setEditing] = useState<SectorContext | null>(null);
  const [draftSources, setDraftSources] = useState<AuthoritySource[]>([]);

  const pendingReview = sectors.filter((s) => s.needs_review);
  const reviewed = sectors.filter((s) => !s.needs_review);

  const openEditor = (sector: SectorContext) => {
    setEditing(sector);
    setDraftSources(sector.authority_sources || []);
  };

  const closeEditor = () => {
    setEditing(null);
    setDraftSources([]);
  };

  const addNewSource = () => {
    setDraftSources([
      ...draftSources,
      { label: "", url: "", source_type: "official", topics: [], is_active: true },
    ]);
  };

  const removeSource = (idx: number) => {
    setDraftSources(draftSources.filter((_, i) => i !== idx));
  };

  const updateSource = (idx: number, field: keyof AuthoritySource, value: unknown) => {
    const copy = [...draftSources];
    copy[idx] = { ...copy[idx], [field]: value } as AuthoritySource;
    setDraftSources(copy);
  };

  const handleSave = async (markReviewed: boolean) => {
    if (!editing) return;
    const cleanSources = draftSources.filter((s) => s.label?.trim() && s.url?.trim());
    await updateMutation.mutateAsync({
      id: editing.id,
      authority_sources: cleanSources,
      needs_review: markReviewed ? false : editing.needs_review,
    });
    closeEditor();
  };

  const handleMarkReviewed = async (sector: SectorContext) => {
    await updateMutation.mutateAsync({ id: sector.id, needs_review: false });
  };

  const renderSectorCard = (sector: SectorContext) => (
    <Card key={sector.id} className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              <span className="font-mono">{sector.sector_key}</span>
              {sector.auto_generated && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" /> Auto-generado
                </Badge>
              )}
              {sector.needs_review && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Pendiente revisión
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {sector.authority_sources?.length || 0} fuentes ·{" "}
              {sector.prohibited_terms?.length || 0} términos prohibidos
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {sector.needs_review && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkReviewed(sector)}
                disabled={updateMutation.isPending}
              >
                <Check className="w-4 h-4 mr-1" /> OK
              </Button>
            )}
            <Button size="sm" onClick={() => openEditor(sector)}>
              Editar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {(sector.authority_sources || []).slice(0, 5).map((src, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <a
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline truncate flex items-center gap-1 min-w-0"
              >
                <span className="truncate">{src.label}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              {src.source_type && (
                <Badge variant="outline" className="text-[10px]">
                  {src.source_type}
                </Badge>
              )}
            </div>
          ))}
          {(sector.authority_sources?.length || 0) > 5 && (
            <p className="text-xs text-muted-foreground">
              +{sector.authority_sources.length - 5} más
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sectores y Fuentes de Autoridad</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las fuentes que usan los artículos generados por sector.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {pendingReview.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <h2 className="text-lg font-semibold">
                    Pendientes de revisión ({pendingReview.length})
                  </h2>
                </div>
                <div>{pendingReview.map(renderSectorCard)}</div>
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold mb-3">
                Sectores revisados ({reviewed.length})
              </h2>
              <div>{reviewed.map(renderSectorCard)}</div>
            </section>
          </>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar sector: <span className="font-mono">{editing?.sector_key}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {draftSources.map((src, idx) => (
              <Card key={idx} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">
                    Fuente #{idx + 1}
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSource(idx)}
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={src.label || ""}
                      onChange={(e) => updateSource(idx, "label", e.target.value)}
                      placeholder="Ej: AEMPS"
                      className="h-9"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">URL</Label>
                    <Input
                      value={src.url || ""}
                      onChange={(e) => updateSource(idx, "url", e.target.value)}
                      placeholder="https://..."
                      className="h-9 font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={src.source_type || "official"}
                        onValueChange={(v) => updateSource(idx, "source_type", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="official">official</SelectItem>
                          <SelectItem value="association">association</SelectItem>
                          <SelectItem value="technical">technical</SelectItem>
                          <SelectItem value="stats">stats</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Activo</Label>
                      <div className="h-9 flex items-center">
                        <Switch
                          checked={src.is_active !== false}
                          onCheckedChange={(v) => updateSource(idx, "is_active", v)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Topics (separados por coma)</Label>
                    <Textarea
                      value={(src.topics || []).join(", ")}
                      onChange={(e) =>
                        updateSource(
                          idx,
                          "topics",
                          e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                        )
                      }
                      placeholder="medicamentos, seguridad, prescripcion"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button onClick={addNewSource} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Añadir fuente
            </Button>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={closeEditor}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={updateMutation.isPending}
            >
              Guardar
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Guardar y marcar revisado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
