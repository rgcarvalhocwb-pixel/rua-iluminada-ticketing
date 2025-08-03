import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  event_id: string;
  created_at: string;
}

interface TicketTypeManagerProps {
  eventId: string;
}

export const TicketTypeManager = ({ eventId }: TicketTypeManagerProps) => {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
  });

  useEffect(() => {
    fetchTicketTypes();
  }, [eventId]);

  const fetchTicketTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTicketTypes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de ingresso: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const ticketData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        event_id: eventId
      };

      if (editingTicket) {
        const { error } = await supabase
          .from('ticket_types')
          .update(ticketData)
          .eq('id', editingTicket.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Tipo de ingresso atualizado com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('ticket_types')
          .insert([ticketData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Tipo de ingresso criado com sucesso!"
        });
      }

      resetForm();
      fetchTicketTypes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (ticket: TicketType) => {
    setEditingTicket(ticket);
    setFormData({
      name: ticket.name,
      description: ticket.description || '',
      price: ticket.price.toString()
    });
  };

  const handleDelete = async (ticket: TicketType) => {
    if (!confirm(`Tem certeza que deseja excluir o tipo "${ticket.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ticket_types')
        .delete()
        .eq('id', ticket.id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Tipo de ingresso excluído com sucesso!"
      });
      
      fetchTicketTypes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir tipo de ingresso: " + error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: ''
    });
    setEditingTicket(null);
  };

  if (loading) {
    return <div>Carregando tipos de ingresso...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Ingresso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="ticket-name">Nome</Label>
            <Input
              id="ticket-name"
              placeholder="Ex: Inteira, Meia"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="ticket-description">Descrição</Label>
            <Textarea
              id="ticket-description"
              placeholder="Descrição opcional"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="ticket-price">Preço (R$)</Label>
            <Input
              id="ticket-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              {editingTicket ? 'Atualizar' : 'Adicionar'}
            </Button>
            {editingTicket && (
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

        {ticketTypes.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketTypes.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.name}</TableCell>
                  <TableCell>R$ {ticket.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(ticket)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(ticket)}>
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
  );
};