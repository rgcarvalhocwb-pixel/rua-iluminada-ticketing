import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calculator, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Store {
  id: string;
  name: string;
  responsible: string;
  commission_percentage: number;
}

interface Event {
  id: string;
  name: string;
}

interface StoreDailySale {
  id: string;
  store_id: string;
  event_id: string;
  sale_date: string;
  total_sales: number;
  commission_amount: number;
  created_at: string;
  updated_at: string;
}

export const StoreDailySalesManager = () => {
  const [sales, setSales] = useState<StoreDailySale[]>([]);
  const [salesWithDetails, setSalesWithDetails] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<StoreDailySale | null>(null);
  const [formData, setFormData] = useState({
    store_id: '',
    event_id: '',
    sale_date: '',
    total_sales: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar vendas simples
      const { data: salesData, error: salesError } = await supabase
        .from('store_daily_sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;

      // Buscar vendas com detalhes para exibição
      const salesWithStoreAndEvent = await Promise.all(
        (salesData || []).map(async (sale) => {
          const [storeResult, eventResult] = await Promise.all([
            supabase.from('stores').select('name, commission_percentage').eq('id', sale.store_id).single(),
            supabase.from('events').select('name').eq('id', sale.event_id).single()
          ]);
          
          return {
            ...sale,
            store_name: storeResult.data?.name || 'Loja não encontrada',
            store_commission: storeResult.data?.commission_percentage || 0,
            event_name: eventResult.data?.name || 'Evento não encontrado'
          };
        })
      );

      // Buscar lojas
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (storesError) throw storesError;

      // Buscar eventos
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (eventsError) throw eventsError;

      setSales(salesData || []);
      setSalesWithDetails(salesWithStoreAndEvent);
      setStores(storesData || []);
      setEvents(eventsData || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCommission = (totalSales: number, storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return 0;
    return (totalSales * store.commission_percentage) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.store_id || !formData.event_id || !formData.sale_date || !formData.total_sales) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const totalSales = parseFloat(formData.total_sales);
      const commissionAmount = calculateCommission(totalSales, formData.store_id);

      const saleData = {
        store_id: formData.store_id,
        event_id: formData.event_id,
        sale_date: formData.sale_date,
        total_sales: totalSales,
        commission_amount: commissionAmount
      };

      if (editingSale) {
        const { error } = await supabase
          .from('store_daily_sales')
          .update(saleData)
          .eq('id', editingSale.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Venda atualizada com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('store_daily_sales')
          .insert([saleData]);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Venda registrada com sucesso!"
        });
      }

      handleDialogClose();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar venda: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (sale: any) => {
    setEditingSale(sale);
    setFormData({
      store_id: sale.store_id,
      event_id: sale.event_id,
      sale_date: sale.sale_date,
      total_sales: sale.total_sales.toString()
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro de venda?')) return;

    try {
      const { error } = await supabase
        .from('store_daily_sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Venda excluída com sucesso!"
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir venda: " + error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      store_id: '',
      event_id: '',
      sale_date: '',
      total_sales: ''
    });
    setEditingSale(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const getTotalSales = () => {
    return sales.reduce((total, sale) => total + sale.total_sales, 0);
  };

  const getTotalCommissions = () => {
    return sales.reduce((total, sale) => total + sale.commission_amount, 0);
  };

  if (loading) {
    return <div>Carregando vendas das lojas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Vendas Diárias das Lojas
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSale ? 'Editar Venda' : 'Registrar Nova Venda'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="store_id">Loja *</Label>
                <Select value={formData.store_id} onValueChange={(value) => setFormData({...formData, store_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} - {store.commission_percentage}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="event_id">Evento *</Label>
                <Select value={formData.event_id} onValueChange={(value) => setFormData({...formData, event_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sale_date">Data da Venda *</Label>
                <Input
                  id="sale_date"
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="total_sales">Valor Total de Vendas (R$) *</Label>
                <Input
                  id="total_sales"
                  type="number"
                  step="0.01"
                  value={formData.total_sales}
                  onChange={(e) => setFormData({...formData, total_sales: e.target.value})}
                  placeholder="0.00"
                  required
                />
                {formData.store_id && formData.total_sales && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Comissão: R$ {calculateCommission(parseFloat(formData.total_sales) || 0, formData.store_id).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingSale ? 'Atualizar' : 'Registrar'}
                </Button>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
                <p className="text-2xl font-bold">R$ {getTotalSales().toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calculator className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Comissões</p>
                <p className="text-2xl font-bold">R$ {getTotalCommissions().toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-full">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Registros</p>
                <p className="text-2xl font-bold">{sales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma venda registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Total Vendas</TableHead>
                  <TableHead>Comissão %</TableHead>
                  <TableHead>Valor Comissão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesWithDetails.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{sale.store_name}</TableCell>
                    <TableCell>{sale.event_name}</TableCell>
                    <TableCell>R$ {sale.total_sales.toFixed(2)}</TableCell>
                    <TableCell>{sale.store_commission}%</TableCell>
                    <TableCell className="font-bold text-green-600">
                      R$ {sale.commission_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(sale)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(sale.id)}>
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