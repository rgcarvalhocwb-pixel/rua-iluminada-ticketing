import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentConfirmation {
  orderId: string;
  paymentReference?: string;
  paymentStatus: 'approved' | 'pending' | 'rejected';
  paymentMethod?: string;
  totalAmount: number;
  isTerminalSale?: boolean;
  eventId?: string;
  ticketTypeId?: string;
  quantity?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const confirmationData: PaymentConfirmation = await req.json();
    
    console.log('Processando confirmação de pagamento:', confirmationData);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar detalhes do pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          ticket_types (
            name,
            event_id,
            events (
              name,
              start_date
            )
          )
        ),
        event_sessions (
          event_id,
          session_date
        )
      `)
      .eq('id', confirmationData.orderId)
      .single();

    if (orderError) {
      throw new Error('Pedido não encontrado: ' + orderError.message);
    }

    // Atualizar status do pagamento no pedido
    await supabase
      .from('orders')
      .update({ 
        payment_status: confirmationData.paymentStatus,
        payment_method: confirmationData.paymentMethod || 'pagseguro',
        updated_at: new Date().toISOString()
      })
      .eq('id', confirmationData.orderId);

    // Se o pagamento foi aprovado e é uma venda do terminal, registrar no caixa diário
    if (confirmationData.paymentStatus === 'approved' && confirmationData.isTerminalSale) {
      console.log('Registrando venda do terminal no caixa diário...');
      
      // Buscar detalhes do evento para determinar a data
      const eventId = order.order_items?.[0]?.ticket_types?.event_id;
      const sessionDate = order.event_sessions?.session_date || new Date().toISOString().split('T')[0];
      
      if (eventId) {
        // Registrar na tabela online_sales para integração com o sistema de caixa
        const totalQuantity = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1;
        const avgUnitPrice = confirmationData.totalAmount / totalQuantity;

        const onlineSaleEntry = {
          event_id: eventId,
          sale_date: sessionDate,
          ticket_type: `Terminal - ${order.order_items?.[0]?.ticket_types?.name || 'Ingresso'}`,
          quantity_sold: totalQuantity,
          quantity_refunded: 0,
          unit_price: avgUnitPrice,
          platform_name: 'Terminal Autoatendimento'
        };

        const { error: salesError } = await supabase
          .from('online_sales')
          .insert(onlineSaleEntry);

        if (salesError) {
          console.error('Erro ao registrar venda online:', salesError);
        } else {
          console.log('Venda do terminal registrada no sistema:', onlineSaleEntry);
        }

        // Também registrar na tabela imported_sales para controle financeiro
        const importedSaleEntry = {
          reference: `TERMINAL_${order.id}`,
          import_date: sessionDate,
          source: 'terminal',
          amount: confirmationData.totalAmount
        };

        const { error: importError } = await supabase
          .from('imported_sales')
          .insert(importedSaleEntry);

        if (importError) {
          console.error('Erro ao registrar venda importada:', importError);
        } else {
          console.log('Venda registrada como venda importada para controle financeiro');
        }
      }

      // Criar ingressos se o pagamento foi aprovado
      const ticketsToCreate = [];
      
      for (const orderItem of order.order_items || []) {
        for (let i = 0; i < orderItem.quantity; i++) {
          ticketsToCreate.push({
            order_item_id: orderItem.id,
            ticket_number: `TM${Date.now()}${Math.floor(Math.random() * 1000)}`,
            qr_code: generateQRCode(),
            status: 'valid',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      if (ticketsToCreate.length > 0) {
        const { error: ticketsError } = await supabase
          .from('tickets')
          .insert(ticketsToCreate);

        if (ticketsError) {
          console.error('Erro ao criar ingressos:', ticketsError);
        } else {
          console.log(`${ticketsToCreate.length} ingressos criados com sucesso`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Confirmação de pagamento processada com sucesso',
      orderId: confirmationData.orderId,
      status: confirmationData.paymentStatus
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao processar confirmação de pagamento:', error);
    
    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function getPaymentMethodForCash(pagseguroMethod: string): 'cash' | 'credit' | 'debit' | 'pix' {
  switch (pagseguroMethod.toLowerCase()) {
    case 'credit_card':
    case 'cartao_credito':
      return 'credit';
    case 'debit_card':
    case 'cartao_debito':
      return 'debit';
    case 'pix':
      return 'pix';
    default:
      return 'credit'; // Default para cartão de crédito
  }
}

function generateQRCode(): string {
  return 'QR' + Date.now().toString() + Math.floor(Math.random() * 10000).toString();
}