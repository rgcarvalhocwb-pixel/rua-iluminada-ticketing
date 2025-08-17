import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Bell, 
  Wifi, 
  WifiOff, 
  Battery, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Users,
  QrCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Mobile-specific imports (optional - will be available when running on mobile)
declare const CapacitorApp: any;
declare const PushNotifications: any;

interface MobileNotification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

interface SystemStatus {
  terminals: {
    online: number;
    total: number;
  };
  sales: {
    today: number;
    trend: 'up' | 'down' | 'stable';
  };
  alerts: {
    critical: number;
    warnings: number;
  };
  network: {
    connected: boolean;
    strength: number;
  };
}

const MobileManager = () => {
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    terminals: { online: 2, total: 3 },
    sales: { today: 4300.00, trend: 'up' },
    alerts: { critical: 1, warnings: 2 },
    network: { connected: true, strength: 85 }
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pushEnabled, setPushEnabled] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize mobile app
  useEffect(() => {
    const initializeMobileApp = async () => {
      try {
        // Check if running on mobile device
        if (typeof PushNotifications !== 'undefined') {
          // Setup push notifications
          const permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
            setPushEnabled(true);
          }

          // Listen for push notifications
          PushNotifications.addListener('registration', (token: any) => {
            console.log('Push registration success:', token.value);
          });

          PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
            const newNotification: MobileNotification = {
              id: Date.now().toString(),
              title: notification.title || 'Notificação',
              body: notification.body || '',
              type: 'info',
              timestamp: new Date(),
              read: false
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            
            toast({
              title: newNotification.title,
              description: newNotification.body,
            });
          });
        }

        // Handle app state changes (if available)
        if (typeof CapacitorApp !== 'undefined') {
          CapacitorApp.addListener('appStateChange', ({ isActive }: any) => {
            if (isActive) {
              // App became active, refresh data
              refreshSystemStatus();
            }
          });
        }

      } catch (error) {
        console.error('Mobile initialization error:', error);
      }
    };

    initializeMobileApp();

    // Network status monitoring
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Refresh system status
  const refreshSystemStatus = async () => {
    try {
      // Simulate API call - replace with real data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock updated data
      setSystemStatus(prev => ({
        ...prev,
        sales: {
          today: prev.sales.today + Math.random() * 100,
          trend: Math.random() > 0.5 ? 'up' : 'down'
        },
        network: {
          connected: isOnline,
          strength: Math.floor(Math.random() * 40) + 60
        }
      }));

      toast({
        title: "Status atualizado",
        description: "Dados do sistema foram atualizados",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados",
        variant: "destructive",
      });
    }
  };

  // Request push notification permissions
  const requestNotificationPermission = async () => {
    try {
      if (typeof PushNotifications !== 'undefined') {
        const permStatus = await PushNotifications.requestPermissions();
        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
          setPushEnabled(true);
          toast({
            title: "Notificações ativadas",
            description: "Você receberá alertas importantes",
          });
        } else {
          toast({
            title: "Permissão negada",
            description: "Não foi possível ativar as notificações",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Não disponível",
          description: "Execute no dispositivo móvel para ativar notificações",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rua Iluminada Mobile</h1>
          <p className="text-muted-foreground">Gestão em movimento</p>
        </div>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600" />
          )}
          <Battery className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Network Status Alert */}
      {!isOnline && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sem conexão com a internet. Dados podem estar desatualizados.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Terminais</p>
                <p className="text-2xl font-bold">
                  {systemStatus.terminals.online}/{systemStatus.terminals.total}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                <p className="text-2xl font-bold">
                  R$ {systemStatus.sales.today.toFixed(0)}
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${
                systemStatus.sales.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validador de Ingressos */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Button 
            onClick={() => navigate('/mobile/validator')}
            className="w-full h-16 text-lg"
            size="lg"
          >
            <QrCode className="h-6 w-6 mr-3" />
            Validador de Ingressos
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            Alertas
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Status do Sistema</h3>
            <Button variant="outline" size="sm" onClick={refreshSystemStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Alertas Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Críticos</span>
                    <Badge variant="destructive">{systemStatus.alerts.critical}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avisos</span>
                    <Badge variant="secondary">{systemStatus.alerts.warnings}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rede</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status</span>
                    <Badge variant={isOnline ? "default" : "destructive"}>
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Intensidade</span>
                    <span className="text-sm font-medium">{systemStatus.network.strength}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Notificações</h3>
            {!pushEnabled && (
              <Button size="sm" onClick={requestNotificationPermission}>
                <Bell className="h-4 w-4 mr-2" />
                Ativar
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Nenhuma notificação</p>
                  <p className="text-muted-foreground">Você está em dia!</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-colors ${
                    !notification.read ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-primary rounded-full ml-2 mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-lg font-medium">Configurações</h3>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notificações Push</CardTitle>
              <CardDescription>
                Receba alertas importantes em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant={pushEnabled ? "secondary" : "default"}
                onClick={requestNotificationPermission}
                disabled={pushEnabled}
              >
                <Bell className="h-4 w-4 mr-2" />
                {pushEnabled ? "Ativado" : "Ativar Notificações"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">App Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Versão</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Build</span>
                <span className="text-sm font-medium">2024.01.01</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileManager;