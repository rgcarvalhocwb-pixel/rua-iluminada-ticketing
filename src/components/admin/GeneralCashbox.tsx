import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Banknote, TrendingUp, TrendingDown, DollarSign, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyClosure {
  id: string;
  closure_date: string;
  total_income: number;
  total_expense: number;
  final_balance: number;
  event_id: string;
  created_at: string;
}

interface AdminTransfer {
  id: string;
  transfer_amount: number;
  transfer_date: string;
  event_id: string;
  notes?: string;
  created_at: string;
}

interface Event {
  id: string;
  name: string;
}

export const GeneralCashbox = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [dailyClosures, setDailyClosures] = useState<DailyClosure[]>([]);
  const [adminTransfers, setAdminTransfers] = useState<AdminTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    amount: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchData();
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

  const fetchData = async () => {
    if (!selectedEventId) return;

    try {
      // Buscar fechamentos diários
      const { data: closures, error: closuresError } = await supabase
        .from('daily_closures')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('closure_date', { ascending: false });

      if (closuresError) throw closuresError;

      // Buscar repasses para administração
      const { data: transfers, error: transfersError } = await supabase
        .from('admin_transfers')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('transfer_date', { ascending: false });

      if (transfersError) throw transfersError;

      setDailyClosures(closures || []);
      setAdminTransfers(transfers || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEventId || !transferData.amount) {
      toast({
        title: "Erro",
        description: "Preencha o valor do repasse",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_transfers')
        .insert({
          event_id: selectedEventId,
          transfer_amount: parseFloat(transferData.amount),
          transfer_date: new Date().toISOString().split('T')[0],
          notes: transferData.notes || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Repasse para administração registrado com sucesso!"
      });

      setDialogOpen(false);
      setTransferData({ amount: '', notes: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao registrar repasse: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Calcular saldo acumulado
  const calculateAccumulatedBalance = () => {
    const totalFromClosures = dailyClosures.reduce((sum, closure) => sum + closure.final_balance, 0);
    const totalTransfers = adminTransfers.reduce((sum, transfer) => sum + transfer.transfer_amount, 0);
    return totalFromClosures - totalTransfers;
  };

  const totalRevenue = dailyClosures.reduce((sum, closure) => sum + closure.total_income, 0);
  const totalExpenses = dailyClosures.reduce((sum, closure) => sum + closure.total_expense, 0);
  const totalBalance = dailyClosures.reduce((sum, closure) => sum + closure.final_balance, 0);
  const totalTransfers = adminTransfers.reduce((sum, transfer) => sum + transfer.transfer_amount, 0);
  const accumulatedBalance = calculateAccumulatedBalance();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Banknote className="w-6 h-6" />
          Caixa Geral e Repasse para Administração
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
              className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="" className="bg-background text-foreground">Selecione um evento</option>
              {events.map((event) => (
                <option key={event.id} value={event.id} className="bg-background text-foreground">
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {selectedEventId && (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {totalRevenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas Total</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {totalExpenses.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo dos Fechamentos</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {totalBalance.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Acumulado</CardTitle>
                <Banknote className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  R$ {accumulatedBalance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Após repasses: R$ {totalTransfers.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Botão de Repasse */}
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4" />
                  Repasse para Administração
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Repasse para Administração</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Valor do Repasse (R$) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={transferData.amount}
                      onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={transferData.notes}
                      onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                      placeholder="Observações sobre o repasse..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Registrar Repasse
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabela de Fechamentos Diários */}
          <Card>
            <CardHeader>
              <CardTitle>Fechamentos Diários</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyClosures.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum fechamento diário encontrado ainda.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data do Fechamento</TableHead>
                      <TableHead>Valor de Receita</TableHead>
                      <TableHead>Valor de Despesa</TableHead>
                      <TableHead>Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyClosures.map((closure) => (
                      <TableRow key={closure.id}>
                        <TableCell>
                          {format(new Date(closure.closure_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          R$ {closure.total_income.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          R$ {closure.total_expense.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-bold">
                          <span className={closure.final_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            R$ {closure.final_balance.toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tabela de Repasses */}
          {adminTransfers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Repasses</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor Repassado</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          {format(new Date(transfer.transfer_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          - R$ {transfer.transfer_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{transfer.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};