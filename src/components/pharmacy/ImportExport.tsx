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

// Poblaciones y provincias donde se habla catalán
const CATALAN_LOCATIONS = [
  // Provincias catalanas
  "barcelona", "tarragona", "lleida", "girona", "lérida", "gerona",
  // Ciudades principales
  "hospitalet", "badalona", "terrassa", "sabadell", "mataró", "santa coloma",
  "cornellà", "sant boi", "sant cugat", "rubí", "manresa", "vilanova",
  "viladecans", "granollers", "cerdanyola", "mollet", "castelldefels",
  "gavà", "esplugues", "sant feliu", "vic", "igualada", "reus", "figueres",
  // Baleares
  "mallorca", "palma", "menorca", "ibiza", "eivissa", "formentera", "illes balears", "baleares",
  // Valencia (opcional, valenciano)
  "valència", "valencia", "alicante", "alacant", "castellón", "castelló",
  // Andorra
  "andorra",
  // Términos generales
  "catalunya", "cataluña", "catalán", "català"
];

function shouldIncludeCatalan(location: string): boolean {
  const normalizedLocation = location.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CATALAN_LOCATIONS.some(catalanLoc => 
    normalizedLocation.includes(catalanLoc.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );
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
        
        let catalanAutoDetected = 0;
        
        const newFarmacias = dataLines.map((line) => {
          const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
          const name = parts[0];
          const location = parts[1];
          const languages = ["spanish"];
          
          // Check explicit catalan column first
          const explicitCatalan = parts[2]?.toLowerCase();
          if (explicitCatalan === "sí" || explicitCatalan === "si" || explicitCatalan === "yes") {
            languages.push("catalan");
          } else if (explicitCatalan !== "no" && shouldIncludeCatalan(location)) {
            // Auto-detect based on location if not explicitly set to "no"
            languages.push("catalan");
            catalanAutoDetected++;
          }
          
          return {
            name,
            location,
            languages,
          };
        }).filter((f) => f.name && f.location);

        onImportFarmacias(newFarmacias);
        
        let message = `${newFarmacias.length} farmacias importadas`;
        if (catalanAutoDetected > 0) {
          message += ` (${catalanAutoDetected} con catalán auto-detectado por ubicación)`;
        }
        toast.success(message);
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

        <div className="p-3 bg-muted rounded-lg space-y-1">
          <p className="text-xs text-muted-foreground">
            <strong>Formato CSV:</strong> nombre, localidad, catalan (sí/no)
          </p>
          <p className="text-xs text-muted-foreground">
            💡 El catalán se detecta automáticamente para farmacias de Catalunya, Baleares y Valencia
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
