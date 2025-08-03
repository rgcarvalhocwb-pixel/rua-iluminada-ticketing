import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  session_id: string;
  event_sessions: {
    session_date: string;
    events: {
      name: string;
    };
    show_times: {
      time_slot: string;
    };
  };
  order_items: {
    quantity: number;
    unit_price: number;
    ticket_types: {
      name: string;
    };
  }[];
}

export const OrdersView = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          event_sessions!inner (
            session_date,
            events!inner (
              name
            ),
            show_times!inner (
              time_slot
            )
          ),
          order_items (
            quantity,
            unit_price,
            ticket_types (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_cpf.includes(searchTerm) ||
        order.event_sessions.events.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'Pendente', variant: 'secondary' as const },
      'paid': { label: 'Pago', variant: 'default' as const },
      'cancelled': { label: 'Cancelado', variant: 'destructive' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div>Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, CPF ou evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Data/Horário</TableHead>
              <TableHead>Ingressos</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Compra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                    <div className="text-sm text-muted-foreground">CPF: {order.customer_cpf}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{order.event_sessions.events.name}</div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{new Date(order.event_sessions.session_date).toLocaleDateString('pt-BR')}</div>
                    <div className="text-sm text-muted-foreground">{order.event_sessions.show_times.time_slot}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="text-sm">
                        {item.quantity}x {item.ticket_types.name}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                  <div className="text-sm text-muted-foreground capitalize">{order.payment_method}</div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(order.payment_status)}
                </TableCell>
                <TableCell>
                  {formatDate(order.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {orders.length === 0 ? 'Nenhum pedido encontrado' : 'Nenhum pedido corresponde aos filtros aplicados'}
          </div>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground">
        Total: {filteredOrders.length} pedido(s) | 
        Valor total: {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.total_amount, 0))}
      </div>
    </div>
  );
};