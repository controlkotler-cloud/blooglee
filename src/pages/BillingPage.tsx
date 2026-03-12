import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2, Mail, ShieldAlert, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BloogleeLogo } from "@/components/saas/BloogleeLogo";
import { PlanBadge, type PlanType } from "@/components/saas/PlanBadge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useIsSuperAdmin } from "@/hooks/useProfile";
import { useSites } from "@/hooks/useSites";
import { useAllArticlesSaas } from "@/hooks/useArticlesSaas";
import { supabase } from "@/integrations/supabase/client";

const AGENCY_TEAM_LIMIT = 5;
const SUPPORT_EMAIL = "hola@blooglee.com";

interface TeamMember {
  member_id: string;
  email: string;
  role: string;
  created_at: string;
}

function getTeamErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("team_requires_agency_plan")) {
      return "La gestión de equipo requiere plan Agency.";
    }
    if (message.includes("team_limit_reached")) {
      return "Has alcanzado el límite de members del plan Agency (5).";
    }
    if (message.includes("member_not_found")) {
      return "No existe ninguna cuenta con ese email.";
    }
    if (message.includes("member_already_assigned")) {
      return "Este usuario ya pertenece a un equipo.";
    }
    if (message.includes("cannot_add_self")) {
      return "No puedes añadirte a ti mismo como member.";
    }
    if (message.includes("duplicate key")) {
      return "Este usuario ya está en tu equipo.";
    }
    return error.message;
  }

  return "No se pudo completar la acción.";
}

export default function BillingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: sites = [], isLoading: loadingSites } = useSites();
  const { isSuperAdmin, isLoading: loadingSuperAdmin } = useIsSuperAdmin();
  const { data: teamMembers = [], isLoading: loadingTeam } = useQuery({
    queryKey: ["team-members", user?.id],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase.rpc("get_team_members_for_owner");
      if (error) {
        if (error.message.toLowerCase().includes("get_team_members_for_owner")) {
          return [];
        }
        throw error;
      }

      return (data ?? []) as TeamMember[];
    },
    enabled: !!user?.id,
  });

  const addTeamMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role?: string }) => {
      if (!user?.id) throw new Error("No user logged in");

      const { error } = await supabase.rpc("add_team_member_by_email", {
        member_email: email.trim().toLowerCase(),
        member_role: role ?? "editor",
      });

      if (error) {
        if (error.message.toLowerCase().includes("add_team_member_by_email")) {
          throw new Error("Función de equipo no disponible. Aplica primero la migración más reciente.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Member añadido correctamente");
    },
    onError: (error) => {
      toast.error(getTeamErrorMessage(error));
    },
  });

  const updateTeamRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      if (!user?.id) throw new Error("No user logged in");

      const { error } = await supabase
        .from("team_members")
        .update({ role })
        .eq("owner_id", user.id)
        .eq("member_id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Rol actualizado");
    },
    onError: (error) => {
      toast.error(getTeamErrorMessage(error));
    },
  });

  const removeTeamMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!user?.id) throw new Error("No user logged in");

      const { error } = await supabase.from("team_members").delete().eq("owner_id", user.id).eq("member_id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Member eliminado");
    },
    onError: (error) => {
      toast.error(getTeamErrorMessage(error));
    },
  });

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("editor");

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: monthArticles = [], isLoading: loadingArticles } = useAllArticlesSaas(currentMonth, currentYear);

  const isLoading = loadingProfile || loadingSites || loadingArticles || loadingSuperAdmin || loadingTeam;

  const plan = (profile?.plan || "free") as PlanType;
  const sitesLimit = profile?.sites_limit ?? 1;
  const postsLimit = profile?.posts_limit ?? 1;
  const teamLimit = isSuperAdmin ? Number.POSITIVE_INFINITY : AGENCY_TEAM_LIMIT;
  const teamLimitLabel = Number.isFinite(teamLimit) ? String(teamLimit) : "Ilimitado";
  const canManageTeam = isSuperAdmin || plan === "agency";
  const teamAtLimit = Number.isFinite(teamLimit) && teamMembers.length >= teamLimit;
  const articlesThisMonth = monthArticles.length;

  const billingMailto = useMemo(() => {
    const subject = encodeURIComponent("Cambio de plan en Blooglee");
    const body = encodeURIComponent(
      [
        "Hola equipo Blooglee,",
        "",
        "Quiero solicitar un cambio de plan.",
        `Plan actual: ${plan}`,
        "",
        "Datos adicionales:",
        "-",
      ].join("\n"),
    );

    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }, [plan]);

  const handleAddTeamMember = () => {
    if (!memberEmail.trim()) return;

    addTeamMember.mutate(
      {
        email: memberEmail,
        role: memberRole,
      },
      {
        onSuccess: () => {
          setMemberEmail("");
          setMemberRole("editor");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <BloogleeLogo size="md" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold font-display">Facturación y plan</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión de plan, límites y members de equipo</p>
        </div>

        <Alert className="border-amber-300 bg-amber-50">
          <ShieldAlert className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-amber-900">Facturación manual temporal</AlertTitle>
          <AlertDescription className="text-amber-800">
            Stripe todavía no está activo. Los cambios de plan y dudas de facturación se gestionan manualmente por
            email.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Tu plan actual
            </CardTitle>
            <CardDescription>Resumen de límites y consumo del mes en curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <PlanBadge plan={plan} size="lg" />
              {profile?.is_beta && (
                <Badge variant="secondary">
                  Beta
                  {profile?.beta_expires_at
                    ? ` · expira ${new Date(profile.beta_expires_at).toLocaleDateString()}`
                    : ""}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Sitios</p>
                <p className="text-lg font-semibold">
                  {sites.length} / {sitesLimit}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Artículos este mes</p>
                <p className="text-lg font-semibold">
                  {articlesThisMonth} / {plan === "agency" || isSuperAdmin ? "∞" : postsLimit}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Members de equipo</p>
                <p className="text-lg font-semibold">
                  {teamMembers.length} / {teamLimitLabel}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild>
                <a href={billingMailto}>
                  <Mail className="w-4 h-4 mr-2" />
                  Solicitar cambio de plan
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/pricing">Ver detalle de planes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Equipo
            </CardTitle>
            <CardDescription>
              {canManageTeam
                ? "Gestiona members por email. El usuario debe tener una cuenta activa."
                : "La gestión de members está disponible en Agency."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canManageTeam ? (
              <>
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  Cupo actual: {teamMembers.length} / {teamLimitLabel}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="member-email">Email del member</Label>
                    <Input
                      id="member-email"
                      type="email"
                      placeholder="member@empresa.com"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      disabled={addTeamMember.isPending || teamAtLimit}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Rol</Label>
                    <Select
                      value={memberRole}
                      onValueChange={setMemberRole}
                      disabled={addTeamMember.isPending || teamAtLimit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full"
                      onClick={handleAddTeamMember}
                      disabled={addTeamMember.isPending || teamAtLimit || !memberEmail.trim()}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Añadir
                    </Button>
                  </div>
                </div>

                {teamAtLimit && (
                  <p className="text-sm text-amber-700">
                    Has alcanzado el límite de members incluidos. Si necesitas ampliar cupo, escríbenos a{" "}
                    {SUPPORT_EMAIL}.
                  </p>
                )}

                <div className="space-y-2">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Todavía no tienes members añadidos.</p>
                  ) : (
                    teamMembers.map((member) => (
                      <div
                        key={member.member_id}
                        className="rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Añadido el {new Date(member.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Select
                          value={member.role}
                          onValueChange={(role) =>
                            updateTeamRole.mutate({
                              memberId: member.member_id,
                              role,
                            })
                          }
                        >
                          <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTeamMember.mutate(member.member_id)}
                          disabled={removeTeamMember.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Quitar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-4">
                <p className="text-sm text-muted-foreground">
                  Tu plan actual no incluye gestión de equipo por email. Pásate a Agency para invitar members y operar
                  en equipo.
                </p>
                <Button asChild variant="outline" className="mt-3">
                  <a href={billingMailto}>Solicitar upgrade a Agency</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
