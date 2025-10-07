import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Eye,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WebhookLog {
  id: string;
  source: string;
  action: string;
  reference: string;
  payload: any;
  processed: boolean;
  processing_error: string | null;
  order_id: string | null;
  created_at: string;
}

export function CompreNoZetTransactions() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('webhook-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhook_logs'
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.payload?.data?.order?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.payload?.data?.order?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "processed" && log.processed) ||
      (filterStatus === "error" && !log.processed && log.processing_error) ||
      (filterStatus === "pending" && !log.processed && !log.processing_error);

    return matchesSearch && matchesAction && matchesStatus;
  });

  const stats = {
    total: logs.length,
    processed: logs.filter(l => l.processed).length,
    errors: logs.filter(l => !l.processed && l.processing_error).length,
    pending: logs.filter(l => !l.processed && !l.processing_error).length,
    purchases: logs.filter(l => l.action === 'CP').length,
    refunds: logs.filter(l => l.action === 'ES').length,
  };

  const exportToCSV = () => {
    const headers = ["Data/Hora", "Referência", "Ação", "Cliente", "Email", "Valor", "Status"];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      log.reference,
      log.action === 'CP' ? 'Compra' : 'Estorno',
      log.payload?.data?.order?.name || '-',
      log.payload?.data?.order?.email || '-',
      `R$ ${(log.payload?.data?.order?.totalValue - log.payload?.data?.order?.discount || 0).toFixed(2)}`,
      log.processed ? 'Processado' : (log.processing_error ? 'Erro' : 'Pendente')
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comprenozet-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (log: WebhookLog) => {
    if (log.processed) {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Processado</Badge>;
    } else if (log.processing_error) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
    } else {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    return action === 'CP' 
      ? <Badge className="bg-blue-500">Compra</Badge> 
      : <Badge className="bg-orange-500">Estorno</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.purchases} compras, {stats.refunds} estornos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.processed / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pending} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Compre no Zet</CardTitle>
          <CardDescription>
            Histórico completo de webhooks recebidos da plataforma Compre no Zet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por referência, nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas ações</SelectItem>
                <SelectItem value="CP">Compras</SelectItem>
                <SelectItem value="ES">Estornos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="processed">Processados</SelectItem>
                <SelectItem value="error">Com erro</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={fetchLogs} variant="outline" size="icon">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ingressos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.reference.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {log.payload?.data?.order?.name || '-'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.payload?.data?.order?.email || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {((log.payload?.data?.order?.totalValue || 0) - (log.payload?.data?.order?.discount || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {log.payload?.data?.eventTicketCodes?.length || 0}
                      </TableCell>
                      <TableCell>{getStatusBadge(log)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
            <DialogDescription>
              Referência: {selectedLog?.reference}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Resumo</TabsTrigger>
                <TabsTrigger value="payload">Payload</TabsTrigger>
                <TabsTrigger value="order">Pedido</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedLog)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ação</p>
                    <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data/Hora</p>
                    <p className="mt-1">
                      {format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                    <p className="mt-1">{selectedLog.payload?.data?.order?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="mt-1 text-sm">{selectedLog.payload?.data?.order?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CPF</p>
                    <p className="mt-1">{selectedLog.payload?.data?.order?.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                    <p className="mt-1 text-lg font-bold">
                      R$ {((selectedLog.payload?.data?.order?.totalValue || 0) - (selectedLog.payload?.data?.order?.discount || 0)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ingressos</p>
                    <p className="mt-1 text-lg font-bold">
                      {selectedLog.payload?.data?.eventTicketCodes?.length || 0}
                    </p>
                  </div>
                </div>

                {selectedLog.processing_error && (
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Erro de Processamento</p>
                    <p className="mt-1 text-sm text-red-600">{selectedLog.processing_error}</p>
                  </div>
                )}

                {selectedLog.order_id && (
                  <div className="flex items-center gap-2 p-4 border rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Pedido criado com sucesso</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedLog.order_id}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/admin?tab=orders`} target="_blank">
                        Ver Pedido <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payload">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="order" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Evento</h4>
                  <p>{selectedLog.payload?.data?.event?.name}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Forma de Pagamento</h4>
                  <p>{selectedLog.payload?.data?.order?.paymentType}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Ingressos</h4>
                  <div className="space-y-2">
                    {selectedLog.payload?.data?.eventTicketCodes?.map((ticket: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Voucher:</span>
                            <span className="ml-2 font-mono">{ticket.voucher}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Data:</span>
                            <span className="ml-2">{ticket.date}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Horário:</span>
                            <span className="ml-2">{ticket.time}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Titular:</span>
                            <span className="ml-2">{ticket.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
