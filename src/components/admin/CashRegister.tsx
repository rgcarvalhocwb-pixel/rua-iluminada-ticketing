import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Calculator, DollarSign, Receipt } from 'lucide-react';

interface Event {
  id: string;
  name: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
}

interface ManualSale {
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
}

export const CashRegister = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Cash register state
  const [initialCash, setInitialCash] = useState<string>('');
  const [manualSales, setManualSales] = useState<ManualSale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [finalCash, setFinalCash] = useState<string>('');
  
  // Form states
  const [saleForm, setSaleForm] = useState({
    ticketTypeId: '',
    quantity: ''
  });
  
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: ''
  });
  
  const [isClosingRegister, setIsClosingRegister] = useState(false);
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
    }
  };

  const fetchTicketTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('id, name, price')
        .eq('event_id', selectedEventId)
        .order('name');

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

  const addManualSale = () => {
    if (!saleForm.ticketTypeId || !saleForm.quantity) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de ingresso e quantidade",
        variant: "destructive"
      });
      return;
    }

    const ticketType = ticketTypes.find(t => t.id === saleForm.ticketTypeId);
    if (!ticketType) return;

    const newSale: ManualSale = {
      ticketTypeId: saleForm.ticketTypeId,
      quantity: parseInt(saleForm.quantity),
      unitPrice: ticketType.price
    };

    setManualSales([...manualSales, newSale]);
    setSaleForm({ ticketTypeId: '', quantity: '' });
  };

  const removeManualSale = (index: number) => {
    setManualSales(manualSales.filter((_, i) => i !== index));
  };

  const addExpense = () => {
    if (!expenseForm.description || !expenseForm.amount) {
      toast({
        title: "Erro",
        description: "Preencha descrição e valor da despesa",
        variant: "destructive"
      });
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount)
    };

    setExpenses([...expenses, newExpense]);
    setExpenseForm({ description: '', amount: '' });
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const calculateTotals = () => {
    const salesTotal = manualSales.reduce((sum, sale) => sum + (sale.quantity * sale.unitPrice), 0);
    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expectedCash = parseFloat(initialCash || '0') + salesTotal - expensesTotal;
    const difference = parseFloat(finalCash || '0') - expectedCash;

    return {
      salesTotal,
      expensesTotal,
      expectedCash,
      difference
    };
  };

  const closeRegister = async () => {
    if (!selectedEventId || !selectedDate || !initialCash) {
      toast({
        title: "Erro",
        description: "Preencha evento, data e troco inicial",
        variant: "destructive"
      });
      return;
    }

    setIsClosingRegister(true);

    try {
      // Get event session or create one
      const { data: showTimes } = await supabase
        .from('show_times')
        .select('id')
        .eq('event_id', selectedEventId)
        .limit(1);

      if (!showTimes || showTimes.length === 0) {
        throw new Error('Nenhum horário encontrado para este evento');
      }

      let { data: session } = await supabase
        .from('event_sessions')
        .select('id')
        .eq('event_id', selectedEventId)
        .eq('show_time_id', showTimes[0].id)
        .eq('session_date', selectedDate)
        .single();

      if (!session) {
        const { data: newSession, error: sessionError } = await supabase
          .from('event_sessions')
          .insert({
            event_id: selectedEventId,
            show_time_id: showTimes[0].id,
            session_date: selectedDate,
            capacity: 100,
            available_tickets: 100
          })
          .select('id')
          .single();

        if (sessionError) throw sessionError;
        session = newSession;
      }

      // Create orders for manual sales
      for (const sale of manualSales) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            session_id: session.id,
            customer_name: 'Venda Presencial',
            customer_email: 'presencial@ruailuminada.com',
            customer_cpf: '00000000000',
            total_amount: sale.quantity * sale.unitPrice,
            payment_status: 'paid',
            payment_method: 'cash'
          })
          .select('id')
          .single();

        if (orderError) throw orderError;

        // Create order items
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            ticket_type_id: sale.ticketTypeId,
            quantity: sale.quantity,
            unit_price: sale.unitPrice,
            subtotal: sale.quantity * sale.unitPrice
          });

        if (itemError) throw itemError;
      }

      const totals = calculateTotals();
      
      toast({
        title: "Caixa fechado com sucesso!",
        description: `Diferença: ${totals.difference >= 0 ? '+' : ''}R$ ${totals.difference.toFixed(2)}`,
      });

      // Reset form
      setManualSales([]);
      setExpenses([]);
      setInitialCash('');
      setFinalCash('');

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao fechar caixa: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsClosingRegister(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Event and Date Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event">Evento</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um evento" />
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
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Initial Cash */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Abertura de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="initial-cash">Troco Inicial (R$)</Label>
            <Input
              id="initial-cash"
              type="number"
              step="0.01"
              value={initialCash}
              onChange={(e) => setInitialCash(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas Presenciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Tipo de Ingresso</Label>
              <Select 
                value={saleForm.ticketTypeId} 
                onValueChange={(value) => setSaleForm({...saleForm, ticketTypeId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ticketTypes.map((ticket) => (
                    <SelectItem key={ticket.id} value={ticket.id}>
                      {ticket.name} - R$ {ticket.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={saleForm.quantity}
                onChange={(e) => setSaleForm({...saleForm, quantity: e.target.value})}
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addManualSale} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {manualSales.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manualSales.map((sale, index) => {
                  const ticketType = ticketTypes.find(t => t.id === sale.ticketTypeId);
                  return (
                    <TableRow key={index}>
                      <TableCell>{ticketType?.name}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>R$ {sale.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>R$ {(sale.quantity * sale.unitPrice).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={() => removeManualSale(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Descrição</Label>
              <Input
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                placeholder="Ex: Troco, Combustível..."
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addExpense} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {expenses.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="destructive" onClick={() => removeExpense(expense.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cash Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Fechamento de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Troco Inicial:</span>
                <span>R$ {parseFloat(initialCash || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Vendas em Dinheiro:</span>
                <span>R$ {totals.salesTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Despesas:</span>
                <span>-R$ {totals.expensesTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Valor Esperado no Caixa:</span>
                <span>R$ {totals.expectedCash.toFixed(2)}</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="final-cash">Valor Contado no Caixa (R$)</Label>
              <Input
                id="final-cash"
                type="number"
                step="0.01"
                value={finalCash}
                onChange={(e) => setFinalCash(e.target.value)}
                placeholder="0.00"
              />
              {finalCash && (
                <div className={`mt-2 p-2 rounded text-sm ${totals.difference >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  Diferença: {totals.difference >= 0 ? '+' : ''}R$ {totals.difference.toFixed(2)}
                  <div className="text-xs">
                    {totals.difference > 0 ? '(Sobra)' : totals.difference < 0 ? '(Falta)' : '(Certo)'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={closeRegister} 
            disabled={isClosingRegister || !selectedEventId || !initialCash}
            className="w-full"
            size="lg"
          >
            <Receipt className="w-4 h-4 mr-2" />
            {isClosingRegister ? 'Fechando Caixa...' : 'Fechar Caixa'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};