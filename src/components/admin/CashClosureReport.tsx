import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Printer, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CashClosure {
  id: string;
  event_id: string;
  closure_date: string;
  total_income: number;
  total_expense: number;
  final_balance: number;
  created_at: string;
}

export const CashClosureReport = () => {
  const [closures, setClosures] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchClosures();
    }
  }, [selectedEventId, startDate, endDate]);

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

  const fetchClosures = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('daily_closures')
        .select(`
          *
        `)
        .gte('closure_date', startDate)
        .lte('closure_date', endDate)
        .order('closure_date', { ascending: false });

      if (selectedEventId !== 'all') {
        query = query.eq('event_id', selectedEventId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Buscar nomes dos eventos separadamente
      const closuresWithEvents = await Promise.all(
        (data || []).map(async (closure) => {
          const { data: eventData } = await supabase
            .from('events')
            .select('name')
            .eq('id', closure.event_id)
            .single();
          
          return {
            ...closure,
            event_name: eventData?.name || ''
          };
        })
      );
      
      setClosures(closuresWithEvents);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar fechamentos: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Fechamentos de Caixa', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, 20, 35);
    
    if (selectedEventId !== 'all') {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      doc.text(`Evento: ${selectedEvent?.name || ''}`, 20, 45);
    }

    // Table data
    const tableData = closures.map(closure => [
      new Date(closure.closure_date).toLocaleDateString('pt-BR'),
      closure.event_name || '',
      `R$ ${closure.total_income.toFixed(2)}`,
      `R$ ${closure.total_expense.toFixed(2)}`,
      `R$ ${closure.final_balance.toFixed(2)}`
    ]);

    (doc as any).autoTable({
      head: [['Data', 'Evento', 'Receita', 'Despesas', 'Saldo Final']],
      body: tableData,
      startY: selectedEventId !== 'all' ? 55 : 45,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [75, 85, 99],
        textColor: 255,
      },
    });

    // Summary
    const totalIncome = closures.reduce((sum, c) => sum + c.total_income, 0);
    const totalExpense = closures.reduce((sum, c) => sum + c.total_expense, 0);
    const totalBalance = closures.reduce((sum, c) => sum + c.final_balance, 0);

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text('RESUMO GERAL:', 20, finalY);
    doc.text(`Total de Receitas: R$ ${totalIncome.toFixed(2)}`, 20, finalY + 10);
    doc.text(`Total de Despesas: R$ ${totalExpense.toFixed(2)}`, 20, finalY + 20);
    doc.text(`Saldo Total: R$ ${totalBalance.toFixed(2)}`, 20, finalY + 30);

    doc.save(`fechamentos-caixa-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const csvData = closures.map(closure => ({
      'Data': new Date(closure.closure_date).toLocaleDateString('pt-BR'),
      'Evento': closure.event_name || '',
      'Receita Total': closure.total_income.toFixed(2),
      'Despesas Total': closure.total_expense.toFixed(2),
      'Saldo Final': closure.final_balance.toFixed(2)
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fechamentos-caixa-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalIncome = closures.reduce((sum, c) => sum + c.total_income, 0);
  const totalExpense = closures.reduce((sum, c) => sum + c.total_expense, 0);
  const totalBalance = closures.reduce((sum, c) => sum + c.final_balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Relatório de Fechamentos de Caixa
        </h2>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Evento</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os eventos</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                R$ {totalIncome.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Receitas Totais</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                R$ {totalExpense.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Despesas Totais</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {totalBalance.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Saldo Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Fechamentos de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : closures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fechamento encontrado no período selecionado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead className="text-right">Receitas</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">Saldo Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closures.map((closure) => (
                  <TableRow key={closure.id}>
                    <TableCell>
                      {new Date(closure.closure_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{closure.event_name || ''}</TableCell>
                    <TableCell className="text-right text-green-600">
                      R$ {closure.total_income.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      R$ {closure.total_expense.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      closure.final_balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R$ {closure.final_balance.toFixed(2)}
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