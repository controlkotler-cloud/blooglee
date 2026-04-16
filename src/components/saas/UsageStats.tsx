import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Globe, FileText, Calendar } from "lucide-react";

interface UsageStatsProps {
  sitesUsed: number;
  sitesLimit: number;
  articlesThisMonth: number;
  articlesLimit?: number;
  nextGenerationDate?: string;
}

export function UsageStats({
  sitesUsed,
  sitesLimit,
  articlesThisMonth,
  articlesLimit,
  nextGenerationDate,
}: UsageStatsProps) {
  const sitesPercentage = Math.min((sitesUsed / sitesLimit) * 100, 100);
  const isSitesAtLimit = sitesUsed >= sitesLimit;

  const hasArticleLimit = articlesLimit !== undefined && articlesLimit > 0;
  const articlesPercentage = hasArticleLimit ? Math.min((articlesThisMonth / articlesLimit) * 100, 100) : 0;
  const isArticlesAtLimit = hasArticleLimit && articlesThisMonth >= articlesLimit;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Uso del plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sites usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>Sitios</span>
            </div>
            <span className={isSitesAtLimit ? "text-destructive font-medium" : ""}>
              {sitesUsed} / {sitesLimit}
            </span>
          </div>
          <Progress value={sitesPercentage} className={isSitesAtLimit ? "[&>div]:bg-destructive" : ""} />
        </div>

        {/* Articles this month */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Artículos este mes</span>
            </div>
            <span className={isArticlesAtLimit ? "text-destructive font-medium" : "font-medium"}>
              {articlesThisMonth}
              {hasArticleLimit ? ` / ${articlesLimit}` : ""}
            </span>
          </div>
          {hasArticleLimit && (
            <Progress value={articlesPercentage} className={isArticlesAtLimit ? "[&>div]:bg-destructive" : ""} />
          )}
        </div>

        {/* Next generation */}
        {nextGenerationDate && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Próxima generación</span>
            </div>
            <span className="text-muted-foreground">{nextGenerationDate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
