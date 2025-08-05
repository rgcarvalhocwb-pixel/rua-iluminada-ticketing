import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { useUserPermissions, hasPermission } from '@/hooks/useUserPermissions';
import { EventsManager } from '@/components/admin/EventsManager';
import { OrdersView } from '@/components/admin/OrdersView';
import { CashRegister } from '@/components/admin/CashRegister';
import { GeneralCashbox } from '@/components/admin/GeneralCashbox';
import { PaymentSettings } from '@/components/admin/PaymentSettings';
import { StoresManager } from '@/components/admin/StoresManager';
import { OnlineSalesManager } from '@/components/admin/OnlineSalesManager';
import { TicketTypesManager } from '@/components/admin/TicketTypesManager';
import { UserManagement } from '@/components/admin/UserManagement';
import { ReportsAnalytics } from '@/components/admin/ReportsAnalytics';
import { BackupRecovery } from '@/components/admin/BackupRecovery';
import { BrandingSettings } from '@/components/admin/BrandingSettings';
import { PerformanceMonitoring } from '@/components/admin/PerformanceMonitoring';
import { AnalyticsIntegration } from '@/components/admin/AnalyticsIntegration';
import { 
  LogOut, 
  Calendar, 
  ShoppingCart, 
  CreditCard, 
  DollarSign, 
  Store, 
  Globe, 
  Ticket, 
  Users, 
  Banknote,
  BarChart3,
  Database,
  Palette,
  Activity,
  TrendingUp
} from 'lucide-react';

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const userPermissions = useUserPermissions();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate('/auth');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate('/auth');
  };

  if (loading || userPermissions.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  // Se o usuário não tem papel aprovado, mostrar mensagem
  if (!userPermissions.role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Seu usuário ainda não foi aprovado ou não possui permissões para acessar o painel administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Definir abas com base nas permissões
  const availableTabs = [];

  if (hasPermission(userPermissions, 'events_manage')) {
    availableTabs.push({
      id: 'events',
      label: 'Eventos',
      icon: <Calendar className="w-4 h-4" />,
      component: <EventsManager />,
      title: 'Gerenciar Eventos',
      description: 'Crie e gerencie eventos, configure tipos de ingressos e preços'
    });
  }

  if (hasPermission(userPermissions, 'tickets_manage')) {
    availableTabs.push({
      id: 'tickets',
      label: 'Ingressos',
      icon: <Ticket className="w-4 h-4" />,
      component: <TicketTypesManager />,
      title: 'Gerenciar Tipos de Ingresso',
      description: 'Configure tipos de ingressos, preços e visibilidade'
    });
  }

  if (hasPermission(userPermissions, 'cash_daily')) {
    availableTabs.push({
      id: 'cash-register',
      label: 'Caixa',
      icon: <DollarSign className="w-4 h-4" />,
      component: <CashRegister />,
      title: 'Caixa Diário',
      description: 'Registre vendas presenciais e faça a conciliação financeira'
    });
  }

  if (hasPermission(userPermissions, 'cash_general')) {
    availableTabs.push({
      id: 'general-cash',
      label: 'Geral',
      icon: <Banknote className="w-4 h-4" />,
      component: <GeneralCashbox />,
      title: 'Caixa Geral',
      description: 'Consolide informações diárias e gerencie repasses para a administração'
    });
  }

  if (hasPermission(userPermissions, 'stores_manage')) {
    availableTabs.push({
      id: 'stores',
      label: 'Lojas',
      icon: <Store className="w-4 h-4" />,
      component: <StoresManager />,
      title: 'Gestão de Lojas',
      description: 'Cadastre lojas, registre vendas e gerencie comissões'
    });
  }

  if (hasPermission(userPermissions, 'online_sales')) {
    availableTabs.push({
      id: 'online',
      label: 'Online',
      icon: <Globe className="w-4 h-4" />,
      component: <OnlineSalesManager />,
      title: 'Vendas Online de Terceiros',
      description: 'Gerencie vendas de plataformas externas e repasses'
    });
  }

  if (hasPermission(userPermissions, 'orders_view')) {
    availableTabs.push({
      id: 'orders',
      label: 'Pedidos',
      icon: <ShoppingCart className="w-4 h-4" />,
      component: <OrdersView />,
      title: 'Visualizar Pedidos',
      description: 'Acompanhe todas as vendas online e presenciais'
    });
  }

  if (hasPermission(userPermissions, 'payments_config')) {
    availableTabs.push({
      id: 'payments',
      label: 'Pagamentos',
      icon: <CreditCard className="w-4 h-4" />,
      component: <PaymentSettings />,
      title: 'Configurações de Pagamento',
      description: 'Configure as credenciais do PagSeguro para processar pagamentos online'
    });
  }

  // Abas exclusivas para Masters e Admins
  if (userPermissions.role === 'master' || userPermissions.role === 'admin') {
    availableTabs.push(
      {
        id: 'reports',
        label: 'Relatórios',
        icon: <BarChart3 className="w-4 h-4" />,
        component: <ReportsAnalytics />,
        title: 'Relatórios e Analytics',
        description: 'Análise detalhada de vendas e performance por evento'
      },
      {
        id: 'backup',
        label: 'Backup',
        icon: <Database className="w-4 h-4" />,
        component: <BackupRecovery />,
        title: 'Backup e Recuperação',
        description: 'Gerencie backups automáticos e exportação de dados'
      },
      {
        id: 'branding',
        label: 'Marca',
        icon: <Palette className="w-4 h-4" />,
        component: <BrandingSettings />,
        title: 'Configurações de Marca',
        description: 'Personalize logo, cores e identidade visual da empresa'
      },
      {
        id: 'performance',
        label: 'Performance',
        icon: <Activity className="w-4 h-4" />,
        component: <PerformanceMonitoring />,
        title: 'Monitoramento de Performance',
        description: 'Acompanhe métricas de performance e logs de erro'
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: <TrendingUp className="w-4 h-4" />,
        component: <AnalyticsIntegration />,
        title: 'Integrações de Analytics',
        description: 'Configure Google Analytics, Facebook Pixel e outras integrações'
      }
    );
  }

  if (hasPermission(userPermissions, 'users_manage')) {
    availableTabs.push({
      id: 'users',
      label: 'Usuários',
      icon: <Users className="w-4 h-4" />,
      component: <UserManagement />,
      title: 'Gerenciamento de Usuários',
      description: 'Aprove novos usuários e gerencie permissões de acesso'
    });
  }

  // Se não tem nenhuma aba disponível
  if (availableTabs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sem Permissões</CardTitle>
            <CardDescription>
              Você não possui permissões para acessar nenhum módulo do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">
              Bem-vindo, {user?.email} ({userPermissions.role})
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission(userPermissions, 'dashboard_view') && (
              <Button onClick={() => window.open('/dashboard', '_blank')} variant="secondary" size="sm">
                📊 Dashboard
              </Button>
            )}
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={availableTabs[0]?.id} className="space-y-6">
          <div className="relative bg-gradient-to-r from-primary/5 via-background to-primary/5 p-1 rounded-xl shadow-lg border border-primary/10">
            <TabsList className={`grid w-full bg-transparent gap-1 h-auto p-1 grid-cols-${Math.min(availableTabs.length, 12)}`}>
              {availableTabs.map((tab, index) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="
                    relative flex items-center justify-center gap-2 
                    text-sm font-medium py-3 px-4 
                    rounded-lg transition-all duration-300 ease-in-out
                    data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                    data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20
                    data-[state=active]:scale-105 data-[state=active]:z-10
                    hover:bg-primary/10 hover:text-primary hover:scale-102
                    hover:shadow-md hover:shadow-primary/10
                    text-muted-foreground
                    animate-fade-in
                    border border-transparent
                    data-[state=active]:border-primary/20
                  "
                  style={{ 
                    animationDelay: `${index * 0.05}s`,
                    transform: 'translateZ(0)' // Força aceleração por hardware
                  }}
                >
                  <span className="transition-transform duration-200 group-hover:scale-110">
                    {tab.icon}
                  </span>
                  <span className="hidden sm:inline font-medium">
                    {tab.label}
                  </span>
                  {/* Efeito de brilho na aba ativa */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300" />
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {availableTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{tab.title}</CardTitle>
                  <CardDescription>{tab.description}</CardDescription>
                </CardHeader>
                <CardContent>{tab.component}</CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;