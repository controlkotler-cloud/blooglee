import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Globe, Eye, EyeOff, Trash2 } from "lucide-react";
import type { Farmacia } from "@/hooks/useFarmacias";
import { useWordPressSite, useUpsertWordPressSite, useDeleteWordPressSite } from "@/hooks/useWordPressSites";

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
  
  // WordPress fields
  const [wpSiteUrl, setWpSiteUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // WordPress data
  const { data: wpSite, isLoading: isLoadingWp } = useWordPressSite(initialData?.id);
  const upsertWpSite = useUpsertWordPressSite();
  const deleteWpSite = useDeleteWordPressSite();

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

  // Load WordPress data when available
  useEffect(() => {
    if (wpSite) {
      setWpSiteUrl(wpSite.site_url);
      setWpUsername(wpSite.wp_username);
      setWpAppPassword(wpSite.wp_app_password);
    } else {
      setWpSiteUrl("");
      setWpUsername("");
      setWpAppPassword("");
    }
  }, [wpSite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const languages = ["spanish"];
    if (includesCatalan) languages.push("catalan");
    
    // Save pharmacy first
    onSubmit({ name, location, languages });
    
    // If editing and has WordPress config, save it
    if (initialData && wpSiteUrl && wpUsername && wpAppPassword) {
      // Normalizar URL: quitar /wp-admin y barra final
      const normalizedUrl = wpSiteUrl
        .replace(/\/wp-admin\/?$/, '')
        .replace(/\/$/, '');
      
      await upsertWpSite.mutateAsync({
        farmacia_id: initialData.id,
        site_url: normalizedUrl,
        wp_username: wpUsername,
        wp_app_password: wpAppPassword,
      });
    }
  };

  const handleDeleteWordPress = async () => {
    if (initialData && wpSite) {
      await deleteWpSite.mutateAsync(initialData.id);
      setWpSiteUrl("");
      setWpUsername("");
      setWpAppPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* WordPress Configuration - only show when editing */}
          {initialData && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <Label className="font-medium">Configuración WordPress</Label>
                  </div>
                  {wpSite && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteWordPress}
                      disabled={deleteWpSite.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wp-url">URL del sitio WordPress</Label>
                  <Input
                    id="wp-url"
                    value={wpSiteUrl}
                    onChange={(e) => setWpSiteUrl(e.target.value)}
                    placeholder="https://tudominio.com (sin /wp-admin)"
                    disabled={isLoadingWp}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wp-username">Usuario WordPress</Label>
                  <Input
                    id="wp-username"
                    value={wpUsername}
                    onChange={(e) => setWpUsername(e.target.value)}
                    placeholder="admin"
                    disabled={isLoadingWp}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wp-password">App Password</Label>
                  <div className="relative">
                    <Input
                      id="wp-password"
                      type={showPassword ? "text" : "password"}
                      value={wpAppPassword}
                      onChange={(e) => setWpAppPassword(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                      disabled={isLoadingWp}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Genera una contraseña de aplicación en WordPress: Usuarios → Perfil → Contraseñas de aplicación
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || upsertWpSite.isPending}>
              {isLoading || upsertWpSite.isPending ? "Guardando..." : initialData ? "Guardar cambios" : "Añadir farmacia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
