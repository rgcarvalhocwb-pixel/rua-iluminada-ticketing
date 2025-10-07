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
import { Label } from "@/components/ui/label";
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

interface TicketData {
  barcode: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  used: boolean;
  dateTimeUsed?: string;
  code: string;
}

interface EventData {
  id: string;
  name: string;
  slug: string;
  date: string;
  time: string;
}

interface PayloadData {
  action: string;
  data: {
    order: {
      referenceID: string;
      name: string;
      email: string;
      cpf: string;
      phone: string;
      totalValue: number;
      totalTax: number;
      discount: number;
      paymentType: string;
      paymentSituation: string;
      paymentConfirmeDate?: string;
      createdAt: string;
    };
    event: EventData;
    eventTicketCodes: TicketData[];
  };
}

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
  const [filterPaymentType, setFilterPaymentType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
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

    const matchesPaymentType = filterPaymentType === "all" || 
      log.payload?.data?.order?.paymentType === filterPaymentType;

    const matchesDateFrom = dateFrom === "" || 
      new Date(log.created_at) >= new Date(dateFrom);

    const matchesDateTo = dateTo === "" || 
      new Date(log.created_at) <= new Date(dateTo + "T23:59:59");

    return matchesSearch && matchesAction && matchesStatus && matchesPaymentType && matchesDateFrom && matchesDateTo;
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
    const headers = [
      "Data/Hora", "Referência", "Ação", "Cliente", "Email", "CPF", "Telefone",
      "Pagamento", "Situação", "Valor Total", "Taxas", "Desconto", "Valor Líquido", 
      "Ingressos", "Status"
    ];
    const rows = filteredLogs.map(log => {
      const totalValue = log.payload?.data?.order?.totalValue || 0;
      const totalTax = log.payload?.data?.order?.totalTax || 0;
      const discount = log.payload?.data?.order?.discount || 0;
      const liquidValue = totalValue - totalTax - discount;

      return [
        format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
        log.reference,
        log.action === 'CP' ? 'Compra' : 'Estorno',
        log.payload?.data?.order?.name || '-',
        log.payload?.data?.order?.email || '-',
        log.payload?.data?.order?.cpf || '-',
        log.payload?.data?.order?.phone || '-',
        formatPaymentType(log.payload?.data?.order?.paymentType),
        log.payload?.data?.order?.paymentSituation || '-',
        `R$ ${totalValue.toFixed(2)}`,
        `R$ ${totalTax.toFixed(2)}`,
        `R$ ${discount.toFixed(2)}`,
        `R$ ${liquidValue.toFixed(2)}`,
        log.payload?.data?.eventTicketCodes?.length || '0',
        log.processed ? 'Processado' : (log.processing_error ? 'Erro' : 'Pendente')
      ];
    });

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

  const getPaymentSituationBadge = (situation?: string) => {
    if (!situation) return <Badge variant="outline">-</Badge>;
    
    switch (situation.toLowerCase()) {
      case "approved":
      case "paid":
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "cancelled":
      case "refunded":
        return <Badge className="bg-red-500">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{situation}</Badge>;
    }
  };

  const formatPaymentType = (type?: string) => {
    if (!type) return "-";
    const types: Record<string, string> = {
      "credit_card": "Cartão de Crédito",
      "debit_card": "Cartão de Débito",
      "pix": "PIX",
      "boleto": "Boleto",
      "1": "Cartão de Crédito",
      "2": "Boleto",
      "3": "PIX"
    };
    return types[type] || type;
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
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[200px]">
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
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ações</SelectItem>
                  <SelectItem value="CP">Compras</SelectItem>
                  <SelectItem value="ES">Estornos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="processed">Processados</SelectItem>
                  <SelectItem value="error">Com erro</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPaymentType} onValueChange={setFilterPaymentType}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos pagamentos</SelectItem>
                  <SelectItem value="1">Cartão de Crédito</SelectItem>
                  <SelectItem value="2">Boleto</SelectItem>
                  <SelectItem value="3">PIX</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Data Inicial"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
              />

              <Input
                type="date"
                placeholder="Data Final"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
              />

              <div className="flex gap-2">
                <Button onClick={fetchLogs} variant="outline" size="icon">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={exportToCSV} variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
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
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Taxas</TableHead>
                  <TableHead>Ingressos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
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
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{formatPaymentType(log.payload?.data?.order?.paymentType)}</span>
                          {getPaymentSituationBadge(log.payload?.data?.order?.paymentSituation)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {((log.payload?.data?.order?.totalValue || 0) - (log.payload?.data?.order?.discount || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-red-600">
                        R$ {(log.payload?.data?.order?.totalTax || 0).toFixed(2)}
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
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
            <DialogDescription>
              Referência: {selectedLog?.reference}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Resumo</TabsTrigger>
                <TabsTrigger value="tickets">Ingressos</TabsTrigger>
                <TabsTrigger value="event">Evento</TabsTrigger>
                <TabsTrigger value="payload">Payload</TabsTrigger>
              </TabsList>

              {/* Aba Resumo */}
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Referência</Label>
                    <p className="font-mono">{selectedLog.reference}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Data</Label>
                    <p>{format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Ação</Label>
                    <div>{getActionBadge(selectedLog.action)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Status</Label>
                    <div>{getStatusBadge(selectedLog)}</div>
                  </div>
                  {selectedLog.order_id && (
                    <div className="col-span-2">
                      <Label className="text-sm font-semibold">ID do Pedido Interno</Label>
                      <p className="font-mono text-sm">{selectedLog.order_id}</p>
                    </div>
                  )}
                  {selectedLog.processing_error && (
                    <div className="col-span-2">
                      <Label className="text-sm font-semibold text-red-500">Erro de Processamento</Label>
                      <p className="text-sm text-red-600">{selectedLog.processing_error}</p>
                    </div>
                  )}
                </div>

                {/* Dados do Cliente */}
                {selectedLog.payload?.data?.order && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Dados do Cliente</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Nome</Label>
                        <p className="font-medium">{selectedLog.payload.data.order.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <p className="font-medium">{selectedLog.payload.data.order.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Telefone</Label>
                        <p className="font-medium">{selectedLog.payload.data.order.phone || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">CPF</Label>
                        <p className="font-medium">{selectedLog.payload.data.order.cpf || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações de Pagamento */}
                {selectedLog.payload?.data?.order && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Informações de Pagamento</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Forma de Pagamento</Label>
                        <p className="font-medium">{formatPaymentType(selectedLog.payload.data.order.paymentType)}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Situação</Label>
                        <div className="mt-1">{getPaymentSituationBadge(selectedLog.payload.data.order.paymentSituation)}</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Data de Criação</Label>
                        <p className="font-medium">
                          {selectedLog.payload.data.order.createdAt 
                            ? format(new Date(selectedLog.payload.data.order.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Data de Confirmação</Label>
                        <p className="font-medium">
                          {selectedLog.payload.data.order.paymentConfirmeDate 
                            ? format(new Date(selectedLog.payload.data.order.paymentConfirmeDate), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detalhamento Financeiro */}
                {selectedLog.payload?.data?.order && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Detalhamento Financeiro</h3>
                    <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm text-muted-foreground">Valor Total</Label>
                        <p className="font-medium text-lg">R$ {selectedLog.payload.data.order.totalValue?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div className="flex justify-between items-center text-red-600">
                        <Label className="text-sm">Taxas da Plataforma</Label>
                        <p className="font-medium">- R$ {selectedLog.payload.data.order.totalTax?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div className="flex justify-between items-center text-orange-600">
                        <Label className="text-sm">Desconto</Label>
                        <p className="font-medium">- R$ {selectedLog.payload.data.order.discount?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <Label className="text-sm font-semibold">Valor Líquido</Label>
                        <p className="font-bold text-xl text-green-600">
                          R$ {(
                            (selectedLog.payload.data.order.totalValue || 0) - 
                            (selectedLog.payload.data.order.totalTax || 0) - 
                            (selectedLog.payload.data.order.discount || 0)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Aba Ingressos */}
              <TabsContent value="tickets" className="space-y-4">
                {selectedLog.payload?.data?.eventTicketCodes && selectedLog.payload.data.eventTicketCodes.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Total de Ingressos: {selectedLog.payload.data.eventTicketCodes.length}</h3>
                    </div>
                    <div className="grid gap-4">
                      {selectedLog.payload.data.eventTicketCodes.map((ticket, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="bg-muted/50 pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                              <span>Ingresso #{index + 1}</span>
                              {ticket.used ? (
                                <Badge className="bg-red-500">Utilizado</Badge>
                              ) : (
                                <Badge className="bg-green-500">Válido</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Titular</Label>
                                <p className="font-medium text-sm">{ticket.name}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Email</Label>
                                <p className="font-medium text-sm">{ticket.email}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Telefone</Label>
                                <p className="font-medium text-sm">{ticket.phone || "-"}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">CPF</Label>
                                <p className="font-medium text-sm">{ticket.document || "-"}</p>
                              </div>
                            </div>
                            
                            <div className="border-t pt-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Código do Ingresso</Label>
                                  <p className="font-mono text-sm">{ticket.code}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Código de Barras</Label>
                                  <p className="font-mono text-sm">{ticket.barcode}</p>
                                </div>
                              </div>
                            </div>

                            {ticket.used && ticket.dateTimeUsed && (
                              <div className="border-t pt-3 bg-red-50 dark:bg-red-950/20 -mx-6 -mb-4 px-6 py-3">
                                <Label className="text-xs text-muted-foreground">Utilizado em</Label>
                                <p className="font-medium text-sm text-red-600 dark:text-red-400">
                                  {format(new Date(ticket.dateTimeUsed), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum ingresso encontrado para esta transação.
                  </p>
                )}
              </TabsContent>

              {/* Aba Evento */}
              <TabsContent value="event" className="space-y-4">
                {selectedLog.payload?.data?.event ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações do Evento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">ID do Evento</Label>
                          <p className="font-mono font-medium">{selectedLog.payload.data.event.id}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Slug</Label>
                          <p className="font-mono font-medium">{selectedLog.payload.data.event.slug}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm text-muted-foreground">Nome do Evento</Label>
                          <p className="font-semibold text-lg">{selectedLog.payload.data.event.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Data</Label>
                          <p className="font-medium">{selectedLog.payload.data.event.date || "-"}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Horário</Label>
                          <p className="font-medium">{selectedLog.payload.data.event.time || "-"}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <Label className="text-sm text-muted-foreground mb-2 block">Link Externo</Label>
                        <a 
                          href={`https://comprenozet.com.br/evento/${selectedLog.payload.data.event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium flex items-center gap-2"
                        >
                          Ver evento no Compre no Zet
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Informações do evento não disponíveis.
                  </p>
                )}
              </TabsContent>

              {/* Aba Payload */}
              <TabsContent value="payload">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
