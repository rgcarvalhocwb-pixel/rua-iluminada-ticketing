import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Edit3 } from 'lucide-react';

interface EditUserDialogProps {
  targetUserId: string;
  userEmail: string;
  currentDisplayName?: string;
  onUserUpdated: () => void;
  canEditUser: boolean;
}

export const EditUserDialog = ({ 
  targetUserId, 
  userEmail, 
  currentDisplayName,
  onUserUpdated, 
  canEditUser 
}: EditUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentDisplayName || '',
    newPassword: '',
    changePassword: false
  });
  const { toast } = useToast();

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
      // Get current user session for authorization
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error("Não autorizado");
      }

      // Prepare data to send
      const updateData: any = {
        targetUserId,
        userEmail,
        displayName: formData.displayName
      };

      if (formData.changePassword && formData.newPassword) {
        updateData.newPassword = formData.newPassword;
      }

      // Call edge function to update user
      const response = await fetch(`https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/reset-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar usuário');
      }

      toast({
        title: "Sucesso",
        description: result.message || "Usuário atualizado com sucesso!"
      });

      onUserUpdated();
      setOpen(false);
      setFormData({ displayName: '', newPassword: '', changePassword: false });
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
      <DialogContent className="sm:max-w-[425px]">
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="changePassword"
                checked={formData.changePassword}
                onChange={(e) => setFormData(prev => ({ ...prev, changePassword: e.target.checked }))}
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (!formData.displayName.trim() && !formData.changePassword)}
            >
              {loading ? 'Atualizando...' : 'Atualizar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};