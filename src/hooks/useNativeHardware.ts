import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NativeDevice {
  id: string;
  name: string;
  type: 'printer' | 'pinpad' | 'serial' | 'usb' | 'bluetooth';
  status: 'connected' | 'disconnected';
  nativeObject?: any;
}

export const useNativeHardware = () => {
  const [devices, setDevices] = useState<NativeDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  // Detectar impressoras usando Web Print API
  const detectPrinters = useCallback(async () => {
    try {
      // Verificar se a API de impressão está disponível
      if ('getInstalledPrinters' in navigator) {
        // @ts-ignore - API experimental
        const printers = await navigator.getInstalledPrinters();
        return printers.map((printer: any, index: number) => ({
          id: `printer_${index}`,
          name: printer.name || `Impressora ${index + 1}`,
          type: 'printer' as const,
          status: 'connected' as const,
          nativeObject: printer
        }));
      }
      
      // Fallback: simular detecção de impressoras comuns
      return [
        {
          id: 'system_printer',
          name: 'Impressora do Sistema',
          type: 'printer' as const,
          status: 'connected' as const
        }
      ];
    } catch (error) {
      console.error('Erro ao detectar impressoras:', error);
      return [];
    }
  }, []);

  // Detectar dispositivos seriais (pinpads)
  const detectSerialDevices = useCallback(async () => {
    try {
      if (!('serial' in navigator)) {
        console.log('Web Serial API não suportada');
        return [];
      }

      // @ts-ignore - Web Serial API
      const ports = await navigator.serial.getPorts();
      return ports.map((port: any, index: number) => ({
        id: `serial_${index}`,
        name: `Dispositivo Serial ${index + 1}`,
        type: 'serial' as const,
        status: 'connected' as const,
        nativeObject: port
      }));
    } catch (error) {
      console.error('Erro ao detectar dispositivos seriais:', error);
      return [];
    }
  }, []);

  // Detectar dispositivos USB
  const detectUSBDevices = useCallback(async () => {
    try {
      if (!('usb' in navigator)) {
        console.log('Web USB API não suportada');
        return [];
      }

      // @ts-ignore - Web USB API
      const devices = await navigator.usb.getDevices();
      return devices.map((device: any, index: number) => ({
        id: `usb_${device.productId || index}`,
        name: device.productName || `Dispositivo USB ${index + 1}`,
        type: 'usb' as const,
        status: 'connected' as const,
        nativeObject: device
      }));
    } catch (error) {
      console.error('Erro ao detectar dispositivos USB:', error);
      return [];
    }
  }, []);

  // Detectar dispositivos Bluetooth
  const detectBluetoothDevices = useCallback(async () => {
    try {
      if (!('bluetooth' in navigator)) {
        console.log('Web Bluetooth API não suportada');
        return [];
      }

      // @ts-ignore - Web Bluetooth API
      const devices = await navigator.bluetooth.getDevices();
      return devices.map((device: any, index: number) => ({
        id: `bluetooth_${device.id || index}`,
        name: device.name || `Dispositivo Bluetooth ${index + 1}`,
        type: 'bluetooth' as const,
        status: device.gatt?.connected ? 'connected' : 'disconnected' as const,
        nativeObject: device
      }));
    } catch (error) {
      console.error('Erro ao detectar dispositivos Bluetooth:', error);
      return [];
    }
  }, []);

  // Escanear todos os dispositivos
  const scanAllDevices = useCallback(async () => {
    setIsScanning(true);
    try {
      const [printers, serialDevices, usbDevices, bluetoothDevices] = await Promise.all([
        detectPrinters(),
        detectSerialDevices(),
        detectUSBDevices(),
        detectBluetoothDevices()
      ]);

      const allDevices = [
        ...printers,
        ...serialDevices,
        ...usbDevices,
        ...bluetoothDevices
      ];

      setDevices(allDevices);
      
      toast({
        title: "Dispositivos detectados",
        description: `Encontrados ${allDevices.length} dispositivos`,
      });

      return allDevices;
    } catch (error) {
      console.error('Erro ao escanear dispositivos:', error);
      toast({
        title: "Erro na detecção",
        description: "Não foi possível detectar os dispositivos",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [detectPrinters, detectSerialDevices, detectUSBDevices, detectBluetoothDevices, toast]);

  // Solicitar acesso a dispositivo serial (pinpad)
  const requestSerialDevice = useCallback(async () => {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API não suportada neste navegador');
      }

      // @ts-ignore - Web Serial API
      const port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x0403 }, // FTDI
          { usbVendorId: 0x2341 }, // Arduino
          { usbVendorId: 0x1a86 }, // CH340
        ]
      });

      const newDevice: NativeDevice = {
        id: `serial_${Date.now()}`,
        name: 'Novo Dispositivo Serial',
        type: 'serial',
        status: 'connected',
        nativeObject: port
      };

      setDevices(prev => [...prev, newDevice]);
      
      toast({
        title: "Dispositivo conectado",
        description: "Dispositivo serial conectado com sucesso",
      });

      return newDevice;
    } catch (error: any) {
      console.error('Erro ao solicitar dispositivo serial:', error);
      toast({
        title: "Erro de conexão",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  // Solicitar acesso a dispositivo USB
  const requestUSBDevice = useCallback(async () => {
    try {
      if (!('usb' in navigator)) {
        throw new Error('Web USB API não suportada neste navegador');
      }

      // @ts-ignore - Web USB API
      const device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x067b }, // Prolific
          { vendorId: 0x1a86 }, // CH340
        ]
      });

      const newDevice: NativeDevice = {
        id: `usb_${device.productId}`,
        name: device.productName || 'Dispositivo USB',
        type: 'usb',
        status: 'connected',
        nativeObject: device
      };

      setDevices(prev => [...prev, newDevice]);
      
      toast({
        title: "Dispositivo conectado",
        description: "Dispositivo USB conectado com sucesso",
      });

      return newDevice;
    } catch (error: any) {
      console.error('Erro ao solicitar dispositivo USB:', error);
      toast({
        title: "Erro de conexão",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  // Imprimir usando API nativa
  const printNatively = useCallback(async (content: string, deviceId?: string) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Não foi possível abrir janela de impressão');
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Impressão de Ingresso</title>
            <style>
              body { font-family: monospace; margin: 0; padding: 20px; }
              .ticket { width: 80mm; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="ticket">${content}</div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
      printWindow.close();

      toast({
        title: "Impressão enviada",
        description: "Documento enviado para impressão",
      });

      return true;
    } catch (error: any) {
      console.error('Erro na impressão:', error);
      toast({
        title: "Erro na impressão",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Detectar dispositivos automaticamente no carregamento
  useEffect(() => {
    scanAllDevices();
  }, [scanAllDevices]);

  // Monitorar mudanças de dispositivos
  useEffect(() => {
    const handleConnect = () => scanAllDevices();
    const handleDisconnect = () => scanAllDevices();

    if ('serial' in navigator) {
      // @ts-ignore
      navigator.serial.addEventListener('connect', handleConnect);
      // @ts-ignore
      navigator.serial.addEventListener('disconnect', handleDisconnect);
    }

    if ('usb' in navigator) {
      // @ts-ignore
      navigator.usb.addEventListener('connect', handleConnect);
      // @ts-ignore
      navigator.usb.addEventListener('disconnect', handleDisconnect);
    }

    return () => {
      if ('serial' in navigator) {
        // @ts-ignore
        navigator.serial.removeEventListener('connect', handleConnect);
        // @ts-ignore
        navigator.serial.removeEventListener('disconnect', handleDisconnect);
      }

      if ('usb' in navigator) {
        // @ts-ignore
        navigator.usb.removeEventListener('connect', handleConnect);
        // @ts-ignore
        navigator.usb.removeEventListener('disconnect', handleDisconnect);
      }
    };
  }, [scanAllDevices]);

  return {
    devices,
    isScanning,
    scanAllDevices,
    requestSerialDevice,
    requestUSBDevice,
    printNatively,
    // Filtros por tipo
    printers: devices.filter(d => d.type === 'printer'),
    serialDevices: devices.filter(d => d.type === 'serial'),
    usbDevices: devices.filter(d => d.type === 'usb'),
    bluetoothDevices: devices.filter(d => d.type === 'bluetooth'),
    // Status helpers
    isAnyPrinterConnected: devices.some(d => d.type === 'printer' && d.status === 'connected'),
    isAnySerialConnected: devices.some(d => d.type === 'serial' && d.status === 'connected'),
  };
};