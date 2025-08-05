import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Edit3 } from 'lucide-react';

interface EditUserDialogProps {
  targetUserId: string;
  userEmail: string;
  currentDisplayName?: string;
  currentRole?: 'user' | 'admin' | 'master';
  currentPermissions?: string[];
  onUserUpdated: () => void;
  canEditUser: boolean;
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

export const EditUserDialog = ({ 
  targetUserId, 
  userEmail, 
  currentDisplayName,
  currentRole = 'user',
  currentPermissions = [],
  onUserUpdated, 
  canEditUser 
}: EditUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentDisplayName || '',
    role: currentRole,
    permissions: currentPermissions,
    newPassword: '',
    changePassword: false
  });
  const { toast } = useToast();

  // Atualizar dados quando o diálogo abrir
  useEffect(() => {
    if (open) {
      setFormData({
        displayName: currentDisplayName || '',
        role: currentRole,
        permissions: currentPermissions,
        newPassword: '',
        changePassword: false
      });
    }
  }, [open, currentDisplayName, currentRole, currentPermissions]);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(p => p !== permissionId)
    }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, newPassword: password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: targetUserId,
          nickname: formData.displayName,
          email: userEmail
        });

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      // Atualizar role do usuário se mudou
      if (formData.role !== currentRole) {
        const currentUser = await supabase.auth.getUser();
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({
            role: formData.role,
            approved_by: currentUser.data.user?.id,
            approved_at: new Date().toISOString()
          })
          .eq('user_id', targetUserId);

        if (roleError) {
          throw roleError;
        }
      }

      // Atualizar permissões (apenas para usuários normais)
      if (formData.role === 'user') {
        // Remover todas as permissões atuais
        const { error: deleteError } = await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', targetUserId);

        if (deleteError) {
          console.error('Delete permissions error:', deleteError);
        }

        // Adicionar novas permissões
        if (formData.permissions.length > 0) {
          const currentUser = await supabase.auth.getUser();
          const permissionsToInsert = formData.permissions.map(permission => ({
            user_id: targetUserId,
            permission: permission as any,
            granted_by: currentUser.data.user?.id
          }));

          const { error: permError } = await supabase
            .from('user_permissions')
            .insert(permissionsToInsert);

          if (permError) {
            throw permError;
          }
        }
      }

      // Se alterou senha, chamar edge function
      if (formData.changePassword && formData.newPassword) {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.access_token) {
          throw new Error("Não autorizado");
        }

        const response = await fetch(`https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/reset-user-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            targetUserId,
            userEmail,
            newPassword: formData.newPassword
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao alterar senha');
        }
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!"
      });

      onUserUpdated();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canEditUser) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit3 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email do usuário:</Label>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome para Exibição</Label>
            <Input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Nome do usuário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuário</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="master">Master</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'user' && (
            <div className="space-y-2">
              <Label>Permissões Específicas</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {SYSTEM_PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(permission.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={permission.id}
                      className="text-xs cursor-pointer"
                    >
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Admins e Masters têm acesso completo automaticamente
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="changePassword"
                checked={formData.changePassword}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, changePassword: checked as boolean }))}
              />
              <Label htmlFor="changePassword">Alterar senha</Label>
            </div>
            
            {formData.changePassword && (
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="flex gap-2">
                  <Input
                    id="newPassword"
                    type="text"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    minLength={8}
                    placeholder="Digite a nova senha"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateRandomPassword}
                  >
                    Gerar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A nova senha será enviada por email para o usuário
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};