import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

interface ExternalSaleData {
  // Dados obrigatórios
  platform_name: string;
  event_external_id: string; // ID do evento na plataforma externa
  ticket_type: string;
  quantity_sold: number;
  unit_price: number;
  sale_date: string; // YYYY-MM-DD
  
  // Dados opcionais
  quantity_refunded?: number;
  customer_name?: string;
  customer_email?: string;
  customer_cpf?: string;
  payment_method?: 'credit' | 'debit' | 'pix' | 'boleto';
  
  // Dados de controle
  external_sale_id: string; // ID único da venda na plataforma externa
  webhook_signature?: string; // Assinatura para validação
}

interface ExternalTransferData {
  platform_name: string;
  transfer_date: string; // YYYY-MM-DD
  expected_amount: number;
  received_amount?: number;
  status: 'pending' | 'received' | 'cancelled';
  notes?: string;
  external_transfer_id: string;
}

interface WebhookPayload {
  type: 'sale' | 'transfer' | 'refund';
  timestamp: string;
  data: ExternalSaleData | ExternalTransferData;
  signature?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Método não permitido. Use POST.' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: WebhookPayload = await req.json();
    
    // Validar assinatura do webhook (segurança)
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    if (webhookSecret && payload.signature) {
      const expectedSignature = await generateSignature(JSON.stringify(payload.data), webhookSecret);
      if (payload.signature !== expectedSignature) {
        console.error('Assinatura do webhook inválida');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Assinatura inválida' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let result;
    
    switch (payload.type) {
      case 'sale':
        result = await handleSaleWebhook(supabaseClient, payload.data as ExternalSaleData);
        break;
      case 'transfer':
        result = await handleTransferWebhook(supabaseClient, payload.data as ExternalTransferData);
        break;
      case 'refund':
        result = await handleRefundWebhook(supabaseClient, payload.data as ExternalSaleData);
        break;
      default:
        throw new Error('Tipo de webhook não suportado');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processado com sucesso',
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleSaleWebhook(supabase: any, saleData: ExternalSaleData) {
  console.log('Processando venda:', saleData);

  // Verificar se a venda já foi processada
  const { data: existingSale } = await supabase
    .from('imported_sales')
    .select('id')
    .eq('reference', saleData.external_sale_id)
    .eq('source', saleData.platform_name.toLowerCase())
    .single();

  if (existingSale) {
    console.log('Venda já processada:', saleData.external_sale_id);
    return { message: 'Venda já processada', skipped: true };
  }

  // Buscar evento interno pelo ID externo ou nome
  let eventId = null;
  
  // Primeiro tentar buscar por algum campo de referência externa (se existir)
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .or(`name.ilike.%${saleData.event_external_id}%,description.ilike.%${saleData.event_external_id}%`)
    .single();

  if (event) {
    eventId = event.id;
  } else {
    // Se não encontrar, criar um evento temporário ou usar o primeiro disponível
    const { data: defaultEvent } = await supabase
      .from('events')
      .select('id')
      .limit(1)
      .single();
    
    eventId = defaultEvent?.id;
    
    if (!eventId) {
      throw new Error('Nenhum evento encontrado no sistema. Configure pelo menos um evento.');
    }
  }

  // Registrar venda online
  const onlineSaleEntry = {
    event_id: eventId,
    platform_name: saleData.platform_name,
    ticket_type: saleData.ticket_type,
    quantity_sold: saleData.quantity_sold,
    quantity_refunded: saleData.quantity_refunded || 0,
    unit_price: saleData.unit_price,
    sale_date: saleData.sale_date
  };

  const { data: insertedSale, error: salesError } = await supabase
    .from('online_sales')
    .insert(onlineSaleEntry)
    .select()
    .single();

  if (salesError) {
    throw new Error(`Erro ao inserir venda: ${salesError.message}`);
  }

  // Registrar na tabela de importações para evitar duplicatas
  const importedSaleEntry = {
    reference: saleData.external_sale_id,
    source: saleData.platform_name.toLowerCase(),
    import_date: new Date().toISOString().split('T')[0],
    amount: saleData.unit_price * saleData.quantity_sold
  };

  await supabase
    .from('imported_sales')
    .insert(importedSaleEntry);

  console.log('Venda processada com sucesso:', insertedSale);
  
  return {
    sale_id: insertedSale.id,
    event_id: eventId,
    total_amount: saleData.unit_price * saleData.quantity_sold
  };
}

async function handleTransferWebhook(supabase: any, transferData: ExternalTransferData) {
  console.log('Processando repasse:', transferData);

  // Verificar se o repasse já foi processado
  const { data: existingTransfer } = await supabase
    .from('online_transfers')
    .select('id')
    .eq('platform_name', transferData.platform_name)
    .eq('transfer_date', transferData.transfer_date)
    .eq('expected_amount', transferData.expected_amount)
    .single();

  if (existingTransfer) {
    // Atualizar se houver mudanças no status
    const { error: updateError } = await supabase
      .from('online_transfers')
      .update({
        received_amount: transferData.received_amount,
        status: transferData.status,
        notes: transferData.notes
      })
      .eq('id', existingTransfer.id);

    if (updateError) {
      throw new Error(`Erro ao atualizar repasse: ${updateError.message}`);
    }

    return { transfer_id: existingTransfer.id, updated: true };
  }

  // Inserir novo repasse
  const transferEntry = {
    platform_name: transferData.platform_name,
    transfer_date: transferData.transfer_date,
    expected_amount: transferData.expected_amount,
    received_amount: transferData.received_amount,
    status: transferData.status,
    notes: transferData.notes
  };

  const { data: insertedTransfer, error: transferError } = await supabase
    .from('online_transfers')
    .insert(transferEntry)
    .select()
    .single();

  if (transferError) {
    throw new Error(`Erro ao inserir repasse: ${transferError.message}`);
  }

  return { transfer_id: insertedTransfer.id, created: true };
}

async function handleRefundWebhook(supabase: any, refundData: ExternalSaleData) {
  console.log('Processando estorno:', refundData);

  // Buscar venda original
  const { data: originalSale } = await supabase
    .from('imported_sales')
    .select('*')
    .eq('reference', refundData.external_sale_id)
    .eq('source', refundData.platform_name.toLowerCase())
    .single();

  if (!originalSale) {
    throw new Error('Venda original não encontrada para estorno');
  }

  // Atualizar quantidade estornada na venda online correspondente
  const { error: updateError } = await supabase
    .from('online_sales')
    .update({
      quantity_refunded: refundData.quantity_refunded || refundData.quantity_sold
    })
    .eq('platform_name', refundData.platform_name)
    .eq('sale_date', refundData.sale_date)
    .eq('unit_price', refundData.unit_price);

  if (updateError) {
    console.error('Erro ao atualizar estorno:', updateError);
  }

  return { refund_processed: true, refunded_amount: refundData.unit_price * (refundData.quantity_refunded || refundData.quantity_sold) };
}

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}