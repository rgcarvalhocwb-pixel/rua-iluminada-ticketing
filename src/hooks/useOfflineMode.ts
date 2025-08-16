import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineTransaction {
  id: string;
  timestamp: string;
  type: 'sale' | 'config_change' | 'hardware_status';
  data: any;
  synced: boolean;
  retryCount: number;
}

interface OfflineCache {
  events: any[];
  ticketTypes: any[];
  terminalConfig: any;
  lastSync: string;
}

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineTransaction[]>([]);
  const [cachedData, setCachedData] = useState<OfflineCache | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const { toast } = useToast();

  // Monitorar status da conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conexão restaurada",
        description: "Sincronizando dados pendentes...",
      });
      syncPendingTransactions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Modo offline ativado",
        description: "As operações serão armazenadas localmente",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar dados do cache local
  useEffect(() => {
    loadCachedData();
    loadOfflineQueue();
  }, []);

  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem('terminal_cache');
      if (cached) {
        setCachedData(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Erro ao carregar cache local:', error);
    }
  };

  const loadOfflineQueue = () => {
    try {
      const queue = localStorage.getItem('offline_queue');
      if (queue) {
        setOfflineQueue(JSON.parse(queue));
      }
    } catch (error) {
      console.error('Erro ao carregar fila offline:', error);
    }
  };

  const updateCache = useCallback((data: Partial<OfflineCache>) => {
    const newCache = { ...cachedData, ...data, lastSync: new Date().toISOString() };
    setCachedData(newCache);
    localStorage.setItem('terminal_cache', JSON.stringify(newCache));
  }, [cachedData]);

  const addToOfflineQueue = useCallback((transaction: Omit<OfflineTransaction, 'id' | 'synced' | 'retryCount'>) => {
    const newTransaction: OfflineTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
      synced: false,
      retryCount: 0
    };

    const newQueue = [...offlineQueue, newTransaction];
    setOfflineQueue(newQueue);
    localStorage.setItem('offline_queue', JSON.stringify(newQueue));

    console.log('Transação adicionada à fila offline:', newTransaction.id);
  }, [offlineQueue]);

  const syncPendingTransactions = useCallback(async () => {
    if (syncInProgress || !isOnline || offlineQueue.length === 0) {
      return;
    }

    setSyncInProgress(true);
    console.log(`Iniciando sincronização de ${offlineQueue.length} transações`);

    const updatedQueue = [...offlineQueue];
    let syncedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < updatedQueue.length; i++) {
      const transaction = updatedQueue[i];
      
      if (transaction.synced) continue;

      try {
        await syncSingleTransaction(transaction);
        updatedQueue[i] = { ...transaction, synced: true };
        syncedCount++;
      } catch (error) {
        console.error(`Erro ao sincronizar transação ${transaction.id}:`, error);
        updatedQueue[i] = { 
          ...transaction, 
          retryCount: transaction.retryCount + 1 
        };
        failedCount++;

        // Remover transações com muitas tentativas
        if (transaction.retryCount >= 5) {
          console.warn(`Removendo transação ${transaction.id} após 5 tentativas`);
          updatedQueue.splice(i, 1);
          i--;
        }
      }
    }

    // Remover transações sincronizadas
    const finalQueue = updatedQueue.filter(t => !t.synced);
    setOfflineQueue(finalQueue);
    localStorage.setItem('offline_queue', JSON.stringify(finalQueue));

    setSyncInProgress(false);

    if (syncedCount > 0 || failedCount > 0) {
      toast({
        title: "Sincronização concluída",
        description: `${syncedCount} transações sincronizadas, ${failedCount} falharam`,
        variant: failedCount > 0 ? "destructive" : "default"
      });
    }

    console.log(`Sincronização concluída: ${syncedCount} sucesso, ${failedCount} falhas`);
  }, [syncInProgress, isOnline, offlineQueue]);

  const syncSingleTransaction = async (transaction: OfflineTransaction) => {
    // Simular sincronização com API
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (transaction.type) {
      case 'sale':
        console.log('Sincronizando venda offline:', transaction.data);
        // Aqui faria a chamada real para API de vendas
        break;
      case 'config_change':
        console.log('Sincronizando mudança de config:', transaction.data);
        // Aqui faria a chamada real para API de configuração
        break;
      case 'hardware_status':
        console.log('Sincronizando status de hardware:', transaction.data);
        // Aqui faria a chamada real para API de status
        break;
    }
  };

  const executeOfflineOperation = useCallback(async (
    operation: () => Promise<any>,
    fallbackData: any,
    transactionType: OfflineTransaction['type']
  ) => {
    if (isOnline) {
      try {
        return await operation();
      } catch (error) {
        // Se falhou online, adicionar à fila offline
        addToOfflineQueue({
          timestamp: new Date().toISOString(),
          type: transactionType,
          data: fallbackData
        });
        throw error;
      }
    } else {
      // Modo offline - adicionar à fila
      addToOfflineQueue({
        timestamp: new Date().toISOString(),
        type: transactionType,
        data: fallbackData
      });
      
      // Retornar dados simulados para continuar operação
      return { success: true, offline: true, data: fallbackData };
    }
  }, [isOnline, addToOfflineQueue]);

  const getCachedEvents = useCallback(() => {
    return cachedData?.events || [];
  }, [cachedData]);

  const getCachedTicketTypes = useCallback(() => {
    return cachedData?.ticketTypes || [];
  }, [cachedData]);

  const getCachedTerminalConfig = useCallback(() => {
    return cachedData?.terminalConfig || null;
  }, [cachedData]);

  const clearCache = useCallback(() => {
    localStorage.removeItem('terminal_cache');
    localStorage.removeItem('offline_queue');
    setCachedData(null);
    setOfflineQueue([]);
    toast({
      title: "Cache limpo",
      description: "Todos os dados locais foram removidos"
    });
  }, []);

  const getOfflineStats = useCallback(() => {
    return {
      isOnline,
      queueSize: offlineQueue.length,
      pendingTransactions: offlineQueue.filter(t => !t.synced).length,
      failedTransactions: offlineQueue.filter(t => t.retryCount > 0).length,
      lastSync: cachedData?.lastSync || null,
      syncInProgress,
      cacheSize: cachedData ? JSON.stringify(cachedData).length : 0
    };
  }, [isOnline, offlineQueue, cachedData, syncInProgress]);

  return {
    isOnline,
    offlineQueue,
    cachedData,
    syncInProgress,
    updateCache,
    executeOfflineOperation,
    syncPendingTransactions,
    getCachedEvents,
    getCachedTicketTypes,
    getCachedTerminalConfig,
    clearCache,
    getOfflineStats,
    addToOfflineQueue
  };
};