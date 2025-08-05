import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, UserX, Shield, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  user_email?: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails from auth metadata
      const usersWithEmails = await Promise.all(
        data.map(async (userRole) => {
          const { data: userData } = await supabase.auth.admin.getUserById(userRole.user_id);
          return {
            ...userRole,
            user_email: userData.user?.email || 'Email não disponível'
          };
        })
      );

      setUsers(usersWithEmails);
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
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`,
      });

      loadUsers();
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
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário promovido a administrador",
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao promover usuário: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge className="bg-purple-100 text-purple-800 border-purple-300">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline">
        <User className="w-3 h-3 mr-1" />
        Usuário
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-6">Carregando usuários...</div>;
  }

  const pendingUsers = users.filter(u => u.status === 'pending');

  return (
    <div className="space-y-6">
      {pendingUsers.length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>Atenção:</strong> Existem {pendingUsers.length} usuários aguardando aprovação.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Gerencie aprovações e permissões dos usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.user_email}</span>
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    {user.approved_at && (
                      <span> • Aprovado em: {new Date(user.approved_at).toLocaleDateString('pt-BR')}</span>
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  {user.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateUserStatus(user.user_id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateUserStatus(user.user_id, 'rejected')}
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </>
                  )}

                  {user.status === 'approved' && user.role === 'user' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => promoteToAdmin(user.user_id)}
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Promover a Admin
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};