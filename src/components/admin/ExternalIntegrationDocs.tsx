import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Key, Webhook, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const ExternalIntegrationDocs = () => {
  const [webhookSecret, setWebhookSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const WEBHOOK_URL = 'https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/external-sales-webhook';

  const generateWebhookSecret = async () => {
    setLoading(true);
    try {
      const secret = crypto.randomUUID();
      setWebhookSecret(secret);
      
      // Salvar o secret no banco para referência
      const { error } = await supabase
        .from('payment_settings')
        .upsert({
          id: crypto.randomUUID(),
          pagseguro_email: 'webhook_config',
          pagseguro_token: secret
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Secret do webhook gerado com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao gerar secret: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência."
    });
  };

  const generateSystemPrompt = () => {
    return `PROMPT COMPLETO PARA RECRIAR O SISTEMA DE VENDAS DE INGRESSOS - "RUA ILUMINADA"
================================================================================

## 1. VISÃO GERAL DO SISTEMA
Criar um sistema completo de venda de ingressos online/presencial com gestão administrativa, incluindo:
- Site público para compra de ingressos (integração PagSeguro)
- Terminal de autoatendimento (kiosk mode)
- Painel administrativo completo
- Sistema de validação mobile (QR Code/Cartão)
- Integração com hardware (impressoras, pinpads, catracas)
- API para integração com sites externos
- Sistema de backup e auditoria

## 2. TECNOLOGIAS BASE
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Auth + Database + Edge Functions + Storage)
- **Pagamento**: PagSeguro API
- **UI**: Radix UI + Shadcn/ui
- **Estado**: Zustand + React Query
- **Roteamento**: React Router DOM

## 3. ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais:
\`\`\`sql
-- Eventos e configurações
events (id, name, description, start_date, end_date, location, active, max_capacity)
show_times (id, event_id, show_date, show_time, capacity)
event_sessions (id, event_id, show_time_id, session_date, available_tickets)
ticket_types (id, name, price, half_price, description, event_id, visible, max_quantity, color)

-- Sistema de vendas
orders (id, customer_name, customer_email, customer_cpf, total_amount, payment_status, created_by)
order_items (id, order_id, ticket_type_id, quantity, unit_price, total_price)
tickets (id, order_id, ticket_type_id, ticket_number, qr_code, validation_status, validated_at)

-- Gestão financeira
stores (id, name, location, commission_rate, active)
online_sales (id, platform_name, event_name, ticket_count, unit_price, total_amount, sale_date)
online_transfers (id, platform_name, amount, transfer_date, description)
store_daily_sales (id, store_id, sale_date, ticket_count, gross_amount, commission, net_amount)
daily_closures (id, closure_date, total_sales, total_tickets, cash_amount, card_amount)
admin_transfers (id, transfer_date, amount, description, transfer_type)

-- Sistema de usuários e permissões
user_roles (user_id, role, status, account_status, created_at)
user_permissions (user_id, permission)
user_audit_logs (user_id, action, entity_type, details, timestamp)

-- Hardware e terminais
terminal_config (id, background_image_url, ticket_types, updated_at)
turnstiles (id, name, model, ip_address, port, status, location)
validations (id, ticket_id, turnstile_id, validation_time, validator_user, method)
terminal_commands, terminal_updates, terminal_heartbeats, system_alerts

-- Configurações
payment_settings (id, pagseguro_email, pagseguro_token, active)
branding_config (id, company_name, logo_url, primary_color, secondary_color)
\`\`\`

## 4. ESTRUTURA DE PÁGINAS E COMPONENTES

### Páginas Principais:
1. **Index** (\`/\`) - Site público de vendas
   - Hero Section com imagem de fundo
   - Seletor de ingressos com calendário
   - Formulário de cliente
   - Integração com PagSeguro

2. **Admin** (\`/admin\`) - Painel administrativo
   - Sistema de autenticação
   - Sidebar com navegação por permissões
   - Módulos: Eventos, Vendas, Caixa, Relatórios, Usuários, etc.

3. **SelfServiceTerminal** (\`/terminal\`) - Terminal de autoatendimento
   - Interface fullscreen
   - Integração com hardware (impressora/pinpad)
   - Detecção de hardware nativo

4. **TicketValidation** (\`/validator\`) - App mobile de validação
   - Scanner QR Code
   - Validação offline
   - Interface otimizada para mobile

5. **Dashboard** (\`/dashboard\`) - Dashboard analítico
   - Gráficos e métricas
   - Visão geral de vendas

### Hooks Personalizados:
\`\`\`typescript
// Fluxo de compra de ingressos
useTicketFlow() - Gerencia steps: selection → customer-form → payment

// Hardware e terminal
useTerminalHardware(terminalId) - Conecta com impressoras, pinpads, catracas
useNativeHardware() - Detecção de hardware via Web APIs
useOfflineMode() - Sincronização offline/online

// Permissões e segurança
useUserPermissions() - Sistema de roles (admin, user, terminal, master)
useAdvancedSecurity() - Logs de segurança e auditoria
\`\`\`

## 5. INTEGRAÇÃO COM PAGAMENTOS

### PagSeguro Integration:
\`\`\`typescript
// Edge Function: create-pagseguro-payment
- Recebe dados do pedido
- Cria transação no PagSeguro
- Retorna URL de pagamento
- Salva order no banco

// Edge Function: process-payment-confirmation
- Webhook do PagSeguro
- Confirma pagamento
- Atualiza status do pedido
- Gera tickets com QR codes
\`\`\`

## 6. SISTEMA DE HARDWARE

### Componentes de Hardware:
\`\`\`typescript
// Impressoras (Web APIs + fallback para terminal)
- Detecção automática via Web Serial API
- Impressão de tickets com QR codes
- Fallback para window.print()

// Pinpads (integração terminal)
- Processamento de pagamentos locais
- Comunicação via Edge Functions

// Catracas Topdata Fit
- Validação QR Code + Cartão
- Comandos via IP/TCP
- Monitoramento em tempo real
\`\`\`

## 7. API EXTERNA PARA INTEGRAÇÃO

### Webhook para Sites Externos:
\`\`\`typescript
// URL: /functions/v1/external-sales-webhook
// Métodos suportados:
POST /webhook
Content-Type: application/json
Authorization: HMAC-SHA256

// Payload para vendas:
{
  "type": "sale",
  "data": {
    "external_sale_id": "string",
    "platform_name": "string",
    "event_name": "string",
    "customer_name": "string",
    "customer_email": "string",
    "ticket_count": number,
    "unit_price": number,
    "total_amount": number,
    "sale_date": "ISO string",
    "event_date": "ISO string"
  }
}
\`\`\`

## 8. CONFIGURAÇÕES E SECRETS

### Secrets do Supabase:
- PAGSEGURO_EMAIL
- PAGSEGURO_TOKEN
- WEBHOOK_SECRET
- SUPABASE_SERVICE_ROLE_KEY

### Configurações de Ambiente:
\`\`\`env
VITE_SUPABASE_URL=https://tzqriohyfazftfulwcuj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
\`\`\`

## 9. SISTEMA DE PERMISSÕES

### Roles:
- **master**: Acesso total
- **admin**: Gestão completa exceto usuários master
- **user**: Operações básicas (caixa, vendas)
- **terminal**: Apenas terminal de autoatendimento

### Permissions:
- events_manage, tickets_manage
- cash_daily, cash_general
- stores_manage, online_sales
- orders_view, payments_config
- users_manage, dashboard_view

## 10. FEATURES ESPECIAIS

### Tema Natalino:
- Efeitos de neve (ChristmasEffects)
- Cores temáticas
- Avatar natalino

### Offline Mode:
- Cache local de dados
- Sincronização automática
- Queue de transações offline

### Mobile Optimizations:
- Interface responsiva
- Detecção de dispositivo móvel
- Otimizações de performance

### Sistema de Backup:
- Backups automáticos
- Exportação de dados
- Recovery functions

## 11. EDGE FUNCTIONS NECESSÁRIAS

1. \`create-pagseguro-payment\` - Integração pagamentos
2. \`process-payment-confirmation\` - Webhook PagSeguro
3. \`external-sales-webhook\` - API para sites externos
4. \`terminal-hardware-status\` - Status hardware
5. \`terminal-print-ticket\` - Impressão de tickets
6. \`terminal-payment\` - Pagamentos terminal
7. \`turnstile-qr-validation\` - Validação catracas
8. \`system-backup\` - Backups automáticos
9. \`expire-pending-orders\` - Limpeza de pedidos
10. \`reset-user-password\` - Reset de senhas

## 12. PASSOS DE IMPLEMENTAÇÃO

1. **Setup inicial**: Configurar Supabase + React + dependências
2. **Database**: Criar todas as tabelas e relationships
3. **Autenticação**: Sistema de usuários e permissões
4. **Site público**: Página de vendas + integração PagSeguro
5. **Painel admin**: Todas as telas de gestão
6. **Terminal**: Interface de autoatendimento
7. **Mobile validator**: App de validação
8. **Hardware**: Integração com impressoras/catracas
9. **API externa**: Webhook para integração
10. **Deploy**: Configuração de produção

## 13. COMPONENTES UI PERSONALIZADOS

### Design System:
- Christmas Effects (neve animada)
- Hero Section responsivo
- Ticket Selector com calendário
- Customer Form com validação
- Terminal Status Bar
- Mobile Optimizations

### Hooks Utilitários:
- useAccessibility - Recursos de acessibilidade
- useAnimations - Animações suaves
- useImageCompression - Otimização de imagens
- usePerformanceOptimization - Cache e performance
- useRealtimeNotifications - Notificações em tempo real

## 14. SEGURANÇA E AUDITORIA

### Sistema de Logs:
- Audit Logs completos
- Security Events
- User Actions tracking
- System Alerts

### Advanced Security:
- Row Level Security (RLS)
- HMAC signatures
- Session management
- Permission-based access

Este prompt contém TODOS os elementos necessários para recriar o sistema completo, incluindo estrutura de dados, componentes, integrações e funcionalidades especiais.

=== FIM DO PROMPT ===
Gerado em: ${new Date().toLocaleString('pt-BR')}
Sistema: Rua Iluminada - Sistema de Vendas de Ingressos
Versão: 1.0
`;
  };

  const downloadSystemPrompt = () => {
    const promptContent = generateSystemPrompt();
    const blob = new Blob([promptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `sistema-rua-iluminada-prompt-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Concluído!",
      description: "Prompt do sistema baixado com sucesso."
    });
  };

  const saleExample = {
    type: "sale",
    timestamp: "2024-12-20T10:30:00Z",
    data: {
      platform_name: "Sympla",
      event_external_id: "evento-natal-2024",
      ticket_type: "Inteira",
      quantity_sold: 2,
      unit_price: 50.00,
      sale_date: "2024-12-20",
      customer_name: "João Silva",
      customer_email: "joao@email.com",
      customer_cpf: "123.456.789-10",
      payment_method: "credit",
      external_sale_id: "SYM_12345_2024"
    },
    signature: "abc123def456..."
  };

  const transferExample = {
    type: "transfer",
    timestamp: "2024-12-20T15:00:00Z",
    data: {
      platform_name: "Sympla",
      transfer_date: "2024-12-20",
      expected_amount: 1500.00,
      received_amount: 1485.50,
      status: "received",
      notes: "Repasse com desconto de taxa",
      external_transfer_id: "TRF_SYM_202412_001"
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Integração com Sites Externos</h2>
        </div>
        <Button
          onClick={downloadSystemPrompt}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Baixar Prompt do Sistema (.txt)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configuração do Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL do Webhook</Label>
            <div className="flex gap-2">
              <Input value={WEBHOOK_URL} readOnly />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(WEBHOOK_URL)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Secret do Webhook (para validação de segurança)</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Clique em gerar ou digite um secret personalizado"
              />
              <Button
                onClick={generateWebhookSecret}
                disabled={loading}
                variant="outline"
              >
                Gerar
              </Button>
              {webhookSecret && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookSecret)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Forneça a URL do webhook e o secret para os desenvolvedores 
              dos sites externos. Eles precisarão configurar seus sistemas para enviar dados automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Configuração Inicial</TabsTrigger>
          <TabsTrigger value="implementation">Implementação</TabsTrigger>
          <TabsTrigger value="sales">API de Vendas</TabsTrigger>
          <TabsTrigger value="transfers">API de Repasses</TabsTrigger>
          <TabsTrigger value="auth">Autenticação</TabsTrigger>
          <TabsTrigger value="examples">Exemplos de Código</TabsTrigger>
          <TabsTrigger value="testing">Testes</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Configuração Inicial - Passo a Passo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">O que você precisa antes de começar:</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm text-blue-800">
                  <li>Acesso de desenvolvedor ao seu site de vendas</li>
                  <li>Capacidade de fazer requisições HTTP POST</li>
                  <li>Conhecimento básico de APIs REST</li>
                  <li>Servidor web que suporte HTTPS (obrigatório)</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold mb-2">📋 Passo 1: Solicitar Configuração</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Entre em contato conosco informando:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Nome da sua plataforma (ex: "MeuSite Ingressos")</li>
                    <li>URL do seu site</li>
                    <li>Email do responsável técnico</li>
                    <li>Tipos de eventos que vocês vendem</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold mb-2">🔑 Passo 2: Receber Credenciais</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Após o contato, você receberá:
                  </p>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    URL do Webhook: {WEBHOOK_URL}<br/>
                    Secret de Segurança: [será fornecido por email]
                  </div>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold mb-2">⚙️ Passo 3: Configurar no seu Sistema</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    No seu sistema, configure:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>URL do webhook nas configurações</li>
                    <li>Secret de segurança (mantenha seguro!)</li>
                    <li>Ativar envio automático de vendas</li>
                    <li>Ativar envio de repasses (opcional)</li>
                  </ul>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold mb-2">🧪 Passo 4: Implementar e Testar</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Siga a aba "Implementação" para código detalhado
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Implementar função de envio de vendas</li>
                    <li>Implementar assinatura de segurança</li>
                    <li>Testar com dados fictícios</li>
                    <li>Validar recebimento no nosso sistema</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-600 pl-4">
                  <h4 className="font-semibold mb-2">🎯 Passo 5: Ir ao Ar</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Após os testes, ative em produção:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Configurar envio automático de vendas</li>
                    <li>Monitorar logs de envio</li>
                    <li>Validar dados no painel administrativo</li>
                    <li>Configurar alertas para falhas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation">
          <Card>
            <CardHeader>
              <CardTitle>💻 Implementação Técnica Detalhada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Requisitos Técnicos Obrigatórios:</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-800">
                  <li>HTTPS obrigatório (não aceita HTTP)</li>
                  <li>Content-Type: application/json</li>
                  <li>Assinatura HMAC-SHA256 obrigatória</li>
                  <li>Timeout de 30 segundos para resposta</li>
                  <li>Retry automático em caso de falha (recomendado)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">🔄 Fluxo de Integração:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">1</div>
                    <div>
                      <h5 className="font-medium">Venda Realizada no seu Site</h5>
                      <p className="text-sm text-gray-600">Cliente finaliza compra na sua plataforma</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">2</div>
                    <div>
                      <h5 className="font-medium">Preparar Dados</h5>
                      <p className="text-sm text-gray-600">Formatar dados da venda conforme nossa API</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">3</div>
                    <div>
                      <h5 className="font-medium">Gerar Assinatura</h5>
                      <p className="text-sm text-gray-600">Criar HMAC-SHA256 com o secret fornecido</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-orange-600">4</div>
                    <div>
                      <h5 className="font-medium">Enviar via POST</h5>
                      <p className="text-sm text-gray-600">Fazer requisição HTTP POST para nosso webhook</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">5</div>
                    <div>
                      <h5 className="font-medium">Receber Confirmação</h5>
                      <p className="text-sm text-gray-600">Aguardar resposta 200 OK do nosso sistema</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🛠️ Quando Enviar os Dados:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded">
                    <h5 className="font-medium text-green-800">✅ ENVIE quando:</h5>
                    <ul className="list-disc pl-4 text-sm text-green-700 mt-1">
                      <li>Pagamento aprovado/confirmado</li>
                      <li>Ingresso gerado com sucesso</li>
                      <li>Cliente recebeu confirmação</li>
                      <li>Estorno/cancelamento processado</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <h5 className="font-medium text-red-800">❌ NÃO ENVIE quando:</h5>
                    <ul className="list-disc pl-4 text-sm text-red-700 mt-1">
                      <li>Pagamento ainda pendente</li>
                      <li>Carrinho abandonado</li>
                      <li>Erro no processo de compra</li>
                      <li>Teste ou simulação</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🔄 Tratamento de Erros:</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{`// Exemplo de implementação com retry
async function enviarVenda(dadosVenda, tentativas = 3) {
  for (let i = 0; i < tentativas; i++) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': gerarAssinatura(dadosVenda)
        },
        body: JSON.stringify(dadosVenda),
        timeout: 30000 // 30 segundos
      });

      if (response.ok) {
        console.log('Venda enviada com sucesso');
        return true;
      }
      
      // Se não é erro 5xx, não retry
      if (response.status < 500) {
        console.error('Erro permanente:', response.status);
        return false;
      }
      
    } catch (error) {
      console.log(\`Tentativa \${i + 1} falhou:, error.message\`);
      
      // Aguarda antes da próxima tentativa
      if (i < tentativas - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }
  
  console.error('Todas as tentativas falharam');
  return false;
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>🧪 Guia de Testes Completo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">✅ Checklist de Testes Obrigatórios:</h4>
                <div className="space-y-2">
                  {[
                    'Testar envio de venda com dados válidos',
                    'Testar envio com assinatura incorreta (deve falhar)',
                    'Testar envio sem campos obrigatórios (deve falhar)',
                    'Testar envio de estorno/cancelamento',
                    'Testar envio de repasse financeiro',
                    'Verificar timeout de 30 segundos',
                    'Testar reconexão após falha temporária',
                    'Validar dados no painel administrativo'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="checkbox" id={`test-${index}`} className="rounded" />
                      <label htmlFor={`test-${index}`} className="text-sm text-green-800">{item}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🎯 Dados de Teste Sugeridos:</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{JSON.stringify({
  type: "sale",
  timestamp: "2024-12-20T10:30:00Z",
  data: {
    platform_name: "TESTE - Seu Site",
    event_external_id: "evento-teste-2024",
    ticket_type: "Inteira",
    quantity_sold: 1,
    unit_price: 50.00,
    sale_date: "2024-12-20",
    customer_name: "João Teste",
    customer_email: "teste@seuemail.com",
    customer_cpf: "000.000.000-00",
    payment_method: "credit",
    external_sale_id: "TESTE_12345_2024"
  }
}, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🔍 Como Validar se Funcionou:</h4>
                <ol className="list-decimal pl-6 space-y-2 text-sm">
                  <li>
                    <strong>Resposta HTTP 200:</strong> Se recebeu status 200, os dados foram aceitos
                  </li>
                  <li>
                    <strong>Verifique no Painel Admin:</strong> 
                    <ul className="list-disc pl-4 mt-1">
                      <li>Vá em "Vendas Online" no sistema</li>
                      <li>Procure pela venda com sua plataforma</li>
                      <li>Confirme se os valores estão corretos</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Teste Estorno:</strong> Envie uma venda com quantity_refunded maior que 0
                  </li>
                  <li>
                    <strong>Monitore Logs:</strong> Acompanhe os logs do seu sistema para erros
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">⚠️ Erros Comuns e Soluções:</h4>
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-red-400 bg-red-50">
                    <h5 className="font-medium text-red-800">Erro 401 - Assinatura Inválida</h5>
                    <p className="text-sm text-red-700">
                      Verifique se está gerando o HMAC-SHA256 corretamente usando o secret fornecido
                    </p>
                  </div>
                  <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50">
                    <h5 className="font-medium text-yellow-800">Erro 400 - Dados Inválidos</h5>
                    <p className="text-sm text-yellow-700">
                      Confirme se todos os campos obrigatórios estão preenchidos e no formato correto
                    </p>
                  </div>
                  <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                    <h5 className="font-medium text-blue-800">Timeout</h5>
                    <p className="text-sm text-blue-700">
                      Implemente retry automático com intervalo crescente (2s, 4s, 8s)
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-2">🎓 Dicas de Boas Práticas:</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm text-indigo-800">
                  <li>Sempre teste em ambiente de desenvolvimento primeiro</li>
                  <li>Mantenha logs detalhados de todas as tentativas</li>
                  <li>Configure alertas para falhas consecutivas</li>
                  <li>Valide dados antes de enviar (evita erros 400)</li>
                  <li>Use HTTPS sempre (nosso sistema rejeita HTTP)</li>
                  <li>Mantenha o secret seguro (nunca no frontend)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>API para Envio de Vendas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Endpoint:</h4>
                <Badge variant="secondary">POST</Badge>
                <code className="ml-2 p-1 bg-gray-100 rounded text-sm">
                  {WEBHOOK_URL}
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Headers Obrigatórios:</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{`Content-Type: application/json
X-Webhook-Signature: [assinatura HMAC-SHA256 do payload]`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Payload de Venda:</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{JSON.stringify(saleExample, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Campos Obrigatórios:</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><code>platform_name</code>: Nome da plataforma (ex: "Sympla", "Eventbrite")</li>
                  <li><code>event_external_id</code>: ID do evento na plataforma externa</li>
                  <li><code>ticket_type</code>: Tipo do ingresso ("Inteira", "Meia", etc.)</li>
                  <li><code>quantity_sold</code>: Quantidade vendida</li>
                  <li><code>unit_price</code>: Valor unitário em reais</li>
                  <li><code>sale_date</code>: Data da venda (YYYY-MM-DD)</li>
                  <li><code>external_sale_id</code>: ID único da venda na plataforma externa</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Campos Opcionais:</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><code>quantity_refunded</code>: Quantidade estornada</li>
                  <li><code>customer_name</code>: Nome do cliente</li>
                  <li><code>customer_email</code>: Email do cliente</li>
                  <li><code>customer_cpf</code>: CPF do cliente</li>
                  <li><code>payment_method</code>: Método de pagamento ("credit", "debit", "pix", "boleto")</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>API para Repasses Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Payload de Repasse:</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{JSON.stringify(transferExample, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Status Possíveis:</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><Badge variant="outline">pending</Badge> - Repasse pendente</li>
                  <li><Badge variant="outline">received</Badge> - Repasse recebido</li>
                  <li><Badge variant="outline">cancelled</Badge> - Repasse cancelado</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Autenticação e Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Geração da Assinatura:</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Para garantir a segurança, todas as requisições devem incluir uma assinatura HMAC-SHA256:
                </p>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{`// Exemplo em JavaScript/Node.js
const crypto = require('crypto');

function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload.data))
    .digest('hex');
}

const signature = generateSignature(payload, webhookSecret);
// Incluir no header: X-Webhook-Signature: signature`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Exemplo em PHP:</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{`<?php
function generateSignature($payload, $secret) {
    return hash_hmac('sha256', json_encode($payload['data']), $secret);
}

$signature = generateSignature($payload, $webhookSecret);
$headers = [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $signature
];
?>`}
                </pre>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Segurança:</strong> Nunca compartilhe o secret do webhook publicamente. 
                  Ele deve ser armazenado de forma segura e usado apenas no backend da plataforma externa.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Exemplos de Implementação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Exemplo completo em Node.js:</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{`const crypto = require('crypto');
const axios = require('axios');

class RuaIluminadaWebhook {
  constructor(webhookUrl, secret) {
    this.webhookUrl = webhookUrl;
    this.secret = secret;
  }

  generateSignature(payload) {
    return crypto
      .createHmac('sha256', this.secret)
      .update(JSON.stringify(payload.data))
      .digest('hex');
  }

  async sendSale(saleData) {
    const payload = {
      type: 'sale',
      timestamp: new Date().toISOString(),
      data: saleData
    };

    const signature = this.generateSignature(payload);

    try {
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        }
      });

      console.log('Venda enviada com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar venda:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendTransfer(transferData) {
    const payload = {
      type: 'transfer',
      timestamp: new Date().toISOString(),
      data: transferData
    };

    const signature = this.generateSignature(payload);

    try {
      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        }
      });

      console.log('Repasse enviado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar repasse:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Uso:
const webhook = new RuaIluminadaWebhook('${WEBHOOK_URL}', 'seu-secret-aqui');

// Enviar venda
webhook.sendSale({
  platform_name: "Sympla",
  event_external_id: "evento-natal-2024",
  ticket_type: "Inteira",
  quantity_sold: 2,
  unit_price: 50.00,
  sale_date: "2024-12-20",
  external_sale_id: "SYM_12345_2024"
});`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Resposta de Sucesso:</h4>
                <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "Webhook processado com sucesso",
  "data": {
    "sale_id": "uuid-da-venda",
    "event_id": "uuid-do-evento",
    "total_amount": 100.00
  }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Resposta de Erro:</h4>
                <pre className="bg-red-50 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": false,
  "error": "Descrição do erro",
  "timestamp": "2024-12-20T10:30:00Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>📞 Suporte e Contato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">🤝 Como Solicitar Integração:</h4>
              <ol className="list-decimal pl-6 space-y-1 text-sm text-green-800">
                <li>Entre em contato conosco via email: <strong>integracao@ruailuminada.com.br</strong></li>
                <li>Informe nome da sua plataforma e URL do site</li>
                <li>Descreva os tipos de eventos que vocês vendem</li>
                <li>Aguarde o retorno com as credenciais de acesso</li>
                <li>Siga este manual para implementar</li>
              </ol>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">🆘 Suporte Técnico:</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-blue-800">
                <li><strong>Email:</strong> suporte@ruailuminada.com.br</li>
                <li><strong>WhatsApp:</strong> (85) 99999-9999</li>
                <li><strong>Horário:</strong> Segunda a sexta, 8h às 18h</li>
                <li><strong>Urgência:</strong> Até 4 horas para resposta</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">📚 Recursos Adicionais:</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-purple-800">
                <li>Exemplo prático em GitHub: <code>github.com/ruailuminada/webhook-examples</code></li>
                <li>Postman Collection para testes</li>
                <li>Validador online de assinatura HMAC</li>
                <li>Status page: <code>status.ruailuminada.com.br</code></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};