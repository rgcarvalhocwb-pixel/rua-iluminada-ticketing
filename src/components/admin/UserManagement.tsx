import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Users, Check, X, Settings, UserX, UserCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateUserDialog } from './CreateUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface UserPermission {
  id: string;
  permission: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'master';
  status: 'pending' | 'approved' | 'rejected';
  account_status: 'active' | 'inactive';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  profiles?: any; // Simplified type for now
}

interface UserWithPermissions extends UserRole {
  permissions: UserPermission[];
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserRole();
  }, []);

  const fetchCurrentUserRole = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.user.id)
          .single();
        
        if (!error && data) {
          setCurrentUserRole(data.role);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Buscar usuários com seus papéis
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Buscar perfis e permissões para cada usuário
      const usersWithPermissions = await Promise.all(
        (userRoles || []).map(async (userRole) => {
          // Buscar perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('nickname, email, phone')
            .eq('user_id', userRole.user_id)
            .single();

          if (profileError) {
            console.error('Erro ao buscar perfil:', profileError);
          }

          // Buscar permissões do usuário
          const { data: permissions, error: permError } = await supabase
            .from('user_permissions')
            .select('id, permission')
            .eq('user_id', userRole.user_id);

          if (permError) {
            console.error('Erro ao buscar permissões:', permError);
            return { 
              ...userRole, 
              account_status: (userRole as any).account_status || 'active' as const,
              permissions: [], 
              profiles: null 
            };
          }

          return { 
            ...userRole, 
            account_status: (userRole as any).account_status || 'active' as const,
            permissions: permissions || [], 
            profiles: profile 
          };
        })
      );

      // Filtrar usuário master oculto (exceto para ele mesmo)
      const { data: currentUser } = await supabase.auth.getUser();
      const filteredUsers = usersWithPermissions.filter(user => {
        // Se é o próprio usuário master, mostrar
        if (currentUser?.user?.email === 'rodolphogcarvalho@gmail.com') {
          return true;
        }
        
        // Para outros usuários, ocultar o master principal
        const isHiddenMaster = user.profiles?.email === 'rodolphogcarvalho@gmail.com' || 
                               user.user_id === 'ed9fac91-f902-4e84-973e-a0f7c54dd9ed';
        
        return !isHiddenMaster;
      });

      setUsers(filteredUsers as UserWithPermissions[]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          status,
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status: " + error.message,
        variant: "destructive"
      });
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário promovido a administrador com sucesso!"
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao promover usuário: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeactivateUser = async (userId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ account_status: 'inactive' } as any)
        .eq('id', userId);

      if (error) throw error;

      await logAction({
        action: 'user_deactivated',
        entityType: 'user',
        entityId: userId,
        details: { userEmail }
      });

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, account_status: 'inactive' as const }
          : user
      ));

      toast({
        title: "Usuário desativado",
        description: `Conta de ${userEmail} foi desativada com sucesso.`
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível desativar o usuário: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleReactivateUser = async (userId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ account_status: 'active' } as any)
        .eq('id', userId);

      if (error) throw error;

      await logAction({
        action: 'user_reactivated',
        entityType: 'user',
        entityId: userId,
        details: { userEmail }
      });

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, account_status: 'active' as const }
          : user
      ));

      toast({
        title: "Usuário reativado",
        description: `Conta de ${userEmail} foi reativada com sucesso.`
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível reativar o usuário: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await logAction({
        action: 'user_deleted',
        entityType: 'user',
        entityId: userId,
        details: { userEmail }
      });

      setUsers(users.filter(user => user.id !== userId));

      toast({
        title: "Usuário excluído",
        description: `Conta de ${userEmail} foi excluída permanentemente.`
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário: " + error.message,
        variant: "destructive"
      });
    }
  };


  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Gerenciamento de Usuários
        </h2>
        <CreateUserDialog 
          onUserCreated={fetchUsers} 
          isMaster={['master', 'admin'].includes(currentUserRole)} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários e Permissões</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário encontrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                     <TableCell>
                       <div>
                         <div className="font-medium">
                           {user.profiles?.nickname || 'Nome não informado'}
                         </div>
                         <div className="text-sm text-muted-foreground">
                           {user.profiles?.email || user.user_id}
                         </div>
                         {user.profiles?.phone && (
                           <div className="text-xs text-muted-foreground">
                             {user.profiles.phone}
                           </div>
                         )}
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant={user.role === 'admin' || user.role === 'master' ? 'default' : 'secondary'}>
                         {user.role === 'admin' ? 'Administrador' : 
                          user.role === 'master' ? 'Master' : 'Usuário'}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       <Badge variant={user.status === 'approved' ? 'default' : 'destructive'}>
                         {user.status === 'approved' ? 'Aprovado' : 
                          user.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       <Badge variant={user.account_status === 'active' ? 'default' : 'destructive'}>
                         {user.account_status === 'active' ? 'Ativa' : 'Inativa'}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                     </TableCell>
                     <TableCell>
                       <div className="flex gap-2">
                         {user.status === 'pending' && (
                           <>
                             <Button 
                               size="sm" 
                               onClick={() => updateUserStatus(user.id, 'approved')}
                               className="bg-green-600 hover:bg-green-700"
                             >
                               <Check className="w-4 h-4" />
                             </Button>
                             <Button 
                               size="sm" 
                               variant="destructive"
                               onClick={() => updateUserStatus(user.id, 'rejected')}
                             >
                               <X className="w-4 h-4" />
                             </Button>
                           </>
                         )}
                         {user.status === 'approved' && user.role !== 'admin' && user.role !== 'master' && (
                           <Button 
                             size="sm" 
                             variant="outline"
                             onClick={() => promoteToAdmin(user.id)}
                           >
                             <Settings className="w-4 h-4" />
                             Promover
                           </Button>
                         )}
                           {user.status === 'approved' && (
                             <EditUserDialog
                               targetUserId={user.user_id}
                               userEmail={user.profiles?.email || user.user_id}
                               currentDisplayName={user.profiles?.nickname || ''}
                               currentRole={user.role}
                               currentPermissions={user.permissions.map(p => p.permission)}
                               onUserUpdated={fetchUsers}
                               canEditUser={['master', 'admin'].includes(currentUserRole)}
                             />
                           )}
                           
                           {/* Botão de desativar/reativar */}
                           {user.status === 'approved' && user.role !== 'master' && ['master', 'admin'].includes(currentUserRole) && (
                             user.account_status === 'active' ? (
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                   >
                                     <UserX className="w-4 h-4" />
                                   </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                   <AlertDialogHeader>
                                     <AlertDialogTitle>Desativar usuário</AlertDialogTitle>
                                     <AlertDialogDescription>
                                       Tem certeza que deseja desativar a conta de {user.profiles?.email || user.user_id}? 
                                       O usuário não conseguirá mais fazer login.
                                     </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                     <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                     <AlertDialogAction
                                       onClick={() => handleDeactivateUser(user.id, user.profiles?.email || user.user_id)}
                                     >
                                       Desativar
                                     </AlertDialogAction>
                                   </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                             ) : (
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => handleReactivateUser(user.id, user.profiles?.email || user.user_id)}
                               >
                                 <UserCheck className="w-4 h-4" />
                               </Button>
                             )
                           )}

                           {/* Botão de excluir */}
                           {user.role !== 'master' && ['master', 'admin'].includes(currentUserRole) && (
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Tem certeza que deseja excluir permanentemente a conta de {user.profiles?.email || user.user_id}? 
                                     Esta ação não pode ser desfeita.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                   <AlertDialogAction
                                     onClick={() => handleDeleteUser(user.id, user.profiles?.email || user.user_id)}
                                     className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                   >
                                     Excluir
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                           )}
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
  );
};