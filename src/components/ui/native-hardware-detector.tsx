import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNativeHardware } from '@/hooks/useNativeHardware';
import { 
  Printer, 
  Usb, 
  Bluetooth, 
  Wifi, 
  RefreshCw, 
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const NativeHardwareDetector = () => {
  const {
    devices,
    isScanning,
    scanAllDevices,
    requestSerialDevice,
    requestUSBDevice,
    printNatively,
    printers,
    serialDevices,
    usbDevices,
    bluetoothDevices,
    isAnyPrinterConnected,
    isAnySerialConnected
  } = useNativeHardware();

  const [testPrinting, setTestPrinting] = useState(false);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'printer': return <Printer className="h-4 w-4" />;
      case 'usb': return <Usb className="h-4 w-4" />;
      case 'bluetooth': return <Bluetooth className="h-4 w-4" />;
      case 'serial': return <Wifi className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'connected' ? 'default' : 'secondary';
  };

  const handleTestPrint = async () => {
    setTestPrinting(true);
    const testContent = `
      <div style="text-align: center;">
        <h2>TESTE DE IMPRESSÃO</h2>
        <p>Rua Iluminada - Sistema de Ingressos</p>
        <p>Data: ${new Date().toLocaleString()}</p>
        <hr>
        <p>Impressora: Sistema Nativo</p>
        <p>Status: Conectada</p>
        <hr>
        <p>Este é um teste de impressão usando</p>
        <p>a API nativa do navegador</p>
      </div>
    `;
    
    await printNatively(testContent);
    setTestPrinting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Detecção Nativa de Equipamentos
            </CardTitle>
            <Button
              onClick={scanAllDevices}
              disabled={isScanning}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Detectando...' : 'Detectar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Este sistema utiliza APIs nativas do navegador (Web Serial, Web USB, Web Bluetooth) 
            para detectar equipamentos automaticamente, sem necessidade de drivers ou software adicional.
          </div>

          <Separator />

          {/* Resumo de Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="font-semibold">{printers.length}</div>
              <div className="text-sm text-muted-foreground">Impressoras</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{serialDevices.length}</div>
              <div className="text-sm text-muted-foreground">Dispositivos Seriais</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{usbDevices.length}</div>
              <div className="text-sm text-muted-foreground">Dispositivos USB</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{bluetoothDevices.length}</div>
              <div className="text-sm text-muted-foreground">Dispositivos Bluetooth</div>
            </div>
          </div>

          <Separator />

          {/* Lista de Dispositivos */}
          <div className="space-y-3">
            <h4 className="font-medium">Dispositivos Detectados</h4>
            {devices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhum dispositivo detectado</p>
                <p className="text-sm">Clique em "Detectar" ou conecte um dispositivo</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.type)}
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {device.type}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(device.status)}>
                      {device.status === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Ações Rápidas */}
          <div className="space-y-3">
            <h4 className="font-medium">Ações</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={requestSerialDevice}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Conectar Pinpad (Serial)
              </Button>
              <Button
                onClick={requestUSBDevice}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Conectar USB
              </Button>
              {isAnyPrinterConnected && (
                <Button
                  onClick={handleTestPrint}
                  disabled={testPrinting}
                  variant="outline"
                  size="sm"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {testPrinting ? 'Imprimindo...' : 'Teste de Impressão'}
                </Button>
              )}
            </div>
          </div>

          {/* Informações de Compatibilidade */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Compatibilidade do Navegador</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${'serial' in navigator ? 'bg-green-500' : 'bg-red-500'}`} />
                Web Serial API {('serial' in navigator) ? '✓' : '✗'}
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${'usb' in navigator ? 'bg-green-500' : 'bg-red-500'}`} />
                Web USB API {('usb' in navigator) ? '✓' : '✗'}
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${'bluetooth' in navigator ? 'bg-green-500' : 'bg-red-500'}`} />
                Web Bluetooth API {('bluetooth' in navigator) ? '✓' : '✗'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Recomenda-se Chrome/Edge para melhor compatibilidade. HTTPS é obrigatório para essas APIs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};