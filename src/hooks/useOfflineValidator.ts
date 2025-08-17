import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OfflineTicket {
  id: string;
  ticket_number: string;
  qr_code: string;
  status: 'valid' | 'used';
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  event_name: string;
  session_date: string;
  ticket_type: string;
  unit_price: number;
  used_at?: string;
  validated_by?: string;
  last_synced: string;
  needs_sync?: boolean;
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  totalTickets: number;
  pendingSync: number;
}

const CACHE_KEY = 'validator_offline_tickets';
const SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutos

export const useOfflineValidator = () => {
  const [tickets, setTickets] = useState<OfflineTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<OfflineTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    totalTickets: 0,
    pendingSync: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Obter data atual no formato brasileiro
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Salvar no cache local
  const saveToCache = useCallback((ticketsData: OfflineTicket[]) => {
    try {
      const cacheData = {
        tickets: ticketsData,
        lastUpdate: new Date().toISOString(),
        date: getCurrentDate()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  }, []);

  // Carregar do cache local
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const currentDate = getCurrentDate();
        
        // Só usar cache se for do dia atual
        if (cacheData.date === currentDate) {
          setTickets(cacheData.tickets || []);
          return cacheData.tickets || [];
        } else {
          // Limpar cache antigo
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
    }
    return [];
  }, []);

  // Sincronizar com o servidor
  const syncWithServer = useCallback(async (showToast = false) => {
    if (!navigator.onLine) {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      return;
    }

    setIsLoading(true);
    
    try {
      const currentDate = getCurrentDate();
      
      // Buscar ingressos do dia atual
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          ticket_number,
          qr_code,
          status,
          used_at,
          validated_by,
          order_items!inner(
            orders!inner(
              customer_name,
              customer_email,
              customer_cpf,
              session_id,
              event_sessions!inner(
                session_date,
                events!inner(name)
              )
            ),
            ticket_types!inner(name),
            unit_price
          )
        `)
        .eq('order_items.orders.event_sessions.session_date', currentDate)
        .in('order_items.orders.payment_status', ['paid']);

      if (error) {
        throw error;
      }

      const formattedTickets: OfflineTicket[] = data?.map((ticket: any) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        qr_code: ticket.qr_code,
        status: ticket.status,
        customer_name: ticket.order_items.orders.customer_name,
        customer_email: ticket.order_items.orders.customer_email,
        customer_cpf: ticket.order_items.orders.customer_cpf,
        event_name: ticket.order_items.orders.event_sessions.events.name,
        session_date: ticket.order_items.orders.event_sessions.session_date,
        ticket_type: ticket.order_items.ticket_types.name,
        unit_price: ticket.order_items.unit_price,
        used_at: ticket.used_at,
        validated_by: ticket.validated_by,
        last_synced: new Date().toISOString(),
        needs_sync: false
      })) || [];

      // Mesclar com dados locais (manter validações offline)
      const cachedTickets = loadFromCache();
      const mergedTickets = formattedTickets.map(serverTicket => {
        const cachedTicket = cachedTickets.find(t => t.id === serverTicket.id);
        if (cachedTicket && cachedTicket.needs_sync) {
          // Manter dados locais se precisar sincronizar
          return cachedTicket;
        }
        return serverTicket;
      });

      setTickets(mergedTickets);
      saveToCache(mergedTickets);

      const pendingCount = mergedTickets.filter(t => t.needs_sync).length;
      
      setSyncStatus({
        isOnline: true,
        lastSync: new Date(),
        totalTickets: mergedTickets.length,
        pendingSync: pendingCount
      });

      if (showToast) {
        toast({
          title: "Sincronização Concluída",
          description: `${mergedTickets.length} ingressos atualizados para hoje`,
        });
      }

      // Sincronizar validações pendentes
      if (pendingCount > 0) {
        await syncPendingValidations(mergedTickets);
      }

    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      
      if (showToast) {
        toast({
          title: "Erro na Sincronização",
          description: "Usando dados offline disponíveis",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast, loadFromCache, saveToCache]);

  // Sincronizar validações pendentes
  const syncPendingValidations = async (ticketsList: OfflineTicket[]) => {
    const pendingTickets = ticketsList.filter(t => t.needs_sync);
    
    for (const ticket of pendingTickets) {
      try {
        // Atualizar no servidor
        const { error } = await supabase
          .from('tickets')
          .update({
            status: 'used',
            used_at: ticket.used_at,
            validated_by: ticket.validated_by
          })
          .eq('id', ticket.id);

        if (!error) {
          // Marcar como sincronizado
          ticket.needs_sync = false;
          ticket.last_synced = new Date().toISOString();
        }
      } catch (error) {
        console.error('Erro ao sincronizar validação:', error);
      }
    }

    // Atualizar cache
    const updatedTickets = ticketsList.map(t => ({
      ...t,
      needs_sync: t.needs_sync || false
    }));
    
    setTickets(updatedTickets);
    saveToCache(updatedTickets);
  };

  // Validar ingresso (offline-first)
  const validateTicket = useCallback(async (code: string): Promise<{
    success: boolean;
    message: string;
    ticket?: OfflineTicket;
  }> => {
    try {
      // Buscar no cache local primeiro
      const ticket = tickets.find(t => 
        t.qr_code === code || t.ticket_number === code
      );

      if (!ticket) {
        return {
          success: false,
          message: "Ingresso não encontrado na base de hoje"
        };
      }

      if (ticket.status === 'used') {
        return {
          success: false,
          message: "Ingresso já foi utilizado"
        };
      }

      // Marcar como usado localmente
      const validatedTicket: OfflineTicket = {
        ...ticket,
        status: 'used',
        used_at: new Date().toISOString(),
        validated_by: 'mobile_validator',
        needs_sync: !navigator.onLine // Marcar para sync se offline
      };

      // Atualizar localmente
      const updatedTickets = tickets.map(t => 
        t.id === ticket.id ? validatedTicket : t
      );

      setTickets(updatedTickets);
      saveToCache(updatedTickets);

      // Tentar sincronizar imediatamente se online
      if (navigator.onLine) {
        try {
          const { error } = await supabase
            .from('tickets')
            .update({
              status: 'used',
              used_at: validatedTicket.used_at,
              validated_by: validatedTicket.validated_by
            })
            .eq('id', ticket.id);

          if (!error) {
            validatedTicket.needs_sync = false;
            validatedTicket.last_synced = new Date().toISOString();
          }
        } catch (error) {
          console.warn('Validação salva offline, será sincronizada depois');
        }
      }

      return {
        success: true,
        message: "Ingresso validado com sucesso!",
        ticket: validatedTicket
      };

    } catch (error) {
      console.error('Erro na validação:', error);
      return {
        success: false,
        message: "Erro interno na validação"
      };
    }
  }, [tickets, saveToCache]);

  // Filtrar ingressos por busca
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTickets(tickets);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tickets.filter(ticket => 
      ticket.customer_name.toLowerCase().includes(query) ||
      ticket.customer_email.toLowerCase().includes(query) ||
      ticket.customer_cpf.includes(query) ||
      ticket.ticket_number.toLowerCase().includes(query)
    );

    setFilteredTickets(filtered);
  }, [tickets, searchQuery]);

  // Monitorar conectividade
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      syncWithServer();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncWithServer]);

  // Sincronização automática
  useEffect(() => {
    // Carregar cache ao inicializar
    loadFromCache();
    
    // Sincronização inicial
    syncWithServer();

    // Configurar sincronização automática
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        syncWithServer();
      }
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncWithServer, loadFromCache]);

  // Forçar sincronização manual
  const forcSync = () => {
    syncWithServer(true);
  };

  return {
    tickets: filteredTickets,
    searchQuery,
    setSearchQuery,
    syncStatus,
    isLoading,
    validateTicket,
    forcSync,
    getCurrentDate
  };
};