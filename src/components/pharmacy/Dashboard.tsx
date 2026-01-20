import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, FileText, Clock, Globe } from "lucide-react";
import { SEASONAL_TOPICS, MONTH_NAMES } from "@/lib/seasonalTopics";
import type { Farmacia } from "@/hooks/useFarmacias";
import type { Articulo } from "@/hooks/useArticulos";

interface DashboardProps {
  farmacias: Farmacia[];
  articulos: Articulo[];
  selectedMonth: number;
  selectedYear: number;
}

export function Dashboard({ farmacias, articulos, selectedMonth, selectedYear }: DashboardProps) {
  const generatedCount = articulos.length;
  const pendingCount = farmacias.length - generatedCount;
  const catalanCount = farmacias.filter((f) => f.languages?.includes("catalan")).length;
  const monthTopics = SEASONAL_TOPICS[selectedMonth] || [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{farmacias.length}</p>
                <p className="text-sm text-muted-foreground">Farmacias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{generatedCount}</p>
                <p className="text-sm text-muted-foreground">Generados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{catalanCount}</p>
                <p className="text-sm text-muted-foreground">Con catalán</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Temas de {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {monthTopics.map((topic, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <Badge variant="outline" className="mt-0.5">
                  {index + 1}
                </Badge>
                <div>
                  <p className="font-medium">{topic.tema}</p>
                  <p className="text-sm text-muted-foreground">
                    {topic.keywords.join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
