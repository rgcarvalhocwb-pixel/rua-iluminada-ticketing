import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface ShowTime {
  id: string;
  time_slot: string;
  capacity: number;
  event_id: string;
  created_at: string;
}

interface ShowTimeManagerProps {
  eventId: string;
}

export const ShowTimeManager = ({ eventId }: ShowTimeManagerProps) => {
  const [showTimes, setShowTimes] = useState<ShowTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingShowTime, setEditingShowTime] = useState<ShowTime | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    time_slot: '',
    capacity: '100'
  });

  useEffect(() => {
    fetchShowTimes();
  }, [eventId]);

  const fetchShowTimes = async () => {
    try {
      const { data, error } = await supabase
        .from('show_times')
        .select('*')
        .eq('event_id', eventId)
        .order('time_slot', { ascending: true });

      if (error) throw error;
      setShowTimes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar horários: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const showTimeData = {
        time_slot: formData.time_slot,
        capacity: parseInt(formData.capacity),
        event_id: eventId
      };

      if (editingShowTime) {
        const { error } = await supabase
          .from('show_times')
          .update(showTimeData)
          .eq('id', editingShowTime.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Horário atualizado com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('show_times')
          .insert([showTimeData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Horário criado com sucesso!"
        });
      }

      resetForm();
      fetchShowTimes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (showTime: ShowTime) => {
    setEditingShowTime(showTime);
    setFormData({
      time_slot: showTime.time_slot,
      capacity: showTime.capacity.toString()
    });
  };

  const handleDelete = async (showTime: ShowTime) => {
    if (!confirm(`Tem certeza que deseja excluir o horário ${showTime.time_slot}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('show_times')
        .delete()
        .eq('id', showTime.id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Horário excluído com sucesso!"
      });
      
      fetchShowTimes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir horário: " + error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      time_slot: '',
      capacity: '100'
    });
    setEditingShowTime(null);
  };

  if (loading) {
    return <div>Carregando horários...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horários de Exibição</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="time-slot">Horário</Label>
            <Input
              id="time-slot"
              type="time"
              value={formData.time_slot}
              onChange={(e) => setFormData({...formData, time_slot: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="capacity">Capacidade</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              {editingShowTime ? 'Atualizar' : 'Adicionar'}
            </Button>
            {editingShowTime && (
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

        {showTimes.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showTimes.map((showTime) => (
                <TableRow key={showTime.id}>
                  <TableCell>{showTime.time_slot}</TableCell>
                  <TableCell>{showTime.capacity}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(showTime)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(showTime)}>
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