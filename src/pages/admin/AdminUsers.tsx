import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminUsers, useUpdateUserPlan, useUpdateUserRole } from '@/hooks/useAdminUsers';
import { Search, Edit, Globe, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const PLANS = {
  free: { label: 'Free', sites: 1, posts: 1 },
  starter: { label: 'Starter', sites: 1, posts: 4 },
  pro: { label: 'Pro', sites: 3, posts: 30 },
  agency: { label: 'Agency', sites: 10, posts: 100 },
};

export default function AdminUsers() {
  const { data: users = [], isLoading } = useAdminUsers();
  const updatePlan = useUpdateUserPlan();
  const updateRole = useUpdateUserRole();

  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    const matchesRole = filterRole === 'all' || user.roles.includes(filterRole);
    return matchesSearch && matchesPlan && matchesRole;
  });

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setSelectedPlan(user.plan);
  };

  const handleSavePlan = async () => {
    if (!editingUser || !selectedPlan) return;

    const planConfig = PLANS[selectedPlan as keyof typeof PLANS];
    
    try {
      await updatePlan.mutateAsync({
        userId: editingUser.user_id,
        plan: selectedPlan,
        sitesLimit: planConfig.sites,
        postsLimit: planConfig.posts,
      });
      toast.success('Plan actualizado correctamente');
      setEditingUser(null);
    } catch (error) {
      toast.error('Error al actualizar el plan');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin': return 'destructive';
      case 'mkpro_admin': return 'default';
      case 'beta': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona todos los usuarios de la plataforma
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                  <SelectItem value="mkpro_admin">MKPro Admin</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              {filteredUsers.length} usuarios encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-center">
                      <Globe className="h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="text-center">
                      <FileText className="h-4 w-4 inline" />
                    </TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.email}
                        {user.is_beta && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Beta
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {PLANS[user.plan as keyof typeof PLANS]?.label || user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((role) => (
                            <Badge 
                              key={role} 
                              variant={getRoleBadgeVariant(role)}
                              className="text-xs"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.sites_count}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.articles_count}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                {editingUser?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Plan</label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLANS).map(([key, plan]) => (
                      <SelectItem key={key} value={key}>
                        {plan.label} ({plan.sites} sitios, {plan.posts} posts/mes)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Roles actuales</label>
                <div className="flex gap-2 flex-wrap">
                  {editingUser?.roles.map((role: string) => (
                    <Badge key={role} variant={getRoleBadgeVariant(role)}>
                      {role}
                    </Badge>
                  ))}
                  {editingUser?.roles.length === 0 && (
                    <span className="text-sm text-muted-foreground">Sin roles especiales</span>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePlan} disabled={updatePlan.isPending}>
                {updatePlan.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
