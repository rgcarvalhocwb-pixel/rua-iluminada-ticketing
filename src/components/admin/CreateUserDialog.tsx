import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus } from 'lucide-react';

interface CreateUserDialogProps {
  onUserCreated: () => void;
  isMaster: boolean;
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

export const CreateUserDialog = ({ onUserCreated, isMaster }: CreateUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    phone: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'master' | 'terminal',
    permissions: [] as string[]
  });
  const { toast } = useToast();

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(p => p !== permissionId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      if (authData.user) {
        // Aguardar um pouco para garantir que o usuário foi criado
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Criar o perfil do usuário
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            nickname: formData.nickname,
            email: formData.email,
            phone: formData.phone
          });

        if (profileError) {
          console.error('Profile error:', profileError);
        }

        // Criar o role do usuário
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: authData.user.id,
            role: formData.role,
            status: 'approved',
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (roleError) {
          console.error('Role error:', roleError);
        }

        // Adicionar permissões específicas (se não for admin/master)
        if (formData.role !== 'admin' && formData.role !== 'master' && formData.role !== 'terminal' && formData.permissions.length > 0) {
          const currentUser = await supabase.auth.getUser();
          const permissionsToInsert = formData.permissions.map(permission => ({
            user_id: authData.user.id,
            permission: permission as any,
            granted_by: currentUser.data.user?.id
          }));

          const { error: permError } = await supabase
            .from('user_permissions')
            .insert(permissionsToInsert);

          if (permError) {
            console.error('Permissions error:', permError);
          }
        }

        toast({
          title: "Sucesso",
          description: `Usuário ${formData.nickname} criado com sucesso!`
        });

        onUserCreated();
        setOpen(false);
        setFormData({ 
          nickname: '', 
          email: '', 
          phone: '', 
          password: '', 
          role: 'user', 
          permissions: [] 
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao criar usuário: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Mostrar botão para masters e admins
  if (!isMaster) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" />
          Criar Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nome/Apelido *</Label>
            <Input
              id="nickname"
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              required
              placeholder="Nome para exibição"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuário *</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="terminal">Terminal de Autoatendimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'terminal' && (
            <div className="space-y-2">
              <Label>Informações sobre Usuário Terminal</Label>
              <div className="border rounded-md p-3 bg-muted/50">
                <h4 className="text-sm font-medium mb-2">Permissões Automáticas:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Acesso exclusivo ao terminal de autoatendimento</li>
                  <li>• Criar pedidos e ingressos no terminal</li>
                  <li>• Visualizar eventos e tipos de ingressos</li>
                  <li>• Processar pagamentos via terminal</li>
                </ul>
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ Este usuário NÃO terá acesso à área administrativa
                </p>
              </div>
            </div>
          )}

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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};