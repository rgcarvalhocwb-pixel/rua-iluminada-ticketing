import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Download, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SalesData {
  date: string;
  revenue: number;
  tickets: number;
  orders: number;
}

interface EventPerformance {
  event_id: string;
  event_name: string;
  total_revenue: number;
  total_tickets: number;
  conversion_rate: number;
  avg_ticket_price: number;
}

export const ReportsAnalytics = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [eventPerformance, setEventPerformance] = useState<EventPerformance[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      fetchAnalyticsData();
    }
  }, [selectedPeriod, selectedEvent, events]);

  const fetchEvents = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('id, name')
        .order('name');
      
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos: " + error.message,
        variant: "destructive"
      });
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSalesData(),
        fetchEventPerformance()
      ]);
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

  const fetchSalesData = async () => {
    const days = parseInt(selectedPeriod);
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Buscar vendas por período
    let query = supabase
      .from('orders')
      .select(`
        created_at,
        total_amount,
        order_items!inner(quantity, orders!inner(
          event_sessions!inner(event_id)
        ))
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('payment_status', 'paid');

    if (selectedEvent !== 'all') {
      query = query.eq('order_items.orders.event_sessions.event_id', selectedEvent);
    }

    const { data: orders } = await query;

    // Agrupar por data
    const salesByDate = new Map<string, SalesData>();
    
    // Inicializar todos os dias do período
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      salesByDate.set(date, {
        date,
        revenue: 0,
        tickets: 0,
        orders: 0
      });
    }

    // Somar dados reais
    orders?.forEach(order => {
      const date = format(new Date(order.created_at), 'yyyy-MM-dd');
      const existing = salesByDate.get(date);
      if (existing) {
        existing.revenue += order.total_amount;
        existing.orders += 1;
        existing.tickets += order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      }
    });

    setSalesData(Array.from(salesByDate.values()).reverse());
  };

  const fetchEventPerformance = async () => {
    // Buscar performance por evento de forma mais simples
    const { data: events } = await supabase
      .from('events')
      .select('id, name');

    if (!events) return;

    const performance: EventPerformance[] = [];

    for (const event of events) {
      // Buscar pedidos para este evento
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          total_amount,
          payment_status,
          order_items!inner(
            quantity, 
            unit_price,
            orders!inner(
              event_sessions!inner(event_id)
            )
          )
        `)
        .eq('order_items.orders.event_sessions.event_id', event.id);

      const paidOrders = orders?.filter(o => o.payment_status === 'paid') || [];
      const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalTickets = paidOrders.reduce((sum, order) => 
        sum + (order.order_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0), 0
      );
      
      performance.push({
        event_id: event.id,
        event_name: event.name,
        total_revenue: totalRevenue,
        total_tickets: totalTickets,
        conversion_rate: orders && orders.length > 0 ? (paidOrders.length / orders.length) * 100 : 0,
        avg_ticket_price: totalTickets > 0 ? totalRevenue / totalTickets : 0
      });
    }

    setEventPerformance(performance.sort((a, b) => b.total_revenue - a.total_revenue));
  };

  const exportToCSV = () => {
    const csvData = salesData.map(item => ({
      'Data': format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR }),
      'Receita (R$)': item.revenue.toFixed(2),
      'Ingressos Vendidos': item.tickets,
      'Pedidos': item.orders
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxRevenue = Math.max(...salesData.map(d => d.revenue));
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalTickets = salesData.reduce((sum, d) => sum + d.tickets, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);

  if (loading) {
    return <div>Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Relatórios e Analytics
        </h2>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="15">Últimos 15 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os eventos</SelectItem>
            {events.map(event => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalRevenue.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Últimos {selectedPeriod} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Ingressos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalTickets}
            </div>
            <p className="text-sm text-muted-foreground">
              Em {totalOrders} pedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Média Diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {(totalRevenue / parseInt(selectedPeriod)).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Por dia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <div className="flex items-end justify-between h-full space-x-2">
              {salesData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="bg-primary rounded-t w-full min-h-[4px] transition-all hover:bg-primary/80"
                    style={{ 
                      height: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 200 + 20 : 20}px` 
                    }}
                    title={`${format(new Date(item.date), 'dd/MM', { locale: ptBR })}: R$ ${item.revenue.toFixed(2)}`}
                  />
                  <div className="text-xs text-muted-foreground mt-2 rotate-45 origin-left">
                    {format(new Date(item.date), 'dd/MM', { locale: ptBR })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance por Evento */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eventPerformance.map((event) => (
              <div key={event.event_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{event.event_name}</h4>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    <span>R$ {event.total_revenue.toFixed(2)}</span>
                    <span>{event.total_tickets} ingressos</span>
                    <span>{event.conversion_rate.toFixed(1)}% conversão</span>
                    <span>R$ {event.avg_ticket_price.toFixed(2)} média</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    R$ {event.total_revenue.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};