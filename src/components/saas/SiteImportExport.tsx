import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Upload, Globe } from "lucide-react";
import { toast } from "sonner";
import type { Site, SiteInput } from "@/hooks/useSites";
import type { Article } from "@/hooks/useArticlesSaas";

interface SiteImportExportProps {
  sites: Site[];
  articles: Article[];
  sitesLimit: number;
  onImportSites: (sites: SiteInput[]) => void;
}

// Locations where Catalan is spoken
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

function shouldIncludeCatalan(location: string): boolean {
  const normalizedLocation = location.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CATALAN_LOCATIONS.some(catalanLoc => 
    normalizedLocation.includes(catalanLoc.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );
}

function escapeCSV(value: string | null | undefined): string {
  if (!value) return "";
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

export function SiteImportExport({
  sites,
  articles,
  sitesLimit,
  onImportSites,
}: SiteImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));

  const years = Array.from({ length: 3 }, (_, i) => {
    const year = currentDate.getFullYear() - i;
    return { value: String(year), label: String(year) };
  });

  const exportSitesCSV = () => {
    const headers = [
      "nombre",
      "localidad", 
      "sector",
      "descripcion",
      "catalan",
      "generacion_automatica",
      "tema_personalizado",
      "url_blog",
      "url_instagram"
    ];
    
    const rows = sites.map((s) => [
      escapeCSV(s.name),
      escapeCSV(s.location),
      escapeCSV(s.sector),
      escapeCSV(s.description),
      s.languages?.includes("catalan") ? "sí" : "no",
      s.auto_generate ? "sí" : "no",
      escapeCSV(s.custom_topic),
      escapeCSV(s.blog_url),
      escapeCSV(s.instagram_url),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitios.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sitios exportados a CSV");
  };

  const exportArticlesJSON = () => {
    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    const monthArticles = articles.filter(
      (a) => a.month === month && a.year === year
    );

    const exportData = monthArticles.map((a) => ({
      sitio: sites.find((s) => s.id === a.site_id)?.name,
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
    a.download = `articulos-${year}-${String(month).padStart(2, "0")}.json`;
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
        
        // Check sites limit
        const newSitesCount = dataLines.length;
        const currentSitesCount = sites.length;
        if (currentSitesCount + newSitesCount > sitesLimit) {
          toast.error(`No puedes importar ${newSitesCount} sitios. Límite: ${sitesLimit}, actuales: ${currentSitesCount}`);
          return;
        }
        
        let catalanAutoDetected = 0;
        
        const newSites: SiteInput[] = dataLines.map((line) => {
          const parts = parseCSVLine(line);
          const name = parts[0]?.trim();
          const location = parts[1]?.trim() || null;
          const sector = parts[2]?.trim() || null;
          const description = parts[3]?.trim() || null;
          const languages: string[] = ["spanish"];
          
          // Check explicit catalan column (index 4)
          const explicitCatalan = parts[4]?.toLowerCase().trim();
          if (explicitCatalan === "sí" || explicitCatalan === "si" || explicitCatalan === "yes") {
            languages.push("catalan");
          } else if (explicitCatalan !== "no" && location && shouldIncludeCatalan(location)) {
            languages.push("catalan");
            catalanAutoDetected++;
          }
          
          // Auto generate (index 5) - default to true
          const autoGenerateValue = parts[5]?.toLowerCase().trim();
          const auto_generate = autoGenerateValue === "no" ? false : true;
          
          // Custom topic (index 6) - required if not auto_generate
          const custom_topic = parts[6]?.trim() || null;
          
          // URLs (index 7, 8)
          const blog_url = parts[7]?.trim() || null;
          const instagram_url = parts[8]?.trim() || null;
          
          return {
            name,
            location,
            sector,
            description,
            languages,
            auto_generate,
            custom_topic,
            blog_url,
            instagram_url,
          } as SiteInput;
        }).filter((s) => !!s.name);

        // Validate: if auto_generate is false, custom_topic is required
        const invalidSites = newSites.filter(s => !s.auto_generate && !s.custom_topic);
        if (invalidSites.length > 0) {
          toast.error(`${invalidSites.length} sitios sin generación automática requieren un tema personalizado`);
          return;
        }

        if (newSites.length === 0) {
          toast.error("No se encontraron sitios válidos en el archivo");
          return;
        }

        onImportSites(newSites);
        
        let message = `${newSites.length} sitios importados`;
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

  const filteredArticlesCount = articles.filter(
    (a) => a.month === parseInt(selectedMonth) && a.year === parseInt(selectedYear)
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Importar / Exportar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Sitios</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportSitesCSV} disabled={sites.length === 0}>
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
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[120px]">
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
              <SelectTrigger className="w-[90px]">
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

            <Button
              variant="outline"
              size="sm"
              onClick={exportArticlesJSON}
              disabled={filteredArticlesCount === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar JSON ({filteredArticlesCount})
            </Button>
          </div>
        </div>

        <div className="p-3 bg-muted rounded-lg space-y-2">
          <p className="text-xs font-medium">Formato CSV:</p>
          <p className="text-xs text-muted-foreground font-mono">
            nombre, localidad, sector, descripcion, catalan, generacion_automatica, tema_personalizado, url_blog, url_instagram
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
