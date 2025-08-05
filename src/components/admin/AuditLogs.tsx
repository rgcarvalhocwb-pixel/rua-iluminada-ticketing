import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Filter, Download, User, Settings, ShoppingCart, Ticket, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
}

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntityType, setFilterEntityType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, filterAction, filterEntityType, dateFrom, dateTo]);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (error: any) {
      console.error('Erro ao carregar logs de auditoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de auditoria",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por ação
    if (filterAction !== "all") {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    // Filtro por tipo de entidade
    if (filterEntityType !== "all") {
      filtered = filtered.filter(log => log.entity_type === filterEntityType);
    }

    // Filtro por data
    if (dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(dateTo + 'T23:59:59'));
    }

    setFilteredLogs(filtered);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('user') || action.includes('login') || action.includes('logout')) return User;
    if (action.includes('event') || action.includes('ticket')) return Ticket;
    if (action.includes('cash') || action.includes('payment')) return DollarSign;
    if (action.includes('store') || action.includes('sale')) return ShoppingCart;
    return Settings;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return "bg-green-100 text-green-800";
    if (action.includes('update') || action.includes('edit')) return "bg-blue-100 text-blue-800";
    if (action.includes('delete') || action.includes('remove')) return "bg-red-100 text-red-800";
    if (action.includes('login')) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  const exportLogs = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Ação', 'Tipo', 'ID da Entidade', 'Detalhes'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString('pt-BR'),
        log.user_email || 'N/A',
        log.action,
        log.entity_type || 'N/A',
        log.entity_id || 'N/A',
        log.details ? JSON.stringify(log.details) : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueEntityTypes = [...new Set(logs.map(log => log.entity_type).filter(Boolean))];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">Carregando logs de auditoria...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Auditoria do Sistema
          </CardTitle>
          <CardDescription>
            Logs de todas as ações realizadas pelos usuários no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Usuário, ação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-filter">Ação</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-filter">Tipo</Label>
              <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {uniqueEntityTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">Data inicial</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">Data final</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end space-y-2">
              <Button onClick={exportLogs} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{logs.length}</div>
                <p className="text-xs text-muted-foreground">Total de logs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{filteredLogs.length}</div>
                <p className="text-xs text-muted-foreground">Logs filtrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {new Set(logs.map(log => log.user_email)).size}
                </div>
                <p className="text-xs text-muted-foreground">Usuários únicos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{uniqueActions.length}</div>
                <p className="text-xs text-muted-foreground">Tipos de ações</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de logs */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>ID da Entidade</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{log.user_email || 'Sistema'}</TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.entity_type && (
                          <Badge variant="outline">{log.entity_type}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entity_id}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.details && (
                          <details className="cursor-pointer">
                            <summary className="text-sm text-muted-foreground">
                              Ver detalhes
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log de auditoria encontrado com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};