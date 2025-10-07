# Integração Compre no Zet - Documentação Técnica

## 📋 Visão Geral

Esta documentação descreve a integração entre o sistema Rua Iluminada e a plataforma de vendas **Compre no Zet** através de webhooks.

## 🔗 Webhook URL

Para configurar no portal do Compre no Zet:

```
https://apizet.ruailuminada.com/webhook/comprenozet
```

**Requisitos:**
- Método: `POST`
- Content-Type: `application/json`
- Timeout recomendado: 30 segundos
- Resposta esperada: `200 OK` com JSON `{"success": true}`

**Arquitetura:**
```
Compre no Zet → https://apizet.ruailuminada.com/webhook/comprenozet
                 ↓ (Cloudflare Worker Proxy)
                 https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/comprenozet-webhook
                 ↓ (Supabase Edge Function)
                 Banco de Dados
```

---

## 🔄 Fluxo de Dados

### Compra Confirmada (action: "CP")

Quando um cliente completa uma compra no Compre no Zet, o webhook é acionado com `action: "CP"`.

**Processamento:**

1. ✅ Valida estrutura do payload
2. ✅ Verifica duplicatas usando `order.uuid`
3. ✅ Mapeia evento externo → evento interno (por `external_id`, `external_slug` ou `name`)
4. ✅ Cria `order` na tabela `orders`
5. ✅ Para cada ingresso em `eventTicketCodes`:
   - Cria `order_item`
   - Cria `ticket` com dados do titular
   - Gera QR code baseado no `voucher`
6. ✅ Registra venda em `online_sales`
7. ✅ Registra importação em `imported_sales` (controle de duplicatas)

**Payload de Exemplo:**
```json
{
  "action": "CP",
  "data": {
    "order": {
      "id": 12345,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Juliana Santos",
      "email": "juliana@example.com",
      "phone": "11999999999",
      "cpf": "123.456.789-00",
      "paymentType": "PIX",
      "paymentSituation": "PAGO",
      "paymentConfirmeDate": "2024-12-20T14:30:00.000Z",
      "totalValue": 150.0,
      "totalTax": 5.0,
      "discount": 10.0,
      "createdAt": "2024-12-20T14:00:00.000Z"
    },
    "eventTicketCodes": [
      {
        "id": 1001,
        "voucher": "ABC123XYZ",
        "date": "2024-12-25",
        "time": "20:00",
        "used": false,
        "dateTimeUsed": null,
        "name": "João Silva",
        "email": "joao@example.com",
        "phone": "11988888888",
        "document": "987.654.321-00"
      }
    ],
    "event": {
      "id": 50,
      "name": "Rua Iluminada 2024",
      "slug": "rua-iluminada-2024"
    }
  }
}
```

---

### Estorno (action: "ES")

Quando uma compra é estornada no Compre no Zet, o webhook é acionado com `action: "ES"`.

**Processamento:**

1. ✅ Valida estrutura do payload
2. ✅ Busca `order` pelo `payment_reference` (uuid)
3. ✅ Atualiza status do pedido para `payment_status: "refunded"`
4. ✅ Invalida todos os tickets (`status: "cancelled"`)
5. ✅ Atualiza contador de estornos em `online_sales`

**Payload de Exemplo:**
```json
{
  "action": "ES",
  "data": {
    "order": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "paymentSituation": "ESTORNADO"
    },
    "eventTicketCodes": [
      {
        "voucher": "ABC123XYZ"
      }
    ]
  }
}
```

---

## 🗄️ Estrutura de Dados

### Tabela: `events`

Novas colunas adicionadas para mapeamento:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `external_id` | varchar(255) | ID do evento no Compre no Zet |
| `external_slug` | varchar(255) | Slug do evento no Compre no Zet |

### Tabela: `tickets`

Novas colunas adicionadas:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `external_voucher` | varchar(255) | Código do voucher do Compre no Zet |
| `ticket_holder_name` | text | Nome do titular do ingresso |
| `ticket_holder_email` | text | Email do titular |
| `ticket_holder_cpf` | varchar(14) | CPF do titular |

> **Nota:** O titular do ingresso pode ser diferente do comprador do pedido.

---

## 🔐 Segurança

### Validações Implementadas

- ✅ Verificação de estrutura de payload
- ✅ Validação de `action` (`CP` ou `ES` apenas)
- ✅ Verificação de `paymentSituation` correspondente
- ✅ Idempotência via `order.uuid` (previne duplicatas)
- ✅ Rate limiting (via sistema global)
- ✅ HTTPS obrigatório
- ✅ Logging detalhado de todas as operações

### CORS

O webhook aceita requisições de qualquer origem (necessário para webhooks):

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## 📊 Mapeamento de Dados

| Campo Compre no Zet | Campo Sistema | Tabela |
|---------------------|---------------|---------|
| `order.uuid` | `payment_reference` | `orders` |
| `order.name` | `customer_name` | `orders` |
| `order.email` | `customer_email` | `orders` |
| `order.cpf` | `customer_cpf` | `orders` |
| `order.paymentType` | `payment_method` | `orders` |
| `order.totalValue - discount` | `total_amount` | `orders` |
| `eventTicketCodes[].voucher` | `qr_code` + `external_voucher` | `tickets` |
| `eventTicketCodes[].name` | `ticket_holder_name` | `tickets` |
| `eventTicketCodes[].email` | `ticket_holder_email` | `tickets` |
| `eventTicketCodes[].document` | `ticket_holder_cpf` | `tickets` |
| `event.name` ou `event.slug` | `event_id` (via lookup) | `orders` |

### Tipos de Pagamento

| Compre no Zet | Sistema Interno |
|---------------|-----------------|
| `PIX` | `comprenozet_pix` |
| `CREDITO` | `comprenozet_credito` |
| `DEBITO` | `comprenozet_debito` |

---

## 🧪 Testes

### Teste de Compra Confirmada

```bash
curl -X POST https://apizet.ruailuminada.com/webhook/comprenozet \
  -H "Content-Type: application/json" \
  -d '{
    "action": "CP",
    "data": {
      "order": {
        "id": 99999,
        "uuid": "test-550e8400-e29b-41d4",
        "name": "Teste Silva",
        "email": "teste@example.com",
        "phone": "11999999999",
        "cpf": "123.456.789-00",
        "paymentType": "PIX",
        "paymentSituation": "PAGO",
        "paymentConfirmeDate": "2024-12-20T14:30:00.000Z",
        "totalValue": 100.0,
        "totalTax": 5.0,
        "discount": 0.0,
        "createdAt": "2024-12-20T14:00:00.000Z"
      },
      "eventTicketCodes": [{
        "id": 9999,
        "voucher": "TEST-ABC123",
        "date": "2024-12-25",
        "time": "20:00",
        "used": false,
        "dateTimeUsed": null,
        "name": "Teste Titular",
        "email": "titular@example.com",
        "phone": "11988888888",
        "document": "987.654.321-00"
      }],
      "event": {
        "id": 1,
        "name": "Rua Iluminada 2024",
        "slug": "rua-iluminada-2024"
      }
    }
  }'
```

### Teste de Estorno

```bash
curl -X POST https://apizet.ruailuminada.com/webhook/comprenozet \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ES",
    "data": {
      "order": {
        "uuid": "test-550e8400-e29b-41d4",
        "paymentSituation": "ESTORNADO"
      },
      "eventTicketCodes": [{
        "voucher": "TEST-ABC123"
      }]
    }
  }'
```

---

## 🔍 Troubleshooting

### Webhook não está chegando

1. **Verificar URL cadastrada no Compre no Zet:**
   - URL deve ser exatamente: `https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/comprenozet-webhook`
   - Método: POST
   - Content-Type: application/json

2. **Verificar logs da Edge Function:**
   - Acessar: [Edge Function Logs](https://supabase.com/dashboard/project/tzqriohyfazftfulwcuj/functions/comprenozet-webhook/logs)
   - Procurar por erros ou avisos

3. **Testar manualmente** usando o comando curl acima

### Evento não encontrado

Se aparecer erro `Event not found`, verifique:

1. **Mapeamento do evento:**
   - O evento deve existir na tabela `events`
   - Deve ter `name`, `external_slug` ou `external_id` correspondente

2. **Adicionar mapeamento manual:**
   ```sql
   UPDATE events 
   SET external_slug = 'rua-iluminada-2024',
       external_id = '50'
   WHERE name ILIKE '%Rua Iluminada%';
   ```

### Webhooks duplicados

O sistema implementa idempotência usando `order.uuid`. Se o mesmo `uuid` chegar novamente:
- A operação será pulada
- Log: `⚠️ Duplicate webhook detected, skipping: {uuid}`
- Resposta: `200 OK` (para evitar retry)

### Titular ≠ Comprador

É **normal** que os dados do titular do ingresso sejam diferentes do comprador:
- `order.name/email/cpf` = comprador
- `eventTicketCodes[].name/email/document` = titular do ingresso

O sistema armazena ambos corretamente:
- Comprador em `orders.customer_*`
- Titular em `tickets.ticket_holder_*`

---

## 📈 Monitoramento

### Métricas Importantes

1. **Taxa de sucesso:** Deve ser >99%
2. **Tempo de resposta:** <2 segundos
3. **Duplicatas detectadas:** Normal, indica que webhooks estão sendo reenviados
4. **Eventos não encontrados:** Requer atenção, indica falta de mapeamento

### Logs

Todos os webhooks geram logs detalhados:

```
📥 Webhook received from Compre no Zet: { action: 'CP', orderId: '...', event: '...' }
✅ Event mapped: { external: '...', internal: '...' }
✅ Order created: abc123...
✅ Ticket created: TEST-ABC123
✅ Purchase processed successfully: { orderUuid: '...', tickets: 2, amount: 150 }
```

---

## 🚀 Configuração Inicial

### 1. Cadastrar URL no Compre no Zet

1. Acessar portal do Compre no Zet
2. Ir em Configurações → Webhooks
3. Adicionar nova URL: `https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/comprenozet-webhook`
4. Selecionar eventos: "Compra Confirmada" e "Estorno"
5. Salvar

### 2. Mapear Eventos

Para cada evento vendido no Compre no Zet, adicionar mapeamento:

```sql
UPDATE events 
SET external_slug = 'slug-do-comprenozet',
    external_id = 'id-do-comprenozet'
WHERE name = 'Nome do Evento Interno';
```

### 3. Testar Integração

1. Fazer uma compra de teste no Compre no Zet
2. Verificar logs da Edge Function
3. Confirmar criação de order e tickets no banco
4. Testar validação do QR code

---

## 📝 Notas Importantes

1. **Não há retry automático:** Se o webhook falhar, o Compre no Zet pode não reenviar automaticamente. O sistema deve estar sempre disponível.

2. **Múltiplos ingressos:** Um único pedido pode ter múltiplos ingressos. Cada um gera um `ticket` individual no sistema.

3. **Sessões automáticas:** Se não existir uma sessão para a data atual, o sistema cria uma automaticamente com capacidade de 1000 ingressos.

4. **Tipo de ingresso padrão:** Se não existir um ticket_type "Ingresso Compre no Zet", o sistema cria automaticamente.

5. **QR Code:** O voucher do Compre no Zet é usado como QR code. O sistema armazena em `tickets.qr_code` e `tickets.external_voucher`.

---

## 🔧 Troubleshooting do Proxy

### Verificar se o proxy está funcionando

```bash
curl -X POST https://apizet.ruailuminada.com/webhook/comprenozet \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

Resposta esperada (400): `{"error": "Invalid payload structure"}`

### Logs do Cloudflare Worker

1. Acessar: https://dash.cloudflare.com
2. Ir em **Workers & Pages**
3. Selecionar `comprenozet-webhook-proxy`
4. Clicar em **Logs** (Real-time logs)
5. Verificar requisições e erros

### DNS não propagou

Se `apizet.ruailuminada.com` não resolver:
1. Verificar DNS: https://dnschecker.org
2. Aguardar até 24h (normalmente 5-10min)
3. Limpar cache DNS local: `ipconfig /flushdns` (Windows) ou `sudo dscacheutil -flushcache` (Mac)

---

## 🆘 Suporte

Para problemas com a integração:

1. Verificar logs da Edge Function
2. Consultar esta documentação
3. Verificar status do Supabase: https://status.supabase.com
4. Contatar suporte técnico do Compre no Zet

---

**Última atualização:** 2025-10-07  
**Versão da integração:** 1.0.0  
**Edge Function:** `comprenozet-webhook`
