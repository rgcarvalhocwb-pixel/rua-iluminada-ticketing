import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Key, Webhook } from 'lucide-react';
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
      <div className="flex items-center gap-2">
        <Webhook className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Integração com Sites Externos</h2>
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

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="transfers">Repasses</TabsTrigger>
          <TabsTrigger value="auth">Autenticação</TabsTrigger>
          <TabsTrigger value="examples">Exemplos de Código</TabsTrigger>
        </TabsList>

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
          <CardTitle>Checklist para Plataformas Externas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="webhook-url" />
              <label htmlFor="webhook-url" className="text-sm">
                Configurar URL do webhook: <code>{WEBHOOK_URL}</code>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="webhook-secret" />
              <label htmlFor="webhook-secret" className="text-sm">
                Implementar assinatura HMAC-SHA256 com o secret fornecido
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="sale-format" />
              <label htmlFor="sale-format" className="text-sm">
                Implementar envio de vendas no formato especificado
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="transfer-format" />
              <label htmlFor="transfer-format" className="text-sm">
                Implementar envio de repasses no formato especificado
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="error-handling" />
              <label htmlFor="error-handling" className="text-sm">
                Implementar tratamento de erros e retry em caso de falha
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="testing" />
              <label htmlFor="testing" className="text-sm">
                Testar integração com dados de exemplo
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};