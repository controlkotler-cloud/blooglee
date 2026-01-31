import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBetaInvitations, useCreateBetaInvitation, useToggleBetaInvitation } from '@/hooks/useBetaInvitations';
import { Plus, Copy, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminBetaInvitations() {
  const { data: invitations = [], isLoading } = useBetaInvitations();
  const createInvitation = useCreateBetaInvitation();
  const toggleInvitation = useToggleBetaInvitation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [maxUses, setMaxUses] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');

  const handleCreate = async () => {
    try {
      await createInvitation.mutateAsync({
        maxUses: parseInt(maxUses) || 100,
        expiresAt: expiresAt || undefined,
      });
      toast.success('Invitación creada correctamente');
      setIsCreateOpen(false);
      setMaxUses('100');
      setExpiresAt('');
    } catch (error) {
      toast.error('Error al crear la invitación');
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      await toggleInvitation.mutateAsync({ id, isActive: !currentState });
      toast.success(currentState ? 'Invitación desactivada' : 'Invitación activada');
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/beta/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado al portapapeles');
  };

  const openLink = (token: string) => {
    const link = `${window.location.origin}/beta/${token}`;
    window.open(link, '_blank');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invitaciones Beta</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los enlaces de registro para el programa beta
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Invitación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Invitación Beta</DialogTitle>
                <DialogDescription>
                  Crea un nuevo enlace de registro para usuarios beta
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Número máximo de usuarios que pueden usar este enlace
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha de expiración (opcional)</label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Si no se especifica, el enlace no expira
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createInvitation.isPending}>
                  {createInvitation.isPending ? 'Creando...' : 'Crear Invitación'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invitations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones</CardTitle>
            <CardDescription>
              {invitations.length} invitaciones creadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay invitaciones creadas. Crea una nueva para empezar.
              </div>
            ) : (
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
