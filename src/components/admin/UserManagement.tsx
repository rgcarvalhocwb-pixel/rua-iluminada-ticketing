import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Users, Check, X, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserPermission {
  id: string;
  permission: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  profiles?: any; // Simplified type for now
}

interface UserWithPermissions extends UserRole {
  permissions: UserPermission[];
}

const SYSTEM_PERMISSIONS = [
  { id: 'events_manage', label: 'Gerenciar Eventos' },
  { id: 'tickets_manage', label: 'Gerenciar Ingressos' },
  { id: 'cash_daily', label: 'Caixa Diário' },
  { id: 'cash_general', label: 'Caixa Geral' },
  { id: 'stores_manage', label: 'Gerenciar Lojas' },
  { id: 'online_sales', label: 'Vendas Online' },
  { id: 'orders_view', label: 'Visualizar Pedidos' },
  { id: 'payments_config', label: 'Configurar Pagamentos' },
  { id: 'users_manage', label: 'Gerenciar Usuários' },
  { id: 'dashboard_view', label: 'Visualizar Dashboard' }
];

export const UserManagement = () => {
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Buscar usuários com seus papéis
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Buscar permissões para cada usuário
      const usersWithPermissions = await Promise.all(
        (userRoles || []).map(async (userRole) => {
          const { data: permissions, error: permError } = await supabase
            .from('user_permissions')
            .select('id, permission')
            .eq('user_id', userRole.user_id);

          if (permError) {
            console.error('Erro ao buscar permissões:', permError);
            return { ...userRole, permissions: [] };
          }

          return { ...userRole, permissions: permissions || [] };
        })
      );

      setUsers(usersWithPermissions as UserWithPermissions[]);
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

  const handlePermissionChange = async (userId: string, permission: string, checked: boolean) => {
    try {
      if (checked) {
        // Adicionar permissão
        const { error } = await supabase
          .from('user_permissions')
          .insert({
            user_id: userId,
            permission: permission as any, // Type assertion for enum
            granted_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      } else {
        // Remover permissão
        const { error } = await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', userId)
          .eq('permission', permission as any); // Type assertion for enum

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `Permissão ${checked ? 'concedida' : 'removida'} com sucesso!`
      });

      fetchUsers(); // Recarregar lista
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao alterar permissão: " + error.message,
        variant: "destructive"
      });
    }
  };

  const hasPermission = (user: UserWithPermissions, permission: string) => {
    return user.permissions.some(p => p.permission === permission);
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
                  <TableHead>Permissões do Sistema</TableHead>
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
                          Usuário
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.user_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Administrador' : 
                         user.role === 'moderator' ? 'Moderador' : 'Usuário'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'approved' ? 'default' : 'destructive'}>
                        {user.status === 'approved' ? 'Aprovado' : 
                         user.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="text-sm font-medium mb-2">Controle de Acesso:</div>
                        <div className="grid grid-cols-2 gap-2 max-w-md">
                          {SYSTEM_PERMISSIONS.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${user.id}-${permission.id}`}
                                checked={hasPermission(user, permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(user.user_id, permission.id, checked as boolean)
                                }
                                disabled={user.role === 'admin' || user.status !== 'approved'} 
                              />
                              <label 
                                htmlFor={`${user.id}-${permission.id}`}
                                className="text-xs cursor-pointer"
                              >
                                {permission.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        {user.role === 'admin' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            * Administradores têm acesso total
                          </div>
                        )}
                        {user.status !== 'approved' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            * Usuário deve ser aprovado primeiro
                          </div>
                        )}
                      </div>
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
                        {user.status === 'approved' && user.role !== 'admin' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => promoteToAdmin(user.id)}
                          >
                            <Settings className="w-4 h-4" />
                            Promover
                          </Button>
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