import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wifi, WifiOff, Printer, CreditCard, RefreshCw, AlertTriangle, CheckCircle, DoorOpen } from 'lucide-react';
import { useTerminalHardware, type HardwareDevice } from '@/hooks/useTerminalHardware';

interface TerminalStatusBarProps {
  terminalId?: string;
  compact?: boolean;
}

export const TerminalStatusBar = ({ terminalId = 'terminal-001', compact = false }: TerminalStatusBarProps) => {
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const { 
    hardwareStatus, 
    checkHardwareStatus, 
    getPrinters, 
    getPinpads,
    getTurnstiles,
    isAnyPrinterOnline,
    isAnyPinpadOnline,
    isAnyTurnstileOnline
  } = useTerminalHardware(terminalId);

  // Monitorar status da rede
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'error': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (device: HardwareDevice) => {
    if (device.type === 'printer') {
      return <Printer className="h-4 w-4" />;
    }
    if (device.type === 'turnstile') {
      return <DoorOpen className="h-4 w-4" />;
    }
    return <CreditCard className="h-4 w-4" />;
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
        {/* Status da Rede */}
        <div className="flex items-center space-x-1">
          {networkStatus === 'online' ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <span className="text-xs font-medium">
            {networkStatus === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Status das Impressoras */}
        <div className="flex items-center space-x-1">
          <Printer className="h-4 w-4" />
          <Badge 
            variant={isAnyPrinterOnline() ? "default" : "destructive"}
            className="text-xs px-1 py-0"
          >
            {getPrinters().filter(p => p.status === 'online').length}/{getPrinters().length}
          </Badge>
        </div>

        {/* Status dos Pinpads */}
        <div className="flex items-center space-x-1">
          <CreditCard className="h-4 w-4" />
          <Badge 
            variant={isAnyPinpadOnline() ? "default" : "destructive"}
            className="text-xs px-1 py-0"
          >
            {getPinpads().filter(p => p.status === 'online').length}/{getPinpads().length}
          </Badge>
        </div>

        {/* Status das Catracas */}
        <div className="flex items-center space-x-1">
          <DoorOpen className="h-4 w-4" />
          <Badge 
            variant={isAnyTurnstileOnline() ? "default" : "destructive"}
            className="text-xs px-1 py-0"
          >
            {getTurnstiles().filter(t => t.status === 'online').length}/{getTurnstiles().length}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => checkHardwareStatus()}
          disabled={hardwareStatus.isLoading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${hardwareStatus.isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Status do Terminal</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => checkHardwareStatus()}
          disabled={hardwareStatus.isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${hardwareStatus.isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="space-y-4">
        {/* Status da Rede */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {networkStatus === 'online' ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">Conexão de Rede</p>
              <p className="text-sm text-muted-foreground">
                {networkStatus === 'online' ? 'Conectado à internet' : 'Sem conexão'}
              </p>
            </div>
          </div>
          <Badge variant={networkStatus === 'online' ? "default" : "destructive"}>
            {networkStatus === 'online' ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Status dos Dispositivos */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">DISPOSITIVOS CONECTADOS</h4>
          
          {hardwareStatus.devices.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhum dispositivo detectado</p>
            </div>
          ) : (
            hardwareStatus.devices.map(device => (
              <div 
                key={device.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(device)}
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {device.type === 'printer' ? 'Impressora' : 
                       device.type === 'pinpad' ? 'Pinpad' : 'Catraca'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {device.status === 'online' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <Badge 
                    variant={device.status === 'online' ? "default" : "destructive"}
                    className={`${getStatusColor(device.status)} text-white`}
                  >
                    {device.status === 'online' ? 'Online' : 
                     device.status === 'offline' ? 'Offline' : 'Erro'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Informações Adicionais */}
        {hardwareStatus.lastUpdate && (
          <div className="text-sm text-muted-foreground text-center pt-2 border-t">
            Última verificação: {new Date(hardwareStatus.lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>
    </Card>
  );
};