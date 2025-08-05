import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Ticket, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';

interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
  display_order: number;
  event_id: string;
}

interface Event {
  id: string;
  name: string;
}

export const TicketTypesManager = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicketType, setEditingTicketType] = useState<TicketType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_active: true,
    display_order: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchTicketTypes();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketTypes = async () => {
    if (!selectedEventId) return;

    try {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTicketTypes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de ingresso: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEventId || !formData.name || !formData.price) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const ticketTypeData = {
        event_id: selectedEventId,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        is_active: formData.is_active,
        display_order: formData.display_order ? parseInt(formData.display_order) : ticketTypes.length
      };

      if (editingTicketType) {
        const { error } = await supabase
          .from('ticket_types')
          .update(ticketTypeData)
          .eq('id', editingTicketType.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Tipo de ingresso atualizado com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('ticket_types')
          .insert([ticketTypeData]);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Tipo de ingresso criado com sucesso!"
        });
      }

      handleDialogClose();
      fetchTicketTypes();
      
      // Disparar evento para atualizar outras partes do sistema
      window.dispatchEvent(new CustomEvent('eventsUpdated'));
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar tipo de ingresso: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (ticketType: TicketType) => {
    setEditingTicketType(ticketType);
    setFormData({
      name: ticketType.name,
      description: ticketType.description || '',
      price: ticketType.price.toString(),
      is_active: ticketType.is_active,
      display_order: ticketType.display_order.toString()
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de ingresso?')) return;

    try {
      const { error } = await supabase
        .from('ticket_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de ingresso excluído com sucesso!"
      });
      fetchTicketTypes();
      window.dispatchEvent(new CustomEvent('eventsUpdated'));
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir tipo de ingresso: " + error.message,
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (ticketType: TicketType) => {
    try {
      const { error } = await supabase
        .from('ticket_types')
        .update({ is_active: !ticketType.is_active })
        .eq('id', ticketType.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Tipo de ingresso ${!ticketType.is_active ? 'ativado' : 'desativado'} com sucesso!`
      });
      fetchTicketTypes();
      window.dispatchEvent(new CustomEvent('eventsUpdated'));
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status: " + error.message,
        variant: "destructive"
      });
    }
  };

  const updateOrder = async (ticketType: TicketType, direction: 'up' | 'down') => {
    const currentIndex = ticketTypes.findIndex(t => t.id === ticketType.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= ticketTypes.length) return;

    const targetTicketType = ticketTypes[targetIndex];

    try {
      // Trocar as ordens
      await supabase
        .from('ticket_types')
        .update({ display_order: targetTicketType.display_order })
        .eq('id', ticketType.id);

      await supabase
        .from('ticket_types')
        .update({ display_order: ticketType.display_order })
        .eq('id', targetTicketType.id);

      fetchTicketTypes();
      window.dispatchEvent(new CustomEvent('eventsUpdated'));
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao reordenar: " + error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      is_active: true,
      display_order: ''
    });
    setEditingTicketType(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="w-6 h-6" />
          Gerenciar Tipos de Ingresso
        </h2>
      </div>

      {/* Seleção do Evento */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label>Evento</Label>
            <select 
              className="w-full p-2 border rounded-md"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">Selecione um evento</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {selectedEventId && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Tipos de Ingresso</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Tipo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTicketType ? 'Editar Tipo de Ingresso' : 'Novo Tipo de Ingresso'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: Inteira, Meia, VIP"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Descrição do tipo de ingresso"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Preço (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="display_order">Ordem de Exibição</Label>
                      <Input
                        id="display_order"
                        type="number"
                        min="0"
                        value={formData.display_order}
                        onChange={(e) => setFormData({...formData, display_order: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                      />
                      <Label htmlFor="is_active">Tipo ativo (visível para compra)</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {editingTicketType ? 'Atualizar' : 'Criar'}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {ticketTypes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum tipo de ingresso cadastrado ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketTypes.map((ticketType, index) => (
                    <TableRow key={ticketType.id} className={!ticketType.is_active ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateOrder(ticketType, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateOrder(ticketType, 'down')}
                            disabled={index === ticketTypes.length - 1}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{ticketType.name}</TableCell>
                      <TableCell>{ticketType.description || '-'}</TableCell>
                      <TableCell>R$ {ticketType.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(ticketType)}
                          className={ticketType.is_active ? 'text-green-600' : 'text-gray-400'}
                        >
                          {ticketType.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          {ticketType.is_active ? 'Ativo' : 'Inativo'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(ticketType)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(ticketType.id)}>
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
      )}
    </div>
  );
};