import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Empresa } from "@/hooks/useEmpresas";
import {
  useWordPressSiteByEmpresa,
  useUpsertWordPressSiteForEmpresa,
  useDeleteWordPressSiteForEmpresa,
} from "@/hooks/useWordPressSitesEmpresas";
import { TaxonomyManager } from "@/components/shared/TaxonomyManager";
import { Loader2, Eye, EyeOff, Trash2, Cog, Link, Building2, MapPin, Globe, Calendar, Image } from "lucide-react";

interface CompanyFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    location?: string | null;
    sector?: string | null;
    languages: string[];
    blog_url?: string;
    instagram_url?: string;
    auto_generate?: boolean;
    custom_topic?: string | null;
    include_featured_image?: boolean;
    publish_frequency?: string;
    geographic_scope?: string;
  }) => void;
  initialData?: Empresa | null;
  isLoading?: boolean;
}

export function CompanyForm({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: CompanyFormProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [sector, setSector] = useState("");
  const [includeCatalan, setIncludeCatalan] = useState(false);
  const [blogUrl, setBlogUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [customTopic, setCustomTopic] = useState("");
  const [includeFeaturedImage, setIncludeFeaturedImage] = useState(true);
  const [publishFrequency, setPublishFrequency] = useState("monthly");
  const [geographicScope, setGeographicScope] = useState("local");

  // WordPress config
  const [wpSiteUrl, setWpSiteUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { data: wpSite, isLoading: wpLoading } = useWordPressSiteByEmpresa(initialData?.id);
  const upsertWpSite = useUpsertWordPressSiteForEmpresa();
  const deleteWpSite = useDeleteWordPressSiteForEmpresa();

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setLocation(initialData.location || "");
      setSector(initialData.sector || "");
      setIncludeCatalan(initialData.languages.includes("catalan"));
      setBlogUrl(initialData.blog_url || "");
      setInstagramUrl(initialData.instagram_url || "");
      setAutoGenerate(initialData.auto_generate);
      setCustomTopic(initialData.custom_topic || "");
      setIncludeFeaturedImage(initialData.include_featured_image ?? true);
      setPublishFrequency(initialData.publish_frequency || "monthly");
      setGeographicScope(initialData.geographic_scope || "local");
    } else {
      setName("");
      setLocation("");
      setSector("");
      setIncludeCatalan(false);
      setBlogUrl("");
      setInstagramUrl("");
      setAutoGenerate(true);
      setCustomTopic("");
      setIncludeFeaturedImage(true);
      setPublishFrequency("monthly");
      setGeographicScope("local");
    }
  }, [initialData]);

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
    if (includeCatalan) languages.push("catalan");

    onSubmit({
      name,
      location: geographicScope === "national" ? null : (location || null),
      sector: sector || null,
      languages,
      blog_url: blogUrl || undefined,
      instagram_url: instagramUrl || undefined,
      auto_generate: autoGenerate,
      custom_topic: autoGenerate ? null : (customTopic || null),
      include_featured_image: includeFeaturedImage,
      publish_frequency: publishFrequency,
      geographic_scope: geographicScope,
    });

    // Save WordPress config if editing and has values
    if (isEditing && initialData && wpSiteUrl && wpUsername && wpAppPassword) {
      const normalizedUrl = wpSiteUrl.replace(/\/wp-admin\/?$/, "").replace(/\/$/, "");
      await upsertWpSite.mutateAsync({
        empresa_id: initialData.id,
        site_url: normalizedUrl,
        wp_username: wpUsername,
        wp_app_password: wpAppPassword,
      });
    }
  };

  const handleDeleteWordPress = async () => {
    if (initialData) {
      await deleteWpSite.mutateAsync(initialData.id);
      setWpSiteUrl("");
      setWpUsername("");
      setWpAppPassword("");
    }
  };

  const getLocationLabel = () => {
    switch (geographicScope) {
      case "local":
        return "Localidad";
      case "regional":
        return "Región / Comunidad Autónoma";
      default:
        return "Localidad";
    }
  };

  const getLocationPlaceholder = () => {
    switch (geographicScope) {
      case "local":
        return "Barcelona, Madrid, Valencia...";
      case "regional":
        return "Cataluña, Andalucía, Comunidad Valenciana...";
      default:
        return "Barcelona";
    }
  };

  const frequencyOptions = [
    { value: "monthly", label: "Mensual", description: "1 artículo al mes" },
    { value: "biweekly", label: "Quincenal", description: "2 artículos al mes" },
    { value: "weekly", label: "Semanal", description: "4-5 artículos al mes" },
    { value: "daily", label: "Diario", description: "1 artículo por día laborable" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? "Editar Empresa" : "Nueva Empresa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la empresa</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Clínica Dental Sonríe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Sector (opcional)</Label>
            <Input
              id="sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Odontología, Veterinaria, etc."
            />
          </div>

          {/* Ámbito geográfico */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Ámbito Geográfico
            </div>

            <RadioGroup
              value={geographicScope}
              onValueChange={setGeographicScope}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="local" id="scope-local" />
                <Label htmlFor="scope-local" className="cursor-pointer font-normal">
                  <span className="font-medium">Local</span>
                  <span className="text-muted-foreground text-xs ml-1">(ciudad específica)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regional" id="scope-regional" />
                <Label htmlFor="scope-regional" className="cursor-pointer font-normal">
                  <span className="font-medium">Regional</span>
                  <span className="text-muted-foreground text-xs ml-1">(comunidad autónoma)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="national" id="scope-national" />
                <Label htmlFor="scope-national" className="cursor-pointer font-normal">
                  <span className="font-medium">Nacional</span>
                  <span className="text-muted-foreground text-xs ml-1">(toda España)</span>
                </Label>
              </div>
            </RadioGroup>

            {geographicScope !== "national" && (
              <div className="space-y-2">
                <Label htmlFor="location">{getLocationLabel()}</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={getLocationPlaceholder()}
                  required={geographicScope !== "national"}
                />
              </div>
            )}

            {geographicScope === "national" && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <Globe className="h-3 w-3 inline mr-1" />
                El contenido se optimizará para SEO nacional sin referencias geográficas específicas.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="catalan"
              checked={includeCatalan}
              onCheckedChange={(c) => setIncludeCatalan(c === true)}
            />
            <Label htmlFor="catalan" className="cursor-pointer">
              Generar también en catalán
            </Label>
          </div>

          {/* Generación automática */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Cog className="h-4 w-4" />
              Generación de Artículos
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoGenerate"
                checked={autoGenerate}
                onCheckedChange={(c) => setAutoGenerate(c === true)}
              />
              <Label htmlFor="autoGenerate" className="cursor-pointer">
                Generación automática
              </Label>
            </div>

            {autoGenerate ? (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                La IA generará automáticamente un tema SEO basado en el nombre de la empresa, sector y época del año.
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="customTopic">Tema del artículo *</Label>
                <Textarea
                  id="customTopic"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Ej: Blanqueamiento dental: guía completa para una sonrisa perfecta"
                  rows={2}
                  required={!autoGenerate}
                />
                <p className="text-xs text-muted-foreground">
                  Este tema se usará cuando generes el artículo manualmente
                </p>
              </div>
            )}

            {/* Frecuencia de publicación */}
            <div className="space-y-2">
              <Label htmlFor="frequency" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Frecuencia de publicación
              </Label>
              <Select value={publishFrequency} onValueChange={setPublishFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Imagen destacada opcional */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeFeaturedImage"
                checked={includeFeaturedImage}
                onCheckedChange={(c) => setIncludeFeaturedImage(c === true)}
              />
              <Label htmlFor="includeFeaturedImage" className="cursor-pointer flex items-center gap-1">
                <Image className="h-3 w-3" />
                Incluir imagen destacada
              </Label>
            </div>
            {!includeFeaturedImage && (
              <p className="text-xs text-muted-foreground bg-amber-50 text-amber-700 p-2 rounded">
                Los artículos se generarán sin imagen. Útil para blogs que no usan imágenes destacadas.
              </p>
            )}
          </div>

          {/* SEO Links */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link className="h-4 w-4" />
              Enlaces SEO
            </div>

            <div className="space-y-2">
              <Label htmlFor="blogUrl">URL del Blog</Label>
              <Input
                id="blogUrl"
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
                placeholder="https://clinicasonrie.com/blog"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Enlace a tu mejor red social</Label>
              <Input
                id="instagramUrl"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/tuempresa o tu red social preferida"
                type="url"
              />
            </div>
          </div>

          {/* WordPress Config - only for editing */}
          {isEditing && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Cog className="h-4 w-4" />
                  Configuración WordPress
                </div>
                {wpSite && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteWordPress}
                    disabled={deleteWpSite.isPending}
                  >
                    {deleteWpSite.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                )}
              </div>

              {wpLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="wpSiteUrl">URL del sitio WordPress</Label>
                    <Input
                      id="wpSiteUrl"
                      value={wpSiteUrl}
                      onChange={(e) => setWpSiteUrl(e.target.value)}
                      placeholder="https://clinicasonrie.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wpUsername">Usuario WordPress</Label>
                    <Input
                      id="wpUsername"
                      value={wpUsername}
                      onChange={(e) => setWpUsername(e.target.value)}
                      placeholder="admin"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wpAppPassword">Contraseña de aplicación</Label>
                    <div className="relative">
                      <Input
                        id="wpAppPassword"
                        type={showPassword ? "text" : "password"}
                        value={wpAppPassword}
                        onChange={(e) => setWpAppPassword(e.target.value)}
                        placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Taxonomy Manager */}
                  {wpSite && (
                    <TaxonomyManager wordpressSiteId={wpSite.id} />
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || (!autoGenerate && !customTopic.trim())}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
