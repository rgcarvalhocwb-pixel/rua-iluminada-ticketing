import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  type: 'new_order' | 'user_pending' | 'low_stock' | 'system_alert';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const connectWebSocket = () => {
    try {
      // Use the full URL to the Supabase edge function
      const wsUrl = 'wss://tzqriohyfazftfulwcuj.functions.supabase.co/realtime-notifications';
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to realtime notifications');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('Notification service connected:', data.message);
            return;
          }

          // Add notification to list
          const notification: NotificationData = {
            type: data.type,
            title: data.title || getDefaultTitle(data.type),
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            data: data.data
          };

          setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50

          // Show toast notification
          toast({
            title: notification.title,
            description: notification.message,
            duration: 5000,
          });

          // Browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }

        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Disconnected from realtime notifications');
        setIsConnected(false);
        
        // Reconnect after 5 seconds
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect to notifications:', error);
      setIsConnected(false);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const sendNotification = (notification: Omit<NotificationData, 'timestamp'>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'broadcast',
        notification: {
          ...notification,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (timestamp: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.timestamp === timestamp 
          ? { ...notif, read: true } 
          : notif
      )
    );
  };

  return {
    notifications,
    isConnected,
    sendNotification,
    clearNotifications,
    markAsRead,
    requestNotificationPermission
  };
};

const getDefaultTitle = (type: string): string => {
  switch (type) {
    case 'new_order': return '🛒 Novo Pedido';
    case 'user_pending': return '👤 Usuário Pendente';
    case 'low_stock': return '📦 Estoque Baixo';
    case 'system_alert': return '⚠️ Alerta do Sistema';
    default: return '🔔 Notificação';
  }
};