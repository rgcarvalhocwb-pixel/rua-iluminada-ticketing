import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, AlertCircle, AlertTriangle } from "lucide-react";

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  error?: string;
}

export const DataInsertionTester = () => {
  const isDevelopment = import.meta.env.DEV;
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  if (!isDevelopment) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>⚠️ FERRAMENTA DE DESENVOLVIMENTO</strong>
          <br />
          Esta ferramenta está desabilitada em produção.
        </AlertDescription>
      </Alert>
    );
  }

  const updateTest = (name: string, status: TestResult['status'], message: string, data?: any, error?: string) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.data = data;
        existing.error = error;
        return [...prev];
      }
      return [...prev, { name, status, message, data, error }];
    });
  };

  const testEvents = async () => {
    updateTest('Eventos', 'pending', 'Testando inserção de evento...');
    try {
      const eventData = {
        name: `Evento Teste ${Date.now()}`,
        description: 'Evento fictício para teste do sistema',
        start_date: '2024-12-25',
        end_date: '2024-12-31',
        is_test_data: true
      };

      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      updateTest('Eventos', 'success', 'Evento criado com sucesso', data);
      return data;
    } catch (error: any) {
      updateTest('Eventos', 'error', 'Falha ao criar evento', null, error.message);
      return null;
    }
  };

  const testTicketTypes = async (eventId: string) => {
    updateTest('Tipos de Ingresso', 'pending', 'Testando inserção de tipos de ingresso...');
    try {
      const ticketTypes = [
        {
          name: 'Ingresso Inteira',
          description: 'Ingresso sem desconto',
          price: 50.00,
          event_id: eventId,
          is_active: true,
          display_order: 1,
          is_test_data: true
        },
        {
          name: 'Meia Entrada',
          description: 'Ingresso com 50% de desconto',
          price: 25.00,
          event_id: eventId,
          is_active: true,
          display_order: 2,
          is_test_data: true
        }
      ];

      const { data, error } = await supabase
        .from('ticket_types')
        .insert(ticketTypes)
        .select();

      if (error) throw error;

      updateTest('Tipos de Ingresso', 'success', `${data.length} tipos de ingresso criados`, data);
      return data;
    } catch (error: any) {
      updateTest('Tipos de Ingresso', 'error', 'Falha ao criar tipos de ingresso', null, error.message);
      return null;
    }
  };

  const testShowTimes = async (eventId: string) => {
    updateTest('Horários de Sessão', 'pending', 'Testando inserção de horários...');
    try {
      const showTimes = [
        {
          event_id: eventId,
          time_slot: '19:00:00',
          capacity: 100,
          is_test_data: true
        },
        {
          event_id: eventId,
          time_slot: '21:00:00',
          capacity: 100,
          is_test_data: true
        }
      ];

      const { data, error } = await supabase
        .from('show_times')
        .insert(showTimes)
        .select();

      if (error) throw error;

      updateTest('Horários de Sessão', 'success', `${data.length} horários criados`, data);
      return data;
    } catch (error: any) {
      updateTest('Horários de Sessão', 'error', 'Falha ao criar horários', null, error.message);
      return null;
    }
  };

  const testStores = async () => {
    updateTest('Lojas', 'pending', 'Testando inserção de loja...');
    try {
      const storeData = {
        name: `Loja Teste ${Date.now()}`,
        responsible: 'João da Silva',
        contact: '(11) 99999-9999',
        space_value: 500.00,
        commission_percentage: 10.00,
        is_test_data: true
      };

      const { data, error } = await supabase
        .from('stores')
        .insert(storeData)
        .select()
        .single();

      if (error) throw error;

      updateTest('Lojas', 'success', 'Loja criada com sucesso', data);
      return data;
    } catch (error: any) {
      updateTest('Lojas', 'error', 'Falha ao criar loja', null, error.message);
      return null;
    }
  };

  const testPaymentSettings = async () => {
    updateTest('Configurações de Pagamento', 'pending', 'Testando configurações...');
    try {
      const { data: existing } = await supabase
        .from('payment_settings')
        .select()
        .single();

      if (existing) {
        updateTest('Configurações de Pagamento', 'success', 'Configurações já existem', existing);
        return existing;
      }

      const settingsData = {
        pagseguro_email: 'teste@exemplo.com',
        pagseguro_token: 'token_teste_ficticio',
        pagseguro_environment: 'sandbox'
      };

      const { data, error } = await supabase
        .from('payment_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) throw error;

      updateTest('Configurações de Pagamento', 'success', 'Configurações criadas', data);
      return data;
    } catch (error: any) {
      updateTest('Configurações de Pagamento', 'error', 'Falha nas configurações', null, error.message);
      return null;
    }
  };

  const testTerminalConfig = async () => {
    updateTest('Configurações de Terminal', 'pending', 'Testando configurações...');
    try {
      const { data: existing } = await supabase
        .from('terminal_config')
        .select()
        .single();

      if (existing) {
        updateTest('Configurações de Terminal', 'success', 'Configurações já existem', existing);
        return existing;
      }

      const configData = {
        welcome_message: 'Bem-vindo ao Terminal de Teste',
        instructions: 'Toque na tela para começar o teste',
        background_type: 'static',
        max_tickets_per_purchase: 10,
        idle_timeout: 60
      };

      const { data, error } = await supabase
        .from('terminal_config')
        .insert(configData)
        .select()
        .single();

      if (error) throw error;

      updateTest('Configurações de Terminal', 'success', 'Configurações criadas', data);
      return data;
    } catch (error: any) {
      updateTest('Configurações de Terminal', 'error', 'Falha nas configurações', null, error.message);
      return null;
    }
  };

  const testBrandingConfig = async () => {
    updateTest('Configurações de Marca', 'pending', 'Testando configurações...');
    try {
      const { data: existing } = await supabase
        .from('branding_config')
        .select()
        .single();

      if (existing) {
        updateTest('Configurações de Marca', 'success', 'Configurações já existem', existing);
        return existing;
      }

      const brandingData = {
        company_name: 'Empresa Teste Ltda',
        company_description: 'Empresa fictícia para testes do sistema',
        primary_color: '#9333ea',
        secondary_color: '#7c3aed',
        social_whatsapp: '+5511999999999',
        social_instagram: '@empresateste',
        social_facebook: 'empresateste'
      };

      const { data, error } = await supabase
        .from('branding_config')
        .insert(brandingData)
        .select()
        .single();

      if (error) throw error;

      updateTest('Configurações de Marca', 'success', 'Configurações criadas', data);
      return data;
    } catch (error: any) {
      updateTest('Configurações de Marca', 'error', 'Falha nas configurações', null, error.message);
      return null;
    }
  };

  const testTurnstiles = async () => {
    updateTest('Catracas', 'pending', 'Testando inserção de catraca...');
    try {
      const turnstileData = {
        name: `Catraca Teste ${Date.now()}`,
        location: 'Entrada Principal - Teste',
        ip_address: '192.168.1.100',
        status: 'active',
        is_test_data: true
      };

      const { data, error } = await supabase
        .from('turnstiles')
        .insert(turnstileData)
        .select()
        .single();

      if (error) throw error;

      updateTest('Catracas', 'success', 'Catraca criada com sucesso', data);
      return data;
    } catch (error: any) {
      updateTest('Catracas', 'error', 'Falha ao criar catraca', null, error.message);
      return null;
    }
  };

  const testOnlineSales = async (eventId: string) => {
    updateTest('Vendas Online', 'pending', 'Testando inserção de venda online...');
    try {
      const saleData = {
        event_id: eventId,
        platform_name: 'Plataforma Teste',
        sale_date: new Date().toISOString().split('T')[0],
        ticket_type: 'Ingresso Inteira',
        unit_price: 50.00,
        quantity_sold: 5,
        quantity_refunded: 0
      };

      const { data, error } = await supabase
        .from('online_sales')
        .insert(saleData)
        .select()
        .single();

      if (error) throw error;

      updateTest('Vendas Online', 'success', 'Venda online registrada', data);
      return data;
    } catch (error: any) {
      updateTest('Vendas Online', 'error', 'Falha ao registrar venda', null, error.message);
      return null;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);
    
    try {
      toast({
        title: "Iniciando Testes",
        description: "Executando testes de inserção de dados...",
      });

      // Teste 1: Eventos
      const event = await testEvents();
      
      // Teste 2: Tipos de Ingresso (depende do evento)
      if (event) {
        await testTicketTypes(event.id);
        await testShowTimes(event.id);
        await testOnlineSales(event.id);
      }

      // Teste 3: Lojas
      await testStores();

      // Teste 4: Configurações
      await testPaymentSettings();
      await testTerminalConfig();
      await testBrandingConfig();

      // Teste 5: Catracas
      await testTurnstiles();

      toast({
        title: "Testes Concluídos",
        description: "Verifique os resultados abaixo",
      });
    } catch (error) {
      toast({
        title: "Erro nos Testes",
        description: "Ocorreu um erro durante a execução dos testes",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary',
      success: 'default',
      error: 'destructive',
      warning: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status === 'pending' && 'Executando'}
        {status === 'success' && 'Sucesso'}
        {status === 'error' && 'Erro'}
        {status === 'warning' && 'Aviso'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>🧪 MODO DE TESTE</strong>
          <br />
          Todos os dados inseridos serão marcados como dados de teste (is_test_data = true)
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Teste de Inserção de Dados Manuais</CardTitle>
          <p className="text-sm text-muted-foreground">
            Este teste verifica se todas as funcionalidades de inserção manual estão funcionando corretamente
            com dados fictícios para validar as conexões e estrutura do banco de dados.
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executando Testes...
              </>
            ) : (
              'Executar Todos os Testes'
            )}
          </Button>
        </CardContent>
      </Card>

      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(test.status)}
                      <span className="ml-2 font-medium">{test.name}</span>
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    {test.message}
                  </p>

                  {test.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Erro:</strong> {test.error}
                    </div>
                  )}

                  {test.data && test.status === 'success' && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                        Ver dados inseridos
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 border rounded text-xs overflow-auto">
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};