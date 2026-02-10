import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText, Sparkles } from 'lucide-react';
import { useArticlesSaas, useDeleteArticleSaas, type Article } from '@/hooks/useArticlesSaas';
import { ArticleCard } from './ArticleCard';
import { ArticlePreviewDialog } from './ArticlePreviewDialog';
import { WordPressPublishDialogSaas } from './WordPressPublishDialogSaas';
import { toast } from 'sonner';

interface SiteArticlesProps {
  siteId: string;
  siteName?: string;
  siteSector?: string;
  onGenerateArticle: () => void;
  isGenerating: boolean;
}

const months = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export function SiteArticles({ siteId, siteName, siteSector, onGenerateArticle, isGenerating }: SiteArticlesProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [publishArticle, setPublishArticle] = useState<Article | null>(null);

  const { data: articles = [], isLoading } = useArticlesSaas(
    siteId,
    parseInt(selectedMonth),
    parseInt(selectedYear)
  );
  const deleteMutation = useDeleteArticleSaas();

  // Generate year options (current year and 2 years back)
  const years = Array.from({ length: 3 }, (_, i) => {
    const year = currentDate.getFullYear() - i;
    return { value: String(year), label: String(year) };
  });

  const handlePublish = (article: Article) => {
    setPublishArticle(article);
  };

  const handleDelete = (article: Article) => {
    if (confirm('¿Eliminar este artículo?')) {
      deleteMutation.mutate(article.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onGenerateArticle} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Generar artículo
        </Button>
      </div>

      {/* Articles grid or empty state */}
      {articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Sin artículos</h3>
            <p className="text-muted-foreground mb-4">
              No hay artículos para {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </p>
            <Button onClick={onGenerateArticle} disabled={isGenerating}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generar primer artículo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onView={() => setPreviewArticle(article)}
              onPublish={() => handlePublish(article)}
              onDelete={() => handleDelete(article)}
            />
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <ArticlePreviewDialog
        article={previewArticle}
        open={!!previewArticle}
        onClose={() => setPreviewArticle(null)}
        onPublish={() => {
          if (previewArticle) {
            setPreviewArticle(null);
            handlePublish(previewArticle);
          }
        }}
        siteSector={siteSector}
      />

      {/* Publish dialog */}
      <WordPressPublishDialogSaas
        open={!!publishArticle}
        onClose={() => setPublishArticle(null)}
        article={publishArticle}
        siteId={siteId}
        siteName={siteName}
      />
    </div>
  );
}
