import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Farmacia } from "@/hooks/useFarmacias";

interface PharmacyFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; location: string; languages: string[] }) => void;
  initialData?: Farmacia | null;
  isLoading?: boolean;
}

export function PharmacyForm({ open, onClose, onSubmit, initialData, isLoading }: PharmacyFormProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [includesCatalan, setIncludesCatalan] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setLocation(initialData.location);
      setIncludesCatalan(initialData.languages?.includes("catalan") || false);
    } else {
      setName("");
      setLocation("");
      setIncludesCatalan(false);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const languages = ["spanish"];
    if (includesCatalan) languages.push("catalan");
    onSubmit({ name, location, languages });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Farmacia" : "Añadir Farmacia"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la farmacia</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Farmacia Central"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Localidad</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Barcelona"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="catalan"
              checked={includesCatalan}
              onCheckedChange={(checked) => setIncludesCatalan(checked === true)}
            />
            <Label htmlFor="catalan" className="cursor-pointer">
              Generar también en catalán
            </Label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : initialData ? "Guardar cambios" : "Añadir farmacia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
