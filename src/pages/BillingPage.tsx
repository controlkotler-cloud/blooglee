import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const roles = ["superadmin", "admin", "beta", "user"] as const;

const roleColors: Record<string, string> = {
  superadmin: "bg-red-500/10 text-red-600 border-red-200",
  admin: "bg-purple-500/10 text-purple-600 border-purple-200",
  beta: "bg-green-500/10 text-green-600 border-green-200",
  user: "bg-gray-500/10 text-gray-600 border-gray-200",
};

type CellValue = boolean | string;

interface PermissionRow {
  action: string;
  category: string;
  superadmin: CellValue;
  admin: CellValue;
  beta: CellValue;
  user: CellValue;
}

const permissions: PermissionRow[] = [
  // Acceso
  { category: "Acceso", action: "SaaS (/dashboard, /site/:id)", superadmin: true, admin: true, beta: true, user: true },
  { category: "Acceso", action: "Panel Admin (/admin/*)", superadmin: true, admin: false, beta: false, user: false },
  // Artículos
  {
    category: "Artículos",
    action: "Generar artículos",
    superadmin: "Ilimitado en su cuenta propia",
    admin: "Según plan de la cuenta owner",
    beta: "Según plan",
    user: "Según plan",
  },
  {
    category: "Artículos",
    action: "Regenerar tras publicación",
    superadmin: false,
    admin: false,
    beta: false,
    user: false,
  },
  {
    category: "Artículos",
    action: "Republicar artículo publicado",
    superadmin: false,
    admin: false,
    beta: false,
    user: false,
  },
  {
    category: "Artículos",
    action: "Eliminar artículo publicado",
    superadmin: false,
    admin: false,
    beta: false,
    user: false,
  },
  {
    category: "Artículos",
    action: "Copiar contenido de artículo",
    superadmin: true,
    admin: true,
    beta: false,
    user: false,
  },
  {
    category: "Artículos",
    action: "Regenerar imagen",
    superadmin: "Solo no publicados",
    admin: "Solo no publicados",
    beta: "Solo no publicados",
    user: "Solo no publicados",
  },
  // Límites
  {
    category: "Límites",
    action: "Límite de sitios",
    superadmin: "Ilimitado (solo cuenta propia)",
    admin: "Según plan de la cuenta owner",
    beta: "Según plan",
    user: "Según plan",
  },
  {
    category: "Límites",
    action: "Límite de artículos/mes",
    superadmin: "Ilimitado (solo cuenta propia)",
    admin: "Según plan de la cuenta owner",
    beta: "Según plan",
    user: "Según plan",
  },
  {
    category: "Límites",
    action: "Free: límite lifetime (1 art.)",
    superadmin: "No aplica en su cuenta",
    admin: "Se aplica si la cuenta está en Free",
    beta: "N/A",
    user: "Enforced",
  },
  // Equipo
  {
    category: "Equipo",
    action: "Añadir/eliminar members por email",
    superadmin: "Sí (solo en su cuenta)",
    admin: false,
    beta: false,
    user: "Sí, si es owner Agency",
  },
  {
    category: "Equipo",
    action: "Límite de members",
    superadmin: "Ilimitado en su cuenta propia",
    admin: "No aplica",
    beta: "No aplica",
    user: "Agency: 5 incluidos",
  },
  // Funcionalidades
  {
    category: "Funcionalidades",
    action: "Publicación automática WP",
    superadmin: true,
    admin: true,
    beta: "Si plan lo permite",
    user: "Si plan lo permite",
  },
  {
    category: "Funcionalidades",
    action: "Perfil de contenido avanzado",
    superadmin: true,
    admin: true,
    beta: "Starter+",
    user: "Starter+",
  },
  {
    category: "Funcionalidades",
    action: "Paleta editable en imagen",
    superadmin: true,
    admin: true,
    beta: "Starter+",
    user: "Starter+",
  },
  { category: "Funcionalidades", action: "Soporte Bloobot", superadmin: true, admin: true, beta: true, user: true },
  // Administración
  {
    category: "Administración",
    action: "Ver todos los profiles (BD)",
    superadmin: true,
    admin: false,
    beta: false,
    user: false,
  },
  {
    category: "Administración",
    action: "Gestionar roles (BD)",
    superadmin: true,
    admin: false,
    beta: false,
    user: false,
  },
  {
    category: "Administración",
    action: "Gestionar beta invitations",
    superadmin: true,
    admin: false,
    beta: false,
    user: false,
  },
  {
    category: "Administración",
    action: "Gestionar social content",
    superadmin: true,
    admin: false,
    beta: false,
    user: false,
  },
  { category: "Administración", action: "Gestionar prompts", superadmin: true, admin: false, beta: false, user: false },
];

function CellRenderer({ value }: { value: CellValue }) {
  if (value === true) return <Check className="h-4 w-4 text-green-500 mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-red-400 mx-auto" />;
  return <span className="text-xs text-center block">{value}</span>;
}

function MobilePermissionCard({ row }: { row: PermissionRow }) {
  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <p className="text-sm font-medium mb-2">{row.action}</p>
        <div className="grid grid-cols-4 gap-1 text-center">
          {roles.map((role) => (
            <div key={role} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground truncate w-full">{role}</span>
              <CellRenderer value={row[role]} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPermissions() {
  const isMobile = useIsMobile();
  let lastCategory = "";

  const roleDescriptions = [
    {
      role: "superadmin",
      desc: "Acceso al panel admin. En SaaS tiene ilimitado solo dentro de su propia cuenta (sin acceso SaaS a cuentas ajenas).",
    },
    {
      role: "admin",
      desc: "Rol operativo dentro de la cuenta owner a la que pertenece. Sin acceso a /admin ni bypass global.",
    },
    { role: "beta", desc: "Usuario con plan Starter temporal (3 meses, controlado por beta_expires_at)" },
    {
      role: "user",
      desc: "Acceso normal al SaaS según plan. Si es owner de cuenta Agency puede gestionar members de su equipo.",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Permisos por Rol</h1>
          <p className="text-sm text-muted-foreground mt-1">Matriz de acciones y permisos de cada perfil de usuario</p>
        </div>

        {/* Role descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {roleDescriptions.map(({ role, desc }) => (
            <Card key={role}>
              <CardContent className="p-3">
                <Badge variant="outline" className={`mb-1.5 ${roleColors[role]}`}>
                  {role}
                </Badge>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Matrix */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-0">
            <CardTitle className="text-base sm:text-lg">Matriz de Permisos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isMobile ? (
              <div>
                {permissions.map((row, i) => {
                  const showCategory = row.category !== lastCategory;
                  lastCategory = row.category;
                  return (
                    <div key={i}>
                      {showCategory && (
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2 first:mt-0">
                          {row.category}
                        </p>
                      )}
                      <MobilePermissionCard row={row} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Acción</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role} className="text-center">
                        <Badge variant="outline" className={`text-xs ${roleColors[role]}`}>
                          {role}
                        </Badge>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((row, i) => {
                    const showCategory = i === 0 || permissions[i - 1].category !== row.category;
                    return (
                      <>
                        {showCategory && (
                          <TableRow key={`cat-${row.category}`} className="bg-muted/30 hover:bg-muted/30">
                            <TableCell
                              colSpan={5}
                              className="py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                            >
                              {row.category}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow key={i}>
                          <TableCell className="text-sm">{row.action}</TableCell>
                          {roles.map((role) => (
                            <TableCell key={role} className="text-center">
                              <CellRenderer value={row[role]} />
                            </TableCell>
                          ))}
                        </TableRow>
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
