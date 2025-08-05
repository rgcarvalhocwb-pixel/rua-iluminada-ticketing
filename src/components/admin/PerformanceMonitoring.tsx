import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Activity, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
  description: string;
}

interface ErrorLog {
  id: string;
  timestamp: Date;
  error: string;
  page: string;
  userAgent: string;
  userId?: string;
}

export const PerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    startMonitoring();
    collectInitialMetrics();
    
    return () => {
      setIsMonitoring(false);
    };
  }, []);

  const startMonitoring = () => {
    setIsMonitoring(true);
    
    // Monitor de erros JavaScript
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Monitor de performance a cada 30 segundos
    const interval = setInterval(collectPerformanceMetrics, 30000);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      clearInterval(interval);
    };
  };

  const handleError = (event: ErrorEvent) => {
    const errorLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      error: `${event.error?.name || 'Error'}: ${event.message}`,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
    };
    
    setErrorLogs(prev => [errorLog, ...prev.slice(0, 49)]); // Manter apenas 50 logs
    
    toast({
      title: "Erro detectado",
      description: event.message,
      variant: "destructive"
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const errorLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      error: `Unhandled Promise Rejection: ${event.reason}`,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
    };
    
    setErrorLogs(prev => [errorLog, ...prev.slice(0, 49)]);
  };

  const collectInitialMetrics = () => {
    // Web Vitals e métricas de performance
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const newMetrics: PerformanceMetric[] = [
        {
          name: 'Page Load Time',
          value: Math.round(navigation.loadEventEnd - navigation.fetchStart),
          unit: 'ms',
          status: navigation.loadEventEnd - navigation.fetchStart < 3000 ? 'good' : 'warning',
          description: 'Tempo total de carregamento da página'
        },
        {
          name: 'DOM Content Loaded',
          value: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
          unit: 'ms',
          status: navigation.domContentLoadedEventEnd - navigation.fetchStart < 1500 ? 'good' : 'warning',
          description: 'Tempo até o DOM estar pronto'
        },
        {
          name: 'First Paint',
          value: Math.round(navigation.responseStart - navigation.fetchStart),
          unit: 'ms',
          status: navigation.responseStart - navigation.fetchStart < 1000 ? 'good' : 'warning',
          description: 'Tempo até o primeiro pixel ser pintado'
        }
      ];

      setMetrics(newMetrics);
    }
  };

  const collectPerformanceMetrics = () => {
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      const memoryUsage = Math.round((memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100);
      
      setMetrics(prev => [
        ...prev.filter(m => m.name !== 'Memory Usage'),
        {
          name: 'Memory Usage',
          value: memoryUsage,
          unit: '%',
          status: memoryUsage < 70 ? 'good' : memoryUsage < 85 ? 'warning' : 'error',
          description: 'Uso de memória JavaScript'
        }
      ]);
    }

    // Verificar conexão de rede
    const connection = (navigator as any).connection;
    if (connection) {
      setMetrics(prev => [
        ...prev.filter(m => m.name !== 'Network Speed'),
        {
          name: 'Network Speed',
          value: connection.downlink,
          unit: 'Mbps',
          status: connection.downlink > 10 ? 'good' : connection.downlink > 1 ? 'warning' : 'error',
          description: 'Velocidade de conexão estimada'
        }
      ]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const clearErrorLogs = () => {
    setErrorLogs([]);
    toast({
      title: "Logs limpos",
      description: "Todos os logs de erro foram removidos"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Monitoramento de Performance</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={isMonitoring ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isMonitoring ? 'Ativo' : 'Inativo'}
          </Badge>
          <Button onClick={collectPerformanceMetrics} variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Atualizar Métricas
          </Button>
        </div>
      </div>

      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                  <p className="text-2xl font-bold">{metric.value}{metric.unit}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                </div>
                <div className={`p-2 rounded-full border ${getStatusColor(metric.status)}`}>
                  {getStatusIcon(metric.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logs de Erro */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Logs de Erro ({errorLogs.length})
            </CardTitle>
            {errorLogs.length > 0 && (
              <Button onClick={clearErrorLogs} variant="outline" size="sm">
                Limpar Logs
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {errorLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <p>Nenhum erro detectado!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {errorLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-red-800">{log.error}</p>
                      <p className="text-sm text-muted-foreground">Página: {log.page}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.timestamp.toLocaleTimeString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Compressão de Imagens</p>
                <p className="text-sm text-muted-foreground">
                  Configure compressão automática para reduzir tamanho das imagens
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Cache de Assets</p>
                <p className="text-sm text-muted-foreground">
                  Implemente cache do browser para assets estáticos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">CDN</p>
                <p className="text-sm text-muted-foreground">
                  Use CDN para distribuir conteúdo globalmente
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};