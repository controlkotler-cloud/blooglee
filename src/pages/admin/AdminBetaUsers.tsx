import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBetaUsers } from '@/hooks/useAdminUsers';
import { useSurveyResponses } from '@/hooks/useAdminSurveys';
import { UserCheck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminBetaUsers() {
  const { data: betaUsers = [], isLoading } = useBetaUsers();
  const { data: surveyResponses = [] } = useSurveyResponses();

  // Calculate stats
  const activeBetaUsers = betaUsers.filter(u => 
    u.beta_expires_at && isAfter(new Date(u.beta_expires_at), new Date())
  );
  const expiredBetaUsers = betaUsers.filter(u => 
    u.beta_expires_at && !isAfter(new Date(u.beta_expires_at), new Date())
  );

  const betaProgress = (activeBetaUsers.length / 100) * 100;

  const getUserSurveyStatus = (userId: string) => {
    const userResponses = surveyResponses.filter(r => r.user_id === userId);
    return userResponses.length;
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = differenceInDays(new Date(expiresAt), new Date());
    return days;
  };

  const getStatusBadge = (expiresAt: string | null) => {
    if (!expiresAt) return <Badge variant="outline">Sin fecha</Badge>;
    
    const days = getDaysRemaining(expiresAt);
    if (days === null) return null;
    
    if (days < 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    } else if (days <= 7) {
      return <Badge variant="destructive">Expira pronto</Badge>;
    } else if (days <= 14) {
      return <Badge className="bg-orange-500">Próximo a expirar</Badge>;
    } else {
      return <Badge variant="secondary">Activo</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Usuarios Beta</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el programa beta y sus participantes
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Beta Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBetaUsers.length}/100</div>
              <Progress value={betaProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {100 - activeBetaUsers.length} plazas disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos a Expirar</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeBetaUsers.filter(u => {
                  const days = getDaysRemaining(u.beta_expires_at);
                  return days !== null && days <= 14 && days >= 0;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                En los próximos 14 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expirados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredBetaUsers.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Pendientes de conversión
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Beta Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios Beta</CardTitle>
            <CardDescription>
              {betaUsers.length} usuarios en el programa beta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : betaUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay usuarios beta registrados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Inicio Beta</TableHead>
                    <TableHead>Expiración</TableHead>
                    <TableHead>Días Restantes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Encuestas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {betaUsers.map((user) => {
                    const daysRemaining = getDaysRemaining(user.beta_expires_at);
                    const surveysCompleted = getUserSurveyStatus(user.user_id);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.beta_started_at 
                            ? format(new Date(user.beta_started_at), 'dd/MM/yyyy', { locale: es })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.beta_expires_at 
                            ? format(new Date(user.beta_expires_at), 'dd/MM/yyyy', { locale: es })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {daysRemaining !== null ? (
                            <span className={daysRemaining < 0 ? 'text-red-500' : daysRemaining <= 7 ? 'text-orange-500' : ''}>
                              {daysRemaining < 0 ? `Expirado hace ${Math.abs(daysRemaining)} días` : `${daysRemaining} días`}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.beta_expires_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {surveysCompleted > 0 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">{surveysCompleted}/2</span>
                          </div>
                        </TableCell>
                      </TableRow>
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
