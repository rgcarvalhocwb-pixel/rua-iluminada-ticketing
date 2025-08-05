import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Store } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  responsible: string;
  contact?: string;
  space_value: number;
  commission_percentage: number;
}

export const StoresManager = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    responsible: '',
    contact: '',
    space_value: '',
    commission_percentage: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar lojas: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.responsible || !formData.space_value || !formData.commission_percentage) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const storeData = {
        name: formData.name,
        responsible: formData.responsible,
        contact: formData.contact || null,
        space_value: parseFloat(formData.space_value),
        commission_percentage: parseFloat(formData.commission_percentage)
      };

      if (editingStore) {
        const { error } = await supabase
          .from('stores')
          .update(storeData)
          .eq('id', editingStore.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Loja atualizada com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('stores')
          .insert([storeData]);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Loja cadastrada com sucesso!"
        });
      }

      handleDialogClose();
      fetchStores();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar loja: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      responsible: store.responsible,
      contact: store.contact || '',
      space_value: store.space_value.toString(),
      commission_percentage: store.commission_percentage.toString()
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta loja?')) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Loja excluída com sucesso!"
      });
      fetchStores();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir loja: " + error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      responsible: '',
      contact: '',
      space_value: '',
      commission_percentage: ''
    });
    setEditingStore(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return <div>Carregando lojas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Store className="w-6 h-6" />
          Gestão de Lojas
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Loja
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingStore ? 'Editar Loja' : 'Nova Loja'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Loja *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Loja do João"
                  required
                />
              </div>
              <div>
                <Label htmlFor="responsible">Responsável *</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                  placeholder="Nome do responsável"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact">Contato</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  placeholder="Telefone ou email"
                />
              </div>
              <div>
                <Label htmlFor="space_value">Valor do Espaço (R$) *</Label>
                <Input
                  id="space_value"
                  type="number"
                  step="0.01"
                  value={formData.space_value}
                  onChange={(e) => setFormData({...formData, space_value: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="commission_percentage">Comissão (%) *</Label>
                <Input
                  id="commission_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData({...formData, commission_percentage: e.target.value})}
                  placeholder="Ex: 10.5"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingStore ? 'Atualizar' : 'Cadastrar'}
                </Button>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lojas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {stores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma loja cadastrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Valor Espaço</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>{store.responsible}</TableCell>
                    <TableCell>{store.contact || '-'}</TableCell>
                    <TableCell>R$ {store.space_value.toFixed(2)}</TableCell>
                    <TableCell>{store.commission_percentage}%</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(store)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(store.id)}>
                          <Trash2 className="w-4 h-4" />
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
  );
};