import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { Empresa } from "@/hooks/useEmpresas";
import type { ArticuloEmpresa } from "@/hooks/useArticulosEmpresas";

interface CompanyImportExportProps {
  empresas: Empresa[];
  articulos: ArticuloEmpresa[];
  selectedMonth: number;
  selectedYear: number;
  onImportEmpresas: (empresas: {
    name: string;
    location: string;
    sector?: string | null;
    languages: string[];
    blog_url?: string | null;
    instagram_url?: string | null;
    auto_generate?: boolean;
    custom_topic?: string | null;
  }[]) => void;
}

// Poblaciones y provincias donde se habla catalán
const CATALAN_LOCATIONS = [
  "barcelona", "tarragona", "lleida", "girona", "lérida", "gerona",
  "hospitalet", "badalona", "terrassa", "sabadell", "mataró", "santa coloma",
  "cornellà", "sant boi", "sant cugat", "rubí", "manresa", "vilanova",
  "viladecans", "granollers", "cerdanyola", "mollet", "castelldefels",
  "gavà", "esplugues", "sant feliu", "vic", "igualada", "reus", "figueres",
  "mallorca", "palma", "menorca", "ibiza", "eivissa", "formentera", "illes balears", "baleares",
  "valència", "valencia", "alicante", "alacant", "castellón", "castelló",
  "andorra",
  "catalunya", "cataluña", "catalán", "català"
];

function shouldIncludeCatalan(location: string): boolean {
  const normalizedLocation = location.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CATALAN_LOCATIONS.some(catalanLoc => 
    normalizedLocation.includes(catalanLoc.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );
}

function escapeCSV(value: string | null | undefined): string {
  if (!value) return "";
  // If the value contains comma, newline, or quotes, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function CompanyImportExport({
  empresas,
  articulos,
  selectedMonth,
  selectedYear,
  onImportEmpresas,
}: CompanyImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportEmpresasCSV = () => {
    const headers = [
      "nombre",
      "localidad", 
      "sector",
      "catalan",
      "generacion_automatica",
      "tema_personalizado",
      "url_blog",
      "url_instagram"
    ];
    
    const rows = empresas.map((e) => [
      escapeCSV(e.name),
      escapeCSV(e.location),
      escapeCSV(e.sector),
      e.languages?.includes("catalan") ? "sí" : "no",
      e.auto_generate ? "sí" : "no",
      escapeCSV(e.custom_topic),
      escapeCSV(e.blog_url),
      escapeCSV(e.instagram_url),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "empresas.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Empresas exportadas a CSV");
  };

  const exportArticulosJSON = () => {
    const monthArticles = articulos.filter(
      (a) => a.month === selectedMonth && a.year === selectedYear
    );

    const exportData = monthArticles.map((a) => ({
      empresa: empresas.find((e) => e.id === a.empresa_id)?.name,
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
    a.download = `articulos-empresas-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Artículos de empresas exportados a JSON");
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
        
        const newEmpresas = dataLines.map((line) => {
          const parts = parseCSVLine(line);
          const name = parts[0]?.trim();
          const location = parts[1]?.trim();
          const sector = parts[2]?.trim() || null;
          const languages = ["spanish"];
          
          // Check explicit catalan column (index 3)
          const explicitCatalan = parts[3]?.toLowerCase().trim();
          if (explicitCatalan === "sí" || explicitCatalan === "si" || explicitCatalan === "yes") {
            languages.push("catalan");
          } else if (explicitCatalan !== "no" && shouldIncludeCatalan(location)) {
            languages.push("catalan");
            catalanAutoDetected++;
          }
          
          // Auto generate (index 4) - default to true
          const autoGenerateValue = parts[4]?.toLowerCase().trim();
          const auto_generate = autoGenerateValue === "no" ? false : true;
          
          // Custom topic (index 5) - required if not auto_generate
          const custom_topic = parts[5]?.trim() || null;
          
          // URLs (index 6, 7)
          const blog_url = parts[6]?.trim() || null;
          const instagram_url = parts[7]?.trim() || null;
          
          return {
            name,
            location,
            sector,
            languages,
            auto_generate,
            custom_topic,
            blog_url,
            instagram_url,
          };
        }).filter((e) => e.name && e.location);

        // Validate: if auto_generate is false, custom_topic is required
        const invalidEmpresas = newEmpresas.filter(e => !e.auto_generate && !e.custom_topic);
        if (invalidEmpresas.length > 0) {
          toast.error(`${invalidEmpresas.length} empresas sin generación automática requieren un tema personalizado`);
          return;
        }

        onImportEmpresas(newEmpresas);
        
        let message = `${newEmpresas.length} empresas importadas`;
        if (catalanAutoDetected > 0) {
          message += ` (${catalanAutoDetected} con catalán auto-detectado)`;
        }
        toast.success(message);
      } catch (error) {
        console.error("Error importing CSV:", error);
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
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Importar / Exportar Empresas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Empresas</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportEmpresasCSV}>
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
          <p className="text-sm font-medium">Artículos de Empresas</p>
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

        <div className="p-3 bg-muted rounded-lg space-y-2">
          <p className="text-xs font-medium">Formato CSV:</p>
          <p className="text-xs text-muted-foreground font-mono">
            nombre, localidad, sector, catalan, generacion_automatica, tema_personalizado, url_blog, url_instagram
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 mt-2">
            <li>• <strong>catalan:</strong> sí/no (auto-detectado si no se especifica)</li>
            <li>• <strong>generacion_automatica:</strong> sí/no (por defecto: sí)</li>
            <li>• <strong>tema_personalizado:</strong> obligatorio si generación es "no"</li>
            <li>• <strong>url_blog, url_instagram:</strong> opcionales</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
