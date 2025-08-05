import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { EventsManager } from '@/components/admin/EventsManager';
import { OrdersView } from '@/components/admin/OrdersView';
import { CashRegister } from '@/components/admin/CashRegister';
import { GeneralCashbox } from '@/components/admin/GeneralCashbox';
import { PaymentSettings } from '@/components/admin/PaymentSettings';
import { StoresManager } from '@/components/admin/StoresManager';
import { OnlineSalesManager } from '@/components/admin/OnlineSalesManager';
import { TicketTypesManager } from '@/components/admin/TicketTypesManager';
import { UserManagement } from '@/components/admin/UserManagement';
import { LogOut, Calendar, ShoppingCart, CreditCard, DollarSign, Store, Globe, Ticket, Users, Banknote } from 'lucide-react';

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando painel administrativo...</p>
        </div>
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
              Bem-vindo, {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.open('/dashboard', '_blank')} variant="secondary" size="sm">
              📊 Dashboard
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Ingressos
            </TabsTrigger>
            <TabsTrigger value="cash-register" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Caixa Diário
            </TabsTrigger>
            <TabsTrigger value="general-cash" className="flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              Caixa Geral
            </TabsTrigger>
            <TabsTrigger value="stores" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Lojas
            </TabsTrigger>
            <TabsTrigger value="online" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Online
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Eventos</CardTitle>
                <CardDescription>
                  Crie e gerencie eventos, configure tipos de ingressos e preços
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventsManager />
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="general-cash">
              <Card>
                <CardHeader>
                  <CardTitle>Caixa Geral</CardTitle>
                  <CardDescription>
                    Consolide informações diárias e gerencie repasses para a administração
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GeneralCashbox />
                </CardContent>
              </Card>
            </TabsContent>

          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Tipos de Ingresso</CardTitle>
                <CardDescription>
                  Configure tipos de ingressos, preços e visibilidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TicketTypesManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cash-register">
            <Card>
              <CardHeader>
                <CardTitle>Caixa Diário</CardTitle>
                <CardDescription>
                  Registre vendas presenciais e faça a conciliação financeira
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CashRegister />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stores">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Lojas</CardTitle>
                <CardDescription>
                  Cadastre lojas, registre vendas e gerencie comissões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StoresManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="online">
            <Card>
              <CardHeader>
                <CardTitle>Vendas Online de Terceiros</CardTitle>
                <CardDescription>
                  Gerencie vendas de plataformas externas e repasses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OnlineSalesManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Visualizar Pedidos</CardTitle>
                <CardDescription>
                  Acompanhe todas as vendas online e presenciais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersView />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Pagamento</CardTitle>
                <CardDescription>
                  Configure as credenciais do PagSeguro para processar pagamentos online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Aprove novos usuários e gerencie permissões de acesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;