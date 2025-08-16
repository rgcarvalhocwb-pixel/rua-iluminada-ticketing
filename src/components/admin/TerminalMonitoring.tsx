import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Wifi, 
  WifiOff, 
  Printer, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Activity,
  DollarSign,
  Users,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Terminal {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  lastHeartbeat: string;
  version: string;
  hardware: {
    printers: { name: string; status: string }[];
    pinpads: { name: string; status: string }[];
  };
  metrics: {
    dailySales: number;
    transactionsToday: number;
    uptime: number;
    lastSale: string;
  };
}

interface SystemAlert {
  id: string;
  terminal_id: string;
  type: 'hardware' | 'connection' | 'error' | 'warning';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const TerminalMonitoring = () => {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const { toast } = useToast();

  // Simular dados dos terminais (em produção viria da API)
  const mockTerminals: Terminal[] = [
    {
      id: 'terminal-001',
      name: 'Terminal Principal',
      location: 'Entrada Principal',
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      version: '1.2.0',
      hardware: {
        printers: [
          { name: 'Epson TM-T88V', status: 'online' },
          { name: 'Bematech MP-4200', status: 'offline' }
        ],
        pinpads: [
          { name: 'Ingenico iPP350', status: 'online' },
          { name: 'PagBank Moderninha X', status: 'online' }
        ]
      },
      metrics: {
        dailySales: 2500.00,
        transactionsToday: 45,
        uptime: 98.5,
        lastSale: new Date(Date.now() - 300000).toISOString()
      }
    },
    {
      id: 'terminal-002',
      name: 'Terminal Secundário',
      location: 'Área de Alimentação',
      status: 'online',
      lastHeartbeat: new Date(Date.now() - 120000).toISOString(),
      version: '1.2.0',
      hardware: {
        printers: [
          { name: 'Zebra ZD220', status: 'online' }
        ],
        pinpads: [
          { name: 'Stone Ton T2', status: 'error' }
        ]
      },
      metrics: {
        dailySales: 1800.00,
        transactionsToday: 32,
        uptime: 95.2,
        lastSale: new Date(Date.now() - 900000).toISOString()
      }
    },
    {
      id: 'terminal-003',
      name: 'Terminal Móvel',
      location: 'Área Externa',
      status: 'offline',
      lastHeartbeat: new Date(Date.now() - 3600000).toISOString(),
      version: '1.1.8',
      hardware: {
        printers: [
          { name: 'Elgin i9', status: 'offline' }
        ],
        pinpads: [
          { name: 'Cielo LIO', status: 'offline' }
        ]
      },
      metrics: {
        dailySales: 0,
        transactionsToday: 0,
        uptime: 0,
        lastSale: new Date(Date.now() - 86400000).toISOString()
      }
    }
  ];

  const mockAlerts: SystemAlert[] = [
    {
      id: '1',
      terminal_id: 'terminal-002',
      type: 'hardware',
      message: 'Pinpad Stone Ton T2 não responde',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      resolved: false
    },
    {
      id: '2',
      terminal_id: 'terminal-003',
      type: 'connection',
      message: 'Terminal offline há mais de 1 hora',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      resolved: false
    },
    {
      id: '3',
      terminal_id: 'terminal-001',
      type: 'warning',
      message: 'Impressora Bematech MP-4200 desconectada',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      resolved: false
    }
  ];

  useEffect(() => {
    loadTerminalsData();
    loadSystemAlerts();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(() => {
      loadTerminalsData();
      loadSystemAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadTerminalsData = async () => {
    try {
      setLoading(true);
      // Em produção, aqui faria chamada para API real
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTerminals(mockTerminals);
    } catch (error) {
      console.error('Erro ao carregar dados dos terminais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados dos terminais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeSince = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m atrás`;
    return `${minutes}m atrás`;
  };

  const resolveAlert = async (alertId: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));
      
      toast({
        title: "Alerta resolvido",
        description: "O alerta foi marcado como resolvido",
      });
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  };

  const totalSalesToday = terminals.reduce((sum, terminal) => sum + terminal.metrics.dailySales, 0);
  const totalTransactions = terminals.reduce((sum, terminal) => sum + terminal.metrics.transactionsToday, 0);
  const onlineTerminals = terminals.filter(t => t.status === 'online').length;
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoramento de Terminais</h2>
          <p className="text-muted-foreground">
            Status em tempo real dos terminais de autoatendimento
          </p>
        </div>
        <Button onClick={loadTerminalsData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Métricas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSalesToday)}</div>
            <p className="text-xs text-muted-foreground">
              {totalTransactions} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminais Online</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineTerminals}/{terminals.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((onlineTerminals / terminals.length) * 100)}% disponibilidade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime Médio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(terminals.reduce((sum, t) => sum + t.metrics.uptime, 0) / terminals.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 24h
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="terminals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="terminals">Terminais</TabsTrigger>
          <TabsTrigger value="alerts">Alertas ({unresolvedAlerts})</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="terminals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {terminals.map((terminal) => (
              <Card 
                key={terminal.id} 
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedTerminal?.id === terminal.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTerminal(terminal)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{terminal.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(terminal.status)}
                      <Badge 
                        variant={terminal.status === 'online' ? "default" : "destructive"}
                        className={`${getStatusColor(terminal.status)} text-white`}
                      >
                        {terminal.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{terminal.location}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="font-medium">Vendas Hoje</p>
                      <p className="text-muted-foreground">{formatCurrency(terminal.metrics.dailySales)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Transações</p>
                      <p className="text-muted-foreground">{terminal.metrics.transactionsToday}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Hardware:</span>
                      <div className="flex space-x-1">
                        <Printer className={`h-3 w-3 ${
                          terminal.hardware.printers.some(p => p.status === 'online') 
                            ? 'text-green-600' : 'text-red-600'
                        }`} />
                        <CreditCard className={`h-3 w-3 ${
                          terminal.hardware.pinpads.some(p => p.status === 'online') 
                            ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Último heartbeat: {getTimeSince(terminal.lastHeartbeat)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-2">
            {alerts.filter(alert => !alert.resolved).map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.type === 'error' ? 'text-red-600' :
                        alert.type === 'warning' ? 'text-yellow-600' :
                        'text-orange-600'
                      }`} />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          Terminal: {terminals.find(t => t.id === alert.terminal_id)?.name} • 
                          {formatTime(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {alerts.filter(alert => !alert.resolved).length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-medium">Nenhum alerta ativo</p>
                  <p className="text-muted-foreground">Todos os sistemas estão funcionando normalmente</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedTerminal ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedTerminal.name} - Detalhes</CardTitle>
                <CardDescription>{selectedTerminal.location}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(selectedTerminal.status)}
                      <span className="capitalize">{selectedTerminal.status}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Versão</p>
                    <p className="text-muted-foreground">{selectedTerminal.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Uptime</p>
                    <p className="text-muted-foreground">{selectedTerminal.metrics.uptime}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Última Venda</p>
                    <p className="text-muted-foreground">{getTimeSince(selectedTerminal.metrics.lastSale)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Hardware Conectado</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium mb-2">Impressoras</p>
                      {selectedTerminal.hardware.printers.map((printer, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{printer.name}</span>
                          <Badge 
                            variant={printer.status === 'online' ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {printer.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Pinpads</p>
                      {selectedTerminal.hardware.pinpads.map((pinpad, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{pinpad.name}</span>
                          <Badge 
                            variant={pinpad.status === 'online' ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {pinpad.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Selecione um terminal</p>
                <p className="text-muted-foreground">Clique em um terminal para ver os detalhes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TerminalMonitoring;