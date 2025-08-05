import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paymentData: PaymentRequest = await req.json();
    
    const pagseguroEmail = Deno.env.get('PAGSEGURO_EMAIL');
    const pagseguroToken = Deno.env.get('PAGSEGURO_TOKEN');
    
    if (!pagseguroEmail || !pagseguroToken) {
      console.error('Credenciais PagSeguro não encontradas');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Credenciais do PagSeguro não configuradas.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Criando pagamento PagSeguro para pedido:', paymentData.orderId);

    // Construir parâmetros para API do PagSeguro
    const params = new URLSearchParams();
    params.append('email', pagseguroEmail);
    params.append('token', pagseguroToken);
    params.append('currency', 'BRL');
    params.append('reference', paymentData.orderId);
    params.append('senderName', paymentData.customerName);
    params.append('senderEmail', paymentData.customerEmail);
    params.append('senderCPF', paymentData.customerCpf.replace(/\D/g, ''));
    params.append('redirectURL', 'https://f8e882a1-3df0-405f-9761-156eb73300cf.lovableproject.com');
    params.append('maxAge', '120');
    params.append('maxUses', '1');

    // Adicionar itens
    paymentData.items.forEach((item, index) => {
      const num = index + 1;
      params.append(`itemId${num}`, num.toString());
      params.append(`itemDescription${num}`, item.name);
      params.append(`itemAmount${num}`, item.price.toFixed(2));
      params.append(`itemQuantity${num}`, item.quantity.toString());
    });

    console.log('Parâmetros para PagSeguro:', Object.fromEntries(params));

    // Fazer requisição para API do PagSeguro
    const pagseguroUrl = 'https://ws.sandbox.pagseguro.uol.com.br/v2/checkout';
    
    const response = await fetch(pagseguroUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta do PagSeguro:', errorText);
      throw new Error(`Erro do PagSeguro: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Resposta do PagSeguro:', responseText);

    // Extrair código do checkout da resposta XML
    const codeMatch = responseText.match(/<code>([^<]+)<\/code>/);
    if (!codeMatch) {
      throw new Error('Não foi possível obter o código do checkout do PagSeguro');
    }

    const checkoutCode = codeMatch[1];
    const paymentUrl = `https://sandbox.pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutCode}`;

    console.log('URL de pagamento gerada:', paymentUrl);

    // Atualizar pedido com a referência do PagSeguro
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('orders')
      .update({ payment_reference: checkoutCode })
      .eq('id', paymentData.orderId);

    return new Response(JSON.stringify({ 
      success: true, 
      paymentUrl,
      checkoutCode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao criar pagamento PagSeguro:', error);
    
    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      details: 'Verifique se as credenciais do PagSeguro estão configuradas corretamente.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});