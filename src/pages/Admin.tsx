import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { useUserPermissions, hasPermission } from '@/hooks/useUserPermissions';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
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
import { StoreDailySalesManager } from '@/components/admin/StoreDailySalesManager';

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
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

  // Definir primeira aba disponível como padrão
  useEffect(() => {
    if (!userPermissions.loading && userPermissions.role) {
      const availableTabs = [];
      
      if (hasPermission(userPermissions, 'events_manage')) availableTabs.push('events');
      if (hasPermission(userPermissions, 'tickets_manage')) availableTabs.push('tickets');
      if (hasPermission(userPermissions, 'cash_daily')) availableTabs.push('cash-register');
      if (hasPermission(userPermissions, 'cash_general')) availableTabs.push('general-cash');
      if (hasPermission(userPermissions, 'stores_manage')) availableTabs.push('stores');
      if (hasPermission(userPermissions, 'online_sales')) availableTabs.push('online');
      if (hasPermission(userPermissions, 'orders_view')) availableTabs.push('orders');
      if (hasPermission(userPermissions, 'payments_config')) availableTabs.push('payments');
      
      if (userPermissions.role === 'master' || userPermissions.role === 'admin') {
        availableTabs.push('reports', 'backup', 'branding', 'performance', 'analytics');
      }
      
      if (hasPermission(userPermissions, 'users_manage')) availableTabs.push('users');
      
      if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
        setActiveTab(availableTabs[0]);
      }
    }
  }, [userPermissions, activeTab]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate('/auth');
  };

  const renderTabContent = () => {
    const tabs: Record<string, { component: JSX.Element; title: string; description: string }> = {
      events: {
        component: <EventsManager />,
        title: 'Gerenciar Eventos',
        description: 'Crie e gerencie eventos, configure tipos de ingressos e preços'
      },
      tickets: {
        component: <TicketTypesManager />,
        title: 'Gerenciar Tipos de Ingresso',
        description: 'Configure tipos de ingressos, preços e visibilidade'
      },
      'cash-register': {
        component: <CashRegister />,
        title: 'Caixa Diário',
        description: 'Registre vendas presenciais e faça a conciliação financeira'
      },
      'general-cash': {
        component: <GeneralCashbox />,
        title: 'Caixa Geral',
        description: 'Consolide informações diárias e gerencie repasses para a administração'
      },
      stores: {
        component: <StoresManager />,
        title: 'Gestão de Lojas',
        description: 'Cadastre lojas, registre vendas e gerencie comissões'
      },
      'store-sales': {
        component: <StoreDailySalesManager />,
        title: 'Vendas Diárias das Lojas',
        description: 'Registre as vendas diárias de cada loja e calcule comissões automaticamente'
      },
      online: {
        component: <OnlineSalesManager />,
        title: 'Vendas Online de Terceiros',
        description: 'Gerencie vendas de plataformas externas e repasses'
      },
      orders: {
        component: <OrdersView />,
        title: 'Visualizar Pedidos',
        description: 'Acompanhe todas as vendas online e presenciais'
      },
      payments: {
        component: <PaymentSettings />,
        title: 'Configurações de Pagamento',
        description: 'Configure as credenciais do PagSeguro para processar pagamentos online'
      },
      reports: {
        component: <ReportsAnalytics />,
        title: 'Relatórios e Analytics',
        description: 'Análise detalhada de vendas e performance por evento'
      },
      backup: {
        component: <BackupRecovery />,
        title: 'Backup e Recuperação',
        description: 'Gerencie backups automáticos e exportação de dados'
      },
      branding: {
        component: <BrandingSettings />,
        title: 'Configurações de Marca',
        description: 'Personalize logo, cores e identidade visual da empresa'
      },
      performance: {
        component: <PerformanceMonitoring />,
        title: 'Monitoramento de Performance',
        description: 'Acompanhe métricas de performance e logs de erro'
      },
      analytics: {
        component: <AnalyticsIntegration />,
        title: 'Integrações de Analytics',
        description: 'Configure Google Analytics, Facebook Pixel e outras integrações'
      },
      users: {
        component: <UserManagement />,
        title: 'Gerenciamento de Usuários',
        description: 'Aprove novos usuários e gerencie permissões de acesso'
      }
    };

    const currentTab = tabs[activeTab];
    if (!currentTab) return null;

    return (
      <Card className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader className="pb-3 md:pb-4 px-3 md:px-6 pt-3 md:pt-6">
          <CardTitle className="text-lg md:text-xl">{currentTab.title}</CardTitle>
          <CardDescription className="text-sm md:text-base">{currentTab.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto px-3 md:px-6 pb-3 md:pb-6">
          {currentTab.component}
        </CardContent>
      </Card>
    );
  };

  if (loading || userPermissions.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 md:h-32 md:w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm md:text-base text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  // Se o usuário não tem papel aprovado, mostrar mensagem
  if (!userPermissions.role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-lg md:text-xl">Acesso Negado</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Seu usuário ainda não foi aprovado ou não possui permissões para acessar o painel administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSignOut={handleSignOut}
          userEmail={user?.email}
          userRole={userPermissions.role}
        />
        
        <SidebarInset className="flex-1">
          {/* Header fixo responsivo */}
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 px-3 md:px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-semibold truncate">Painel Administrativo</h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                Bem-vindo, {user?.email} ({userPermissions.role})
              </p>
            </div>
            <div className="flex gap-1 md:gap-2">
              {hasPermission(userPermissions, 'dashboard_view') && (
                <Button 
                  onClick={() => window.open('/dashboard', '_blank')} 
                  variant="secondary" 
                  size="sm"
                  className="hidden sm:flex"
                >
                  📊 Dashboard
                </Button>
              )}
            </div>
          </header>

          {/* Conteúdo principal responsivo */}
          <main className="flex-1 p-2 md:p-4 overflow-auto">
            {renderTabContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Admin;