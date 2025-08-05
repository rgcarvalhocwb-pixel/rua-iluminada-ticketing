import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Calculator, DollarSign, Receipt, CreditCard, Banknote, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Event {
  id: string;
  name: string;
}

interface CashEntry {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'pix';
  ticketQuantity?: {
    inteira: number;
    meia: number;
  };
}

interface ConciliationData {
  turnstileInteira: number;
  turnstileMeia: number;
}

export const CashRegister = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Cash book state
  const [initialCash, setInitialCash] = useState<string>('');
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [finalCash, setFinalCash] = useState<string>('');
  
  // Conciliation from turnstile
  const [conciliation, setConciliation] = useState<ConciliationData>({
    turnstileInteira: 0,
    turnstileMeia: 0
  });
  
  // Form states
  const [entryForm, setEntryForm] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'credit' | 'debit' | 'pix',
    inteiraQty: '',
    meiaQty: ''
  });
  
  const [isClosingRegister, setIsClosingRegister] = useState(false);
  const [isImportingPagSeguro, setIsImportingPagSeguro] = useState(false);
  const [pendingCommissions, setPendingCommissions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchPendingCommissions();
  }, [selectedDate]);

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

  const fetchPendingCommissions = async () => {
    if (!selectedDate) return;
    
    try {
      const { data, error } = await supabase
        .from('store_daily_sales')
        .select(`
          *,
          stores(name)
        `)
        .eq('sale_date', selectedDate)
        .eq('commission_paid', false); // Apenas comissões não pagas

      if (error) throw error;
      setPendingCommissions(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar comissões pendentes:', error);
    }
  };

  const addEntry = () => {
    if (!entryForm.description || !entryForm.amount) {
      toast({
        title: "Erro",
        description: "Preencha descrição e valor",
        variant: "destructive"
      });
      return;
    }

    // Para vendas de ingressos, validar quantidades
    if (entryForm.type === 'income' && entryForm.description.toLowerCase().includes('ingresso')) {
      if (!entryForm.inteiraQty && !entryForm.meiaQty) {
        toast({
          title: "Erro",
          description: "Para venda de ingressos, informe a quantidade de inteira e/ou meia",
          variant: "destructive"
        });
        return;
      }
    }

    const newEntry: CashEntry = {
      id: Date.now().toString(),
      type: entryForm.type,
      description: entryForm.description,
      amount: parseFloat(entryForm.amount),
      paymentMethod: entryForm.paymentMethod,
      ticketQuantity: (entryForm.inteiraQty || entryForm.meiaQty) ? {
        inteira: parseInt(entryForm.inteiraQty) || 0,
        meia: parseInt(entryForm.meiaQty) || 0
      } : undefined
    };

    setEntries([...entries, newEntry]);
    setEntryForm({
      type: 'income',
      description: '',
      amount: '',
      paymentMethod: 'cash',
      inteiraQty: '',
      meiaQty: ''
    });
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const generateCashClosureReport = (totals: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('RELATÓRIO DE FECHAMENTO DE CAIXA', 20, 20);
    
    doc.setFontSize(12);
    const selectedEvent = events.find(e => e.id === selectedEventId);
    doc.text(`Evento: ${selectedEvent?.name || ''}`, 20, 35);
    doc.text(`Data: ${new Date(selectedDate).toLocaleDateString('pt-BR')}`, 20, 45);
    
    // Entries table
    const entriesData = entries.map(entry => [
      entry.type === 'income' ? 'Entrada' : 'Saída',
      entry.description,
      entry.paymentMethod === 'cash' ? 'Dinheiro' : 
      entry.paymentMethod === 'credit' ? 'Cartão Crédito' :
      entry.paymentMethod === 'debit' ? 'Cartão Débito' : 'PIX',
      `R$ ${entry.amount.toFixed(2)}`,
      entry.ticketQuantity ? `I:${entry.ticketQuantity.inteira} M:${entry.ticketQuantity.meia}` : '-'
    ]);

    autoTable(doc, {
      head: [['Tipo', 'Descrição', 'Pagamento', 'Valor', 'Ingressos']],
      body: entriesData,
      startY: 55,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [75, 85, 99] },
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text('RESUMO FINANCEIRO:', 20, finalY);
    
    doc.setFontSize(11);
    doc.text(`Total de Receitas: R$ ${totals.incomeTotal.toFixed(2)}`, 20, finalY + 15);
    doc.text(`Total de Despesas: R$ ${totals.expenseTotal.toFixed(2)}`, 20, finalY + 25);
    doc.text(`Saldo Final: R$ ${(totals.incomeTotal - totals.expenseTotal).toFixed(2)}`, 20, finalY + 35);
    
    doc.text(`Troco Inicial: R$ ${parseFloat(initialCash || '0').toFixed(2)}`, 20, finalY + 50);
    doc.text(`Valor Esperado em Caixa: R$ ${totals.expectedCash.toFixed(2)}`, 20, finalY + 60);
    doc.text(`Valor Contado: R$ ${parseFloat(finalCash || '0').toFixed(2)}`, 20, finalY + 70);
    doc.text(`Diferença: R$ ${totals.difference.toFixed(2)}`, 20, finalY + 80);

    // Tickets reconciliation
    doc.text('CONCILIAÇÃO DE INGRESSOS:', 20, finalY + 100);
    doc.text(`Vendidos - Inteira: ${totals.ticketsSold.inteira} | Meia: ${totals.ticketsSold.meia}`, 20, finalY + 110);
    doc.text(`Catraca - Inteira: ${conciliation.turnstileInteira} | Meia: ${conciliation.turnstileMeia}`, 20, finalY + 120);
    
    // Signature area
    doc.text('_________________________________', 20, finalY + 150);
    doc.text('Responsável pelo Fechamento', 20, finalY + 160);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, finalY + 170);

    // Print
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const calculateTotals = () => {
    const incomeTotal = entries
      .filter(e => e.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const expenseTotal = entries
      .filter(e => e.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const cashIncome = entries
      .filter(e => e.type === 'income' && e.paymentMethod === 'cash')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const cashExpense = entries
      .filter(e => e.type === 'expense' && e.paymentMethod === 'cash')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const expectedCash = parseFloat(initialCash || '0') + cashIncome - cashExpense;
    const difference = parseFloat(finalCash || '0') - expectedCash;

    // Calcular totais de ingressos vendidos
    const ticketsSold = entries.reduce((acc, entry) => {
      if (entry.ticketQuantity) {
        acc.inteira += entry.ticketQuantity.inteira;
        acc.meia += entry.ticketQuantity.meia;
      }
      return acc;
    }, { inteira: 0, meia: 0 });

    return {
      incomeTotal,
      expenseTotal,
      cashIncome,
      cashExpense,
      expectedCash,
      difference,
      ticketsSold
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
      const totals = calculateTotals();
      
      // Verificar se já existe fechamento para este evento e data
      const { data: existingClosure } = await supabase
        .from('daily_closures')
        .select('id')
        .eq('event_id', selectedEventId)
        .eq('closure_date', selectedDate)
        .single();

      let error;
      if (existingClosure) {
        // Atualizar fechamento existente
        const result = await supabase
          .from('daily_closures')
          .update({
            total_income: totals.incomeTotal,
            total_expense: totals.expenseTotal,
            final_balance: totals.incomeTotal - totals.expenseTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingClosure.id);
        error = result.error;
      } else {
        // Criar novo fechamento
        const result = await supabase
          .from('daily_closures')
          .insert({
            event_id: selectedEventId,
            closure_date: selectedDate,
            total_income: totals.incomeTotal,
            total_expense: totals.expenseTotal,
            final_balance: totals.incomeTotal - totals.expenseTotal
          });
        error = result.error;
      }

      if (error) throw error;

      // Gerar e imprimir relatório
      generateCashClosureReport(totals);
      
      toast({
        title: "Livro Caixa fechado com sucesso!",
        description: `Diferença no dinheiro: ${totals.difference >= 0 ? '+' : ''}R$ ${totals.difference.toFixed(2)}`,
      });

      // Reset form
      setEntries([]);
      setInitialCash('');
      setFinalCash('');
      setConciliation({ turnstileInteira: 0, turnstileMeia: 0 });

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

  const importPagSeguroSales = async () => {
    if (!selectedDate) {
      toast({
        title: "Erro",
        description: "Selecione uma data para importar as vendas",
        variant: "destructive"
      });
      return;
    }

    setIsImportingPagSeguro(true);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-pagseguro-sales', {
        body: {
          startDate: selectedDate,
          endDate: selectedDate
        }
      });

      if (error) throw error;

      if (data.success) {
        if (data.count === 0) {
          toast({
            title: "Nenhuma venda nova encontrada",
            description: "Todas as vendas do período já foram importadas anteriormente.",
          });
          return;
        }

        // Adicionar as vendas PagSeguro ao livro caixa
        const newEntries = data.entries.map((entry: any) => ({
          id: Date.now().toString() + Math.random(),
          type: entry.type,
          description: entry.description,
          amount: entry.amount,
          paymentMethod: entry.paymentMethod
        }));

        setEntries(prev => [...prev, ...newEntries]);

        toast({
          title: "Vendas importadas com sucesso!",
          description: `${data.count} vendas novas importadas totalizando R$ ${data.totalAmount.toFixed(2)}`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao importar vendas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImportingPagSeguro(false);
    }
  };

  const totals = calculateTotals();

  const addCommissionPayment = async (commission: any) => {
    const commissionEntry: CashEntry = {
      id: Date.now().toString(),
      type: 'income', // CORRIGIDO: comissão é ENTRADA
      description: `Comissão recebida - ${commission.stores.name}`,
      amount: commission.commission_amount,
      paymentMethod: 'cash'
    };

    setEntries([...entries, commissionEntry]);

    // Marcar comissão como paga no banco
    try {
      await supabase
        .from('store_daily_sales')
        .update({ commission_paid: true })
        .eq('id', commission.id);
      
      // Recarregar comissões pendentes
      fetchPendingCommissions();
      
      toast({
        title: "Comissão registrada",
        description: `Comissão de ${commission.stores.name} adicionada como entrada`,
      });
    } catch (error: any) {
      console.error('Erro ao marcar comissão como paga:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da comissão",
        variant: "destructive"
      });
    }
  };

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

      {/* Comissões Pendentes */}
      {pendingCommissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Comissões Pendentes para {new Date(selectedDate).toLocaleDateString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingCommissions.map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{commission.stores.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Venda: R$ {commission.total_sales.toFixed(2)} | 
                      Comissão: R$ {commission.commission_amount.toFixed(2)}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => addCommissionPayment(commission)}
                  >
                    Receber Comissão
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Livro Caixa - Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos no Livro Caixa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Tipo de Lançamento</Label>
              <Select 
                value={entryForm.type} 
                onValueChange={(value: 'income' | 'expense') => setEntryForm({...entryForm, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select 
                value={entryForm.paymentMethod} 
                onValueChange={(value: 'cash' | 'credit' | 'debit' | 'pix') => setEntryForm({...entryForm, paymentMethod: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Dinheiro</SelectItem>
                  <SelectItem value="credit">💳 Cartão Crédito</SelectItem>
                  <SelectItem value="debit">💳 Cartão Débito</SelectItem>
                  <SelectItem value="pix">📱 PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Descrição</Label>
              <Input
                value={entryForm.description}
                onChange={(e) => setEntryForm({...entryForm, description: e.target.value})}
                placeholder="Ex: Venda de ingressos, Combustível, Pagamento comissão..."
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={entryForm.amount}
                onChange={(e) => setEntryForm({...entryForm, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>

          {entryForm.type === 'income' && entryForm.description.toLowerCase().includes('ingresso') && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded">
              <div>
                <Label>Quantidade Inteira</Label>
                <Input
                  type="number"
                  min="0"
                  value={entryForm.inteiraQty}
                  onChange={(e) => setEntryForm({...entryForm, inteiraQty: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Quantidade Meia</Label>
                <Input
                  type="number"
                  min="0"
                  value={entryForm.meiaQty}
                  onChange={(e) => setEntryForm({...entryForm, meiaQty: e.target.value})}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={addEntry} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Lançamento
            </Button>
            <Button 
              onClick={importPagSeguroSales} 
              disabled={isImportingPagSeguro || !selectedDate}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isImportingPagSeguro ? 'Importando...' : 'Importar PagSeguro'}
            </Button>
          </div>

          {entries.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ingressos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        entry.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.type === 'income' ? 'Entrada' : 'Saída'}
                      </span>
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      {entry.paymentMethod === 'cash' && '💵 Dinheiro'}
                      {entry.paymentMethod === 'credit' && '💳 Crédito'}
                      {entry.paymentMethod === 'debit' && '💳 Débito'}
                      {entry.paymentMethod === 'pix' && '📱 PIX'}
                    </TableCell>
                    <TableCell>R$ {entry.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {entry.ticketQuantity ? 
                        `I: ${entry.ticketQuantity.inteira} | M: ${entry.ticketQuantity.meia}` : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="destructive" onClick={() => removeEntry(entry.id)}>
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

      {/* Conciliação da Catraca */}
      <Card>
        <CardHeader>
          <CardTitle>Conciliação - Dados da Catraca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Inteira (Catraca)</Label>
              <Input
                type="number"
                min="0"
                value={conciliation.turnstileInteira}
                onChange={(e) => setConciliation({...conciliation, turnstileInteira: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Meia (Catraca)</Label>
              <Input
                type="number"
                min="0"
                value={conciliation.turnstileMeia}
                onChange={(e) => setConciliation({...conciliation, turnstileMeia: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded">
            <h4 className="font-semibold mb-2">Comparativo</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Vendidos (Caixa):</strong></p>
                <p>Inteira: {totals.ticketsSold.inteira}</p>
                <p>Meia: {totals.ticketsSold.meia}</p>
              </div>
              <div>
                <p><strong>Entradas (Catraca):</strong></p>
                <p>Inteira: {conciliation.turnstileInteira}</p>
                <p>Meia: {conciliation.turnstileMeia}</p>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <p><strong>Diferenças:</strong></p>
              <p className={`${totals.ticketsSold.inteira !== conciliation.turnstileInteira ? 'text-red-600' : 'text-green-600'}`}>
                Inteira: {totals.ticketsSold.inteira - conciliation.turnstileInteira}
              </p>
              <p className={`${totals.ticketsSold.meia !== conciliation.turnstileMeia ? 'text-red-600' : 'text-green-600'}`}>
                Meia: {totals.ticketsSold.meia - conciliation.turnstileMeia}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro e Fechamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Resumo Financeiro e Fechamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold">Movimentação Geral</h4>
              <div className="flex justify-between">
                <span>Total Entradas:</span>
                <span className="text-green-600">+R$ {totals.incomeTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Saídas:</span>
                <span className="text-red-600">-R$ {totals.expenseTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Saldo:</span>
                <span>R$ {(totals.incomeTotal - totals.expenseTotal).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Movimentação em Dinheiro</h4>
              <div className="flex justify-between">
                <span>Troco Inicial:</span>
                <span>R$ {parseFloat(initialCash || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Entradas em Dinheiro:</span>
                <span className="text-green-600">+R$ {totals.cashIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Saídas em Dinheiro:</span>
                <span className="text-red-600">-R$ {totals.cashExpense.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Esperado no Caixa:</span>
                <span>R$ {totals.expectedCash.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="flex items-end">
              {finalCash && (
                <div className={`w-full p-3 rounded text-sm ${totals.difference >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-semibold">
                    Diferença: {totals.difference >= 0 ? '+' : ''}R$ {totals.difference.toFixed(2)}
                  </div>
                  <div className="text-xs">
                    {totals.difference > 0 ? '(Sobra no caixa)' : totals.difference < 0 ? '(Falta no caixa)' : '(Caixa confere)'}
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
            {isClosingRegister ? 'Fechando Livro Caixa...' : 'Fechar Livro Caixa'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};