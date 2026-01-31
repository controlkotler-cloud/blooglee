import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminUsers, useBetaUsers } from '@/hooks/useAdminUsers';
import { useBetaInvitations } from '@/hooks/useBetaInvitations';
import { useSurveyResponses } from '@/hooks/useAdminSurveys';
import { Users, UserCheck, TicketPlus, ClipboardList, TrendingUp, Calendar } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const { data: users = [] } = useAdminUsers();
  const { data: betaUsers = [] } = useBetaUsers();
  const { data: invitations = [] } = useBetaInvitations();
  const { data: surveyResponses = [] } = useSurveyResponses();

  // Calculate stats
  const totalUsers = users.length;
  const activeBetaUsers = betaUsers.filter(u => 
    u.beta_expires_at && isAfter(new Date(u.beta_expires_at), new Date())
  ).length;
  const activeInvitations = invitations.filter(i => i.is_active).length;
  const totalBetaSlots = invitations.reduce((acc, i) => acc + i.max_uses, 0);
  const usedBetaSlots = invitations.reduce((acc, i) => acc + i.current_uses, 0);
  
  // Recent users (last 7 days)
  const recentUsers = users.filter(u => 
    isAfter(new Date(u.created_at), subDays(new Date(), 7))
  );

  // Users expiring soon (within 14 days)
  const expiringBetaUsers = betaUsers.filter(u => {
    if (!u.beta_expires_at) return false;
    const expiresAt = new Date(u.beta_expires_at);
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    return isAfter(expiresAt, new Date()) && !isAfter(expiresAt, fourteenDaysFromNow);
  });

  const stats = [
    {
      title: 'Total Usuarios',
      value: totalUsers,
      description: `${recentUsers.length} nuevos esta semana`,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Beta Activos',
      value: `${activeBetaUsers}/100`,
      description: `${expiringBetaUsers.length} próximos a expirar`,
      icon: UserCheck,
      color: 'text-green-500',
    },
    {
      title: 'Invitaciones',
      value: activeInvitations,
      description: `${usedBetaSlots}/${totalBetaSlots} plazas`,
      icon: TicketPlus,
      color: 'text-purple-500',
    },
    {
      title: 'Encuestas',
      value: surveyResponses.length,
      description: 'Respuestas totales',
      icon: ClipboardList,
      color: 'text-orange-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen general del sistema
          </p>
        </div>

        {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${stat.color}`} />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity - Stack on mobile */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                Usuarios Recientes
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay usuarios nuevos esta semana
                </p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.plan} | {user.roles.join(', ') || 'user'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(user.created_at), 'dd MMM', { locale: es })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Beta Próximos a Expirar
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">En los próximos 14 días</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {expiringBetaUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay usuarios beta próximos a expirar
                </p>
              ) : (
                <div className="space-y-3">
                  {expiringBetaUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Sitios: {user.sites_limit}
                        </p>
                      </div>
                      <span className="text-xs text-orange-500 font-medium shrink-0">
                        {format(new Date(user.beta_expires_at!), 'dd MMM', { locale: es })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
