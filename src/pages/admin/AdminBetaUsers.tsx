import { AdminLayout } from '@/components/admin/AdminLayout';
import { MobileTableCard } from '@/components/admin/MobileTableCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBetaUsers } from '@/hooks/useAdminUsers';
import { useSurveyResponses } from '@/hooks/useAdminSurveys';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserCheck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminBetaUsers() {
  const { data: betaUsers = [], isLoading } = useBetaUsers();
  const { data: surveyResponses = [] } = useSurveyResponses();
  const isMobile = useIsMobile();

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
    if (!expiresAt) return { label: 'Sin fecha', variant: 'outline' as const };
    
    const days = getDaysRemaining(expiresAt);
    if (days === null) return { label: 'Sin fecha', variant: 'outline' as const };
    
    if (days < 0) {
      return { label: 'Expirado', variant: 'destructive' as const };
    } else if (days <= 7) {
      return { label: 'Expira pronto', variant: 'destructive' as const };
    } else if (days <= 14) {
      return { label: 'Próximo', variant: 'default' as const, className: 'bg-orange-500' };
    } else {
      return { label: 'Activo', variant: 'secondary' as const };
    }
  };

  const expiringCount = activeBetaUsers.filter(u => {
    const days = getDaysRemaining(u.beta_expires_at);
    return days !== null && days <= 14 && days >= 0;
  }).length;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Usuarios Beta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona el programa beta
          </p>
        </div>

        {/* Stats - 3 cols on desktop, stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Beta Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{activeBetaUsers.length}/100</div>
              <Progress value={betaProgress} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {100 - activeBetaUsers.length} plazas disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Próximos a Expirar</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{expiringCount}</div>
              <p className="text-xs text-muted-foreground mt-2">
                En los próximos 14 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Expirados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{expiredBetaUsers.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Pendientes de conversión
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Beta Users List */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Lista de Usuarios Beta</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {betaUsers.length} usuarios en el programa
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : betaUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay usuarios beta registrados
              </div>
            ) : isMobile ? (
              /* Mobile: Card view */
              <div className="space-y-3">
                {betaUsers.map((user) => {
                  const daysRemaining = getDaysRemaining(user.beta_expires_at);
                  const surveysCompleted = getUserSurveyStatus(user.user_id);
                  const status = getStatusBadge(user.beta_expires_at);
                  
                  return (
                    <MobileTableCard
                      key={user.id}
                      title={user.email}
                      badges={[
                        { label: status.label, variant: status.variant, className: status.className },
                        { 
                          label: `${surveysCompleted}/2 encuestas`, 
                          variant: surveysCompleted > 0 ? 'secondary' : 'outline'
                        },
                      ]}
                      details={[
                        { 
                          label: 'Inicio', 
                          value: user.beta_started_at 
                            ? format(new Date(user.beta_started_at), 'dd/MM/yy', { locale: es })
                            : '-'
                        },
                        { 
                          label: 'Expira', 
                          value: user.beta_expires_at 
                            ? format(new Date(user.beta_expires_at), 'dd/MM/yy', { locale: es })
                            : '-'
                        },
                        { 
                          label: 'Días', 
                          value: daysRemaining !== null 
                            ? (daysRemaining < 0 ? `${Math.abs(daysRemaining)}d exp.` : `${daysRemaining}d`)
                            : '-'
                        },
                      ]}
                    />
                  );
                })}
              </div>
            ) : (
              /* Desktop: Table view */
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
                    const status = getStatusBadge(user.beta_expires_at);
                    
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
                          <Badge variant={status.variant} className={status.className}>
                            {status.label}
                          </Badge>
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
