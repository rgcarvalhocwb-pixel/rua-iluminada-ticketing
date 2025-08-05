import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Store,
  Calendar,
  Ticket,
  Activity,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  totalBalance: number;
  totalTicketsSold: number;
  totalOrders: number;
  activeStores: number;
  pendingUsers: number;
  currentBalance: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'cash' | 'user' | 'store';
  description: string;
  amount?: number;
  timestamp: string;
}

interface EventStats {
  id: string;
  name: string;
  ticketsSold: number;
  revenue: number;
  status: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalBalance: 0,
    totalTicketsSold: 0,
    totalOrders: 0,
    activeStores: 0,
    pendingUsers: 0,
    currentBalance: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
    
    // Configurar atualização em tempo real
    const interval = setInterval(fetchDashboardData, 30000); // Atualizar a cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchFinancialStats(),
        fetchOrderStats(),
        fetchStoreStats(),
        fetchUserStats(),
        fetchRecentActivity(),
        fetchEventStats()
      ]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialStats = async () => {
    // Buscar dados financeiros
    const { data: closures } = await supabase
      .from('daily_closures')
      .select('total_income, total_expense, final_balance');
    
    const { data: transfers } = await supabase
      .from('admin_transfers')
      .select('transfer_amount');

    const totalRevenue = closures?.reduce((sum, c) => sum + c.total_income, 0) || 0;
    const totalExpenses = closures?.reduce((sum, c) => sum + c.total_expense, 0) || 0;
    const totalBalance = closures?.reduce((sum, c) => sum + c.final_balance, 0) || 0;
    const totalTransfers = transfers?.reduce((sum, t) => sum + t.transfer_amount, 0) || 0;

    setStats(prev => ({
      ...prev,
      totalRevenue,
      totalExpenses,
      totalBalance,
      currentBalance: totalBalance - totalTransfers
    }));
  };

  const fetchOrderStats = async () => {
    // Buscar estatísticas de pedidos
    const { data: orders } = await supabase
      .from('orders')
      .select('id, payment_status');

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('quantity');

    const totalOrders = orders?.length || 0;
    const totalTicketsSold = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    setStats(prev => ({
      ...prev,
      totalOrders,
      totalTicketsSold
    }));
  };

  const fetchStoreStats = async () => {
    const { data: stores } = await supabase
      .from('stores')
      .select('id');

    setStats(prev => ({
      ...prev,
      activeStores: stores?.length || 0
    }));
  };

  const fetchUserStats = async () => {
    const { data: users } = await supabase
      .from('user_roles')
      .select('status')
      .eq('status', 'pending');

    setStats(prev => ({
      ...prev,
      pendingUsers: users?.length || 0
    }));
  };

  const fetchRecentActivity = async () => {
    // Buscar atividades recentes (últimas 10)
    const activities: RecentActivity[] = [];

    // Pedidos recentes
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, customer_name, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    recentOrders?.forEach(order => {
      activities.push({
        id: order.id,
        type: 'order',
        description: `Novo pedido de ${order.customer_name}`,
        amount: order.total_amount,
        timestamp: order.created_at
      });
    });

    // Usuários pendentes recentes
    const { data: recentUsers } = await supabase
      .from('user_roles')
      .select('id, user_id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3);

    recentUsers?.forEach(user => {
      activities.push({
        id: user.id,
        type: 'user',
        description: `Novo usuário aguardando aprovação`,
        timestamp: user.created_at
      });
    });

    // Ordenar por timestamp e pegar os 10 mais recentes
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivity(activities.slice(0, 10));
  };

  const fetchEventStats = async () => {
    // Buscar estatísticas por evento
    const { data: events } = await supabase
      .from('events')
      .select(`
        id,
        name,
        start_date,
        end_date
      `);

    if (!events) return;

    const eventStatsData = await Promise.all(
      events.map(async (event) => {
        // Buscar vendas para este evento
        const { data: orderItems } = await supabase
          .from('order_items')
          .select(`
            quantity,
            subtotal,
            orders:order_id (
              session_id,
              event_sessions:session_id (
                event_id
              )
            )
          `)
          .eq('orders.event_sessions.event_id', event.id);

        const ticketsSold = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        const revenue = orderItems?.reduce((sum, item) => sum + item.subtotal, 0) || 0;

        // Determinar status do evento
        const now = new Date();
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        
        let status = 'upcoming';
        if (now >= startDate && now <= endDate) {
          status = 'active';
        } else if (now > endDate) {
          status = 'completed';
        }

        return {
          id: event.id,
          name: event.name,
          ticketsSold,
          revenue,
          status
        };
      })
    );

    setEventStats(eventStatsData);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="w-4 h-4" />;
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'store': return <Store className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard do Evento</h1>
            <p className="text-muted-foreground">
              Acompanhe todas as informações em tempo real
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Última atualização: {format(new Date(), 'HH:mm:ss', { locale: ptBR })}
          </div>
        </div>

        {/* Cards de Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                +{stats.totalOrders} pedidos processados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {stats.currentBalance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Após repasses administrativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingressos Vendidos</CardTitle>
              <Ticket className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalTicketsSold}
              </div>
              <p className="text-xs text-muted-foreground">
                Em {stats.totalOrders} pedidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Pendentes</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Layout em duas colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Estatísticas por Evento */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Desempenho por Evento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eventStats.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{event.name}</h4>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status === 'active' ? 'Ativo' : 
                             event.status === 'completed' ? 'Finalizado' : 'Em breve'}
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{event.ticketsSold} ingressos</span>
                          <span>R$ {event.revenue.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {eventStats.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum evento cadastrado ainda.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Atividade Recente */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.amount && (
                            <span className="text-sm text-green-600 font-medium">
                              R$ {activity.amount.toFixed(2)}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), 'HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {recentActivity.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma atividade recente.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cards de Resumo Adicional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Despesas Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {stats.totalExpenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-purple-600" />
                Lojas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.activeStores}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Saldo Final
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                R$ {stats.totalBalance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Antes dos repasses
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}