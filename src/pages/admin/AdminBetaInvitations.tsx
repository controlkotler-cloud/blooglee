import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MobileTableCard } from '@/components/admin/MobileTableCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBetaInvitations, useCreateBetaInvitation, useToggleBetaInvitation } from '@/hooks/useBetaInvitations';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Copy, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminBetaInvitations() {
  const { data: invitations = [], isLoading } = useBetaInvitations();
  const createInvitation = useCreateBetaInvitation();
  const toggleInvitation = useToggleBetaInvitation();
  const isMobile = useIsMobile();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [maxUses, setMaxUses] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');

  const handleCreate = async () => {
    try {
      await createInvitation.mutateAsync({
        maxUses: parseInt(maxUses) || 100,
        expiresAt: expiresAt || undefined,
      });
      toast.success('Invitación creada');
      setIsCreateOpen(false);
      setMaxUses('100');
      setExpiresAt('');
    } catch (error) {
      toast.error('Error al crear');
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      await toggleInvitation.mutateAsync({ id, isActive: !currentState });
      toast.success(currentState ? 'Desactivada' : 'Activada');
    } catch (error) {
      toast.error('Error');
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/beta/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado');
  };

  const openLink = (token: string) => {
    const link = `${window.location.origin}/beta/${token}`;
    window.open(link, '_blank');
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Invitaciones</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enlaces de registro beta
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Invitación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Invitación</DialogTitle>
                <DialogDescription>
                  Nuevo enlace de registro beta
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Máximo de usos</label>
                  <Input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="100"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Número máximo de usuarios
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiración (opcional)</label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dejar vacío para sin expiración
                  </p>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createInvitation.isPending} className="w-full sm:w-auto">
                  {createInvitation.isPending ? 'Creando...' : 'Crear'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invitations List */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Invitaciones</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {invitations.length} invitaciones creadas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay invitaciones. Crea una nueva.
              </div>
            ) : isMobile ? (
              /* Mobile: Card view */
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <MobileTableCard
                    key={invitation.id}
                    title={invitation.token}
                    badges={[
                      { 
                        label: invitation.is_active ? 'Activa' : 'Inactiva', 
                        variant: invitation.is_active ? 'secondary' : 'outline',
                        className: invitation.is_active ? 'bg-green-100 text-green-700' : ''
                      },
                      { 
                        label: `${invitation.current_uses}/${invitation.max_uses}`, 
                        variant: invitation.current_uses >= invitation.max_uses ? 'destructive' : 'outline'
                      },
                    ]}
                    details={[
                      { 
                        label: 'Creada', 
                        value: format(new Date(invitation.created_at), 'dd/MM/yy', { locale: es }) 
                      },
                      { 
                        label: 'Expira', 
                        value: invitation.expires_at 
                          ? format(new Date(invitation.expires_at), 'dd/MM/yy', { locale: es })
                          : 'Nunca'
                      },
                    ]}
                    actions={
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyLink(invitation.token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openLink(invitation.token)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggle(invitation.id, invitation.is_active)}
                        >
                          {invitation.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    }
                  />
                ))}
              </div>
            ) : (
              /* Desktop: Table view */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-mono font-medium">
                        {invitation.token}
                      </TableCell>
                      <TableCell>
                        <span className={invitation.current_uses >= invitation.max_uses ? 'text-red-500' : ''}>
                          {invitation.current_uses}/{invitation.max_uses}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(invitation.created_at), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invitation.expires_at 
                          ? format(new Date(invitation.expires_at), 'dd/MM/yyyy', { locale: es })
                          : 'Sin expiración'
                        }
                      </TableCell>
                      <TableCell>
                        {invitation.is_active ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactiva
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyLink(invitation.token)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openLink(invitation.token)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggle(invitation.id, invitation.is_active)}
                          >
                            {invitation.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
