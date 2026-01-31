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
      title: 'Usuarios Beta Activos',
      value: `${activeBetaUsers}/100`,
      description: `${expiringBetaUsers.length} próximos a expirar`,
      icon: UserCheck,
      color: 'text-green-500',
    },
    {
      title: 'Invitaciones Beta',
      value: activeInvitations,
      description: `${usedBetaSlots}/${totalBetaSlots} plazas usadas`,
      icon: TicketPlus,
      color: 'text-purple-500',
    },
    {
      title: 'Respuestas Encuestas',
      value: surveyResponses.length,
      description: 'Total de respuestas recibidas',
      icon: ClipboardList,
      color: 'text-orange-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Resumen general del sistema
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Usuarios Recientes
              </CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay usuarios nuevos esta semana
                </p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Plan: {user.plan} | {user.roles.join(', ') || 'user'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(user.created_at), 'dd MMM', { locale: es })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Beta Próximos a Expirar
              </CardTitle>
              <CardDescription>En los próximos 14 días</CardDescription>
            </CardHeader>
            <CardContent>
              {expiringBetaUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay usuarios beta próximos a expirar
                </p>
              ) : (
                <div className="space-y-3">
                  {expiringBetaUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Sitios: {user.sites_limit}
                        </p>
                      </div>
                      <span className="text-xs text-orange-500 font-medium">
                        Expira: {format(new Date(user.beta_expires_at!), 'dd MMM', { locale: es })}
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
