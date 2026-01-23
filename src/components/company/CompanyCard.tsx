import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empresa } from "@/hooks/useEmpresas";
import { ArticuloEmpresa } from "@/hooks/useArticulosEmpresas";
import {
  Eye,
  RefreshCw,
  Sparkles,
  Pencil,
  Trash2,
  Loader2,
  Hand,
  Building2,
} from "lucide-react";

interface CompanyCardProps {
  company: Empresa;
  article: ArticuloEmpresa | null;
  isGenerating: boolean;
  hasWordPress?: boolean;
  onGenerate: () => void;
  onPreview: () => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CompanyCard({
  company,
  article,
  isGenerating,
  hasWordPress,
  onGenerate,
  onPreview,
  onRegenerate,
  onEdit,
  onDelete,
}: CompanyCardProps) {
  const hasArticle = !!article;
  const hasCatalan = company.languages.includes("catalan");
  const isManual = !company.auto_generate;

  return (
    <Card className={hasArticle ? "border-green-500/50 bg-green-50/30" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span>{company.location}</span>
            {company.sector && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {company.sector}
                </span>
              </>
            )}
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {isManual ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Hand className="h-3 w-3 mr-1" />
                Manual
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            )}
            <Badge variant="outline">ES</Badge>
            {hasCatalan && <Badge variant="outline">CA</Badge>}
            {hasWordPress && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                WP
              </Badge>
            )}
          </div>
        </div>
        <h3 className="font-semibold text-lg leading-tight break-words">{company.name}</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Topic display - only show if it's manual and has a custom topic */}
        {isManual && company.custom_topic && (
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              Tema: {company.custom_topic}
            </Badge>
          </div>
        )}
        
        {/* Auto-generate explanation */}
        {!isManual && (
          <p className="text-xs text-muted-foreground">
            La IA generará el tema automáticamente
          </p>
        )}

        {hasArticle && (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            ✓ Generado
          </Badge>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {hasArticle ? (
            <>
              <Button size="sm" variant="outline" onClick={onPreview}>
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onRegenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Regenerar
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-primary"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Generar
            </Button>
          )}

          <div className="flex-1" />

          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
