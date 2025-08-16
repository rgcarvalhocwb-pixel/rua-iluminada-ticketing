import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HardwareDevice {
  id: string;
  name: string;
  type: 'printer' | 'pinpad';
  status: 'online' | 'offline' | 'error';
  lastChecked: string;
  details?: any;
}

export interface HardwareStatus {
  devices: HardwareDevice[];
  isLoading: boolean;
  lastUpdate: string | null;
}

export const useTerminalHardware = (terminalId: string = 'terminal-001') => {
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus>({
    devices: [],
    isLoading: false,
    lastUpdate: null
  });
  const { toast } = useToast();

  const checkHardwareStatus = useCallback(async (hardwareType: 'printer' | 'pinpad' | 'all' = 'all') => {
    try {
      setHardwareStatus(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.functions.invoke('terminal-hardware-status', {
        body: {
          terminalId,
          hardwareType
        }
      });

      if (error) throw error;

      if (data.success) {
        setHardwareStatus({
          devices: data.devices,
          isLoading: false,
          lastUpdate: data.timestamp
        });

        // Verificar se há dispositivos offline
        const offlineDevices = data.devices.filter((device: HardwareDevice) => device.status === 'offline');
        if (offlineDevices.length > 0) {
          toast({
            title: "Dispositivos Offline",
            description: `${offlineDevices.length} dispositivo(s) não estão respondendo`,
            variant: "destructive",
          });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Erro ao verificar hardware:', error);
      toast({
        title: "Erro na verificação de hardware",
        description: error.message,
        variant: "destructive",
      });
      setHardwareStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [terminalId, toast]);

  const printTickets = useCallback(async (ticketIds: string[], options?: {
    printerId?: string;
    copies?: number;
    template?: 'standard' | 'receipt';
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('terminal-print-ticket', {
        body: {
          ticketIds,
          printerId: options?.printerId,
          copies: options?.copies || 1,
          template: options?.template || 'standard'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Impressão concluída",
          description: `${data.printedTickets} ingresso(s) impresso(s) com sucesso`,
        });
        return data;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Erro na impressão:', error);
      toast({
        title: "Erro na impressão",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const processPayment = useCallback(async (paymentData: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerCPF: string;
    description: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('terminal-payment', {
        body: paymentData
      });

      if (error) throw error;

      if (data.success) {
        return {
          paymentUrl: data.paymentUrl,
          paymentCode: data.paymentCode,
          orderId: data.orderId
        };
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      throw error;
    }
  }, []);

  // Verificação automática de hardware a cada 5 minutos
  useEffect(() => {
    checkHardwareStatus();
    const interval = setInterval(() => {
      checkHardwareStatus();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [checkHardwareStatus]);

  return {
    hardwareStatus,
    checkHardwareStatus,
    printTickets,
    processPayment,
    // Helpers para verificar status específicos
    getPrinters: () => hardwareStatus.devices.filter(d => d.type === 'printer'),
    getPinpads: () => hardwareStatus.devices.filter(d => d.type === 'pinpad'),
    getOnlineDevices: () => hardwareStatus.devices.filter(d => d.status === 'online'),
    getOfflineDevices: () => hardwareStatus.devices.filter(d => d.status === 'offline'),
    isAnyPrinterOnline: () => hardwareStatus.devices.some(d => d.type === 'printer' && d.status === 'online'),
    isAnyPinpadOnline: () => hardwareStatus.devices.some(d => d.type === 'pinpad' && d.status === 'online')
  };
};