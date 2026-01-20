import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Farmacia } from "@/hooks/useFarmacias";
import type { Articulo } from "@/hooks/useArticulos";

interface ImportExportProps {
  farmacias: Farmacia[];
  articulos: Articulo[];
  selectedMonth: number;
  selectedYear: number;
  onImportFarmacias: (farmacias: Omit<Farmacia, "id" | "created_at" | "updated_at">[]) => void;
}

export function ImportExport({
  farmacias,
  articulos,
  selectedMonth,
  selectedYear,
  onImportFarmacias,
}: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportFarmaciasCSV = () => {
    const headers = ["nombre", "localidad", "catalan"];
    const rows = farmacias.map((f) => [
      f.name,
      f.location,
      f.languages?.includes("catalan") ? "sí" : "no",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "farmacias.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Farmacias exportadas a CSV");
  };

  const exportArticulosJSON = () => {
    const monthArticles = articulos.filter(
      (a) => a.month === selectedMonth && a.year === selectedYear
    );

    const exportData = monthArticles.map((a) => ({
      farmacia: farmacias.find((f) => f.id === a.farmacia_id)?.name,
      tema: a.topic,
      spanish: a.content_spanish,
      catalan: a.content_catalan,
      imagen: a.image_url,
      generado: a.generated_at,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `articulos-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Artículos exportados a JSON");
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        
        // Skip header
        const dataLines = lines.slice(1);
        
        const newFarmacias = dataLines.map((line) => {
          const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
          const languages = ["spanish"];
          if (parts[2]?.toLowerCase() === "sí" || parts[2]?.toLowerCase() === "si") {
            languages.push("catalan");
          }
          return {
            name: parts[0],
            location: parts[1],
            languages,
          };
        }).filter((f) => f.name && f.location);

        onImportFarmacias(newFarmacias);
        toast.success(`${newFarmacias.length} farmacias importadas`);
      } catch (error) {
        toast.error("Error al importar CSV");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Importar / Exportar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Farmacias</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportFarmaciasCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Artículos</p>
          <Button
            variant="outline"
            size="sm"
            onClick={exportArticulosJSON}
            disabled={articulos.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar JSON ({selectedMonth}/{selectedYear})
          </Button>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Formato CSV:</strong> nombre, localidad, catalan (sí/no)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
