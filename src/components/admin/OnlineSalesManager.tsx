import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Globe, RefreshCw, DollarSign } from 'lucide-react';

interface Event {
  id: string;
  name: string;
}

interface OnlineSale {
  id: string;
  platform_name: string;
  ticket_type: string;
  quantity_sold: number;
  quantity_refunded: number;
  unit_price: number;
  sale_date: string;
}

interface OnlineTransfer {
  id: string;
  platform_name: string;
  transfer_date: string;
  expected_amount: number;
  received_amount?: number;
  status: string;
  notes?: string;
}

export const OnlineSalesManager = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [onlineSales, setOnlineSales] = useState<OnlineSale[]>([]);
  const [onlineTransfers, setOnlineTransfers] = useState<OnlineTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [saleForm, setSaleForm] = useState({
    platform_name: '',
    ticket_type: 'Inteira',
    quantity_sold: '',
    quantity_refunded: '',
    unit_price: '',
    sale_date: new Date().toISOString().split('T')[0]
  });

  const [transferForm, setTransferForm] = useState({
    platform_name: '',
    transfer_date: new Date().toISOString().split('T')[0],
    expected_amount: '',
    received_amount: '',
    notes: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchOnlineSales();
      fetchOnlineTransfers();
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

  const fetchOnlineSales = async () => {
    if (!selectedEventId) return;

    try {
      const { data, error } = await supabase
        .from('online_sales')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setOnlineSales(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar vendas online: " + error.message,
        variant: "destructive"
      });
    }
  };

  const fetchOnlineTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('online_transfers')
        .select('*')
        .order('transfer_date', { ascending: false });

      if (error) throw error;
      setOnlineTransfers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar repasses: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEventId || !saleForm.platform_name || !saleForm.quantity_sold || !saleForm.unit_price) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('online_sales')
        .insert([{
          event_id: selectedEventId,
          platform_name: saleForm.platform_name,
          ticket_type: saleForm.ticket_type,
          quantity_sold: parseInt(saleForm.quantity_sold),
          quantity_refunded: parseInt(saleForm.quantity_refunded) || 0,
          unit_price: parseFloat(saleForm.unit_price),
          sale_date: saleForm.sale_date
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Venda online registrada com sucesso!"
      });

      setSaleForm({
        platform_name: '',
        ticket_type: 'Inteira',
        quantity_sold: '',
        quantity_refunded: '',
        unit_price: '',
        sale_date: new Date().toISOString().split('T')[0]
      });

      fetchOnlineSales();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao registrar venda: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferForm.platform_name || !transferForm.expected_amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const status = transferForm.received_amount ? 'received' : 'pending';
      
      const { error } = await supabase
        .from('online_transfers')
        .insert([{
          platform_name: transferForm.platform_name,
          transfer_date: transferForm.transfer_date,
          expected_amount: parseFloat(transferForm.expected_amount),
          received_amount: transferForm.received_amount ? parseFloat(transferForm.received_amount) : null,
          status: status,
          notes: transferForm.notes || null
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Repasse registrado com sucesso!"
      });

      setTransferForm({
        platform_name: '',
        transfer_date: new Date().toISOString().split('T')[0],
        expected_amount: '',
        received_amount: '',
        notes: ''
      });

      fetchOnlineTransfers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao registrar repasse: " + error.message,
        variant: "destructive"
      });
    }
  };

  const markTransferAsReceived = async (transferId: string, receivedAmount: number) => {
    try {
      const { error } = await supabase
        .from('online_transfers')
        .update({
          received_amount: receivedAmount,
          status: 'received'
        })
        .eq('id', transferId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Repasse marcado como recebido!"
      });

      fetchOnlineTransfers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar repasse: " + error.message,
        variant: "destructive"
      });
    }
  };

  const calculateSummary = () => {
    const totalSold = onlineSales.reduce((sum, sale) => sum + (sale.quantity_sold * sale.unit_price), 0);
    const totalRefunded = onlineSales.reduce((sum, sale) => sum + (sale.quantity_refunded * sale.unit_price), 0);
    return {
      totalSold,
      totalRefunded,
      netAmount: totalSold - totalRefunded
    };
  };

  const summary = calculateSummary();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="w-6 h-6" />
          Vendas Online de Terceiros
        </h2>
        <div className="flex-1 max-w-xs">
          <Label>Evento</Label>
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
      </div>

      {selectedEventId && (
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">Lançamento de Vendas</TabsTrigger>
            <TabsTrigger value="transfers">Conciliação de Repasses</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lançamento Manual de Vendas Online</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaleSubmit} className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plataforma *</Label>
                    <Input
                      value={saleForm.platform_name}
                      onChange={(e) => setSaleForm({...saleForm, platform_name: e.target.value})}
                      placeholder="Ex: Sympla, Eventbrite"
                      required
                    />
                  </div>
                  <div>
                    <Label>Tipo de Ingresso *</Label>
                    <Select 
                      value={saleForm.ticket_type} 
                      onValueChange={(value) => setSaleForm({...saleForm, ticket_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inteira">Inteira</SelectItem>
                        <SelectItem value="Meia">Meia</SelectItem>
                        <SelectItem value="Clube VIP">Clube VIP</SelectItem>
                        <SelectItem value="Clube Premium">Clube Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade Vendida *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={saleForm.quantity_sold}
                      onChange={(e) => setSaleForm({...saleForm, quantity_sold: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Quantidade Estornada</Label>
                    <Input
                      type="number"
                      min="0"
                      value={saleForm.quantity_refunded}
                      onChange={(e) => setSaleForm({...saleForm, quantity_refunded: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Valor Unitário (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={saleForm.unit_price}
                      onChange={(e) => setSaleForm({...saleForm, unit_price: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Data da Venda *</Label>
                    <Input
                      type="date"
                      value={saleForm.sale_date}
                      onChange={(e) => setSaleForm({...saleForm, sale_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Button type="submit" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Venda
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo das Vendas Online</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {summary.totalSold.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-700">Total Vendido</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded">
                    <div className="text-2xl font-bold text-red-600">
                      R$ {summary.totalRefunded.toFixed(2)}
                    </div>
                    <div className="text-sm text-red-700">Total Estornado</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {summary.netAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-700">Valor Líquido</div>
                  </div>
                </div>

                {onlineSales.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Vendidos</TableHead>
                        <TableHead>Estornados</TableHead>
                        <TableHead>Valor Unit.</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {onlineSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{new Date(sale.sale_date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{sale.platform_name}</TableCell>
                          <TableCell>{sale.ticket_type}</TableCell>
                          <TableCell>{sale.quantity_sold}</TableCell>
                          <TableCell>{sale.quantity_refunded}</TableCell>
                          <TableCell>R$ {sale.unit_price.toFixed(2)}</TableCell>
                          <TableCell>
                            R$ {((sale.quantity_sold - sale.quantity_refunded) * sale.unit_price).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Repasse</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransferSubmit} className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plataforma *</Label>
                    <Input
                      value={transferForm.platform_name}
                      onChange={(e) => setTransferForm({...transferForm, platform_name: e.target.value})}
                      placeholder="Ex: Sympla, Eventbrite"
                      required
                    />
                  </div>
                  <div>
                    <Label>Data do Repasse *</Label>
                    <Input
                      type="date"
                      value={transferForm.transfer_date}
                      onChange={(e) => setTransferForm({...transferForm, transfer_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Valor Esperado (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={transferForm.expected_amount}
                      onChange={(e) => setTransferForm({...transferForm, expected_amount: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Valor Recebido (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={transferForm.received_amount}
                      onChange={(e) => setTransferForm({...transferForm, received_amount: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <Input
                      value={transferForm.notes}
                      onChange={(e) => setTransferForm({...transferForm, notes: e.target.value})}
                      placeholder="Observações sobre o repasse"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button type="submit" className="w-full">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Registrar Repasse
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Repasses</CardTitle>
              </CardHeader>
              <CardContent>
                {onlineTransfers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Esperado</TableHead>
                        <TableHead>Recebido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {onlineTransfers.map((transfer) => (
                        <TableRow key={transfer.id}>
                          <TableCell>{new Date(transfer.transfer_date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{transfer.platform_name}</TableCell>
                          <TableCell>R$ {transfer.expected_amount.toFixed(2)}</TableCell>
                          <TableCell>
                            {transfer.received_amount ? `R$ ${transfer.received_amount.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              transfer.status === 'received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transfer.status === 'received' ? 'Recebido' : 'Pendente'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {transfer.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => markTransferAsReceived(transfer.id, transfer.expected_amount)}
                              >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Marcar Recebido
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum repasse registrado ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};