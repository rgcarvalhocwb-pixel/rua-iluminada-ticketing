import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HardwareDevice {
  id: string;
  name: string;
  type: 'printer' | 'pinpad' | 'turnstile';
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

  const checkHardwareStatus = useCallback(async (hardwareType: 'printer' | 'pinpad' | 'turnstile' | 'all' = 'all') => {
    try {
      setHardwareStatus(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.functions.invoke('terminal-hardware-status', {
        body: {
          terminalId,
          hardwareType
        }
      });

      if (error) {
        // FALLBACK: Buscar último status do banco de dados
        console.log('Edge function falhou, buscando dados em cache...');
        const { data: lastStatus } = await supabase
          .from('terminal_heartbeats')
          .select('hardware_status')
          .eq('terminal_id', terminalId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (lastStatus?.hardware_status) {
          const hardwareStatus = lastStatus.hardware_status as any;
          const allDevices = [
            ...(hardwareStatus.printers || []),
            ...(hardwareStatus.pinpads || []),
            ...(hardwareStatus.turnstiles || [])
          ];
          
          setHardwareStatus({
            devices: allDevices,
            isLoading: false,
            lastUpdate: new Date().toISOString()
          });
          
          toast({
            title: "Modo Cache",
            description: "Usando dados em cache. Hardware pode estar desatualizado.",
            variant: "default",
          });
          return;
        }
        
        throw error;
      }

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
        title: "Erro de Hardware",
        description: "Não foi possível detectar hardware. Verifique conexões.",
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

  const validateTicketOnTurnstile = useCallback(async (turnstileId: string, options: {
    qrCode?: string;
    ticketNumber?: string;
    cardData?: string;
    validatorUser: string;
    isTerminalCheckIn?: boolean;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('turnstile-qr-validation', {
        body: {
          turnstileId,
          qrCode: options.qrCode,
          ticketNumber: options.ticketNumber,
          cardData: options.cardData,
          validatorUser: options.validatorUser,
          isTerminalCheckIn: options.isTerminalCheckIn
        }
      });

      if (error) throw error;

      if (data.success) {
        const actionType = options.isTerminalCheckIn ? "Check-in realizado" : "Acesso liberado";
        toast({
          title: actionType,
          description: `${options.isTerminalCheckIn ? 'Check-in' : 'Ticket validado'} para ${data.ticketInfo?.customerName}`,
        });
        return data;
      } else {
        const errorTitle = options.isTerminalCheckIn ? "Erro no check-in" : "Acesso negado";
        toast({
          title: errorTitle,
          description: data.error,
          variant: "destructive",
        });
        return data;
      }
    } catch (error: any) {
      console.error('Erro na validação da catraca:', error);
      toast({
        title: "Erro na validação",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

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
    validateTicketOnTurnstile,
    // Helpers para verificar status específicos
    getPrinters: () => hardwareStatus.devices.filter(d => d.type === 'printer'),
    getPinpads: () => hardwareStatus.devices.filter(d => d.type === 'pinpad'),
    getTurnstiles: () => hardwareStatus.devices.filter(d => d.type === 'turnstile'),
    getOnlineDevices: () => hardwareStatus.devices.filter(d => d.status === 'online'),
    getOfflineDevices: () => hardwareStatus.devices.filter(d => d.status === 'offline'),
    isAnyPrinterOnline: () => hardwareStatus.devices.some(d => d.type === 'printer' && d.status === 'online'),
    isAnyPinpadOnline: () => hardwareStatus.devices.some(d => d.type === 'pinpad' && d.status === 'online'),
    isAnyTurnstileOnline: () => hardwareStatus.devices.some(d => d.type === 'turnstile' && d.status === 'online')
  };
};