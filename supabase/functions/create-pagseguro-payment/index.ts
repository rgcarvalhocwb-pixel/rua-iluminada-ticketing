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

    // Construir XML para API do PagSeguro
    const checkoutXml = buildCheckoutXml(paymentData);
    console.log('XML do checkout:', checkoutXml);

    // Fazer requisição para API do PagSeguro
    const pagseguroUrl = 'https://ws.sandbox.pagseguro.uol.com.br/v2/checkout';
    
    const response = await fetch(pagseguroUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: pagseguroEmail,
        token: pagseguroToken,
        ...parseXmlToParams(checkoutXml)
      })
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

function buildCheckoutXml(data: PaymentRequest): string {
  const items = data.items.map((item, index) => 
    `<item>
      <id>${index + 1}</id>
      <description>${item.name}</description>
      <amount>${item.price.toFixed(2)}</amount>
      <quantity>${item.quantity}</quantity>
    </item>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<checkout>
  <currency>BRL</currency>
  <items>
    ${items}
  </items>
  <reference>${data.orderId}</reference>
  <sender>
    <name>${data.customerName}</name>
    <email>${data.customerEmail}</email>
    <documents>
      <document>
        <type>CPF</type>
        <value>${data.customerCpf}</value>
      </document>
    </documents>
  </sender>
  <redirectURL>https://f8e882a1-3df0-405f-9761-156eb73300cf.lovableproject.com</redirectURL>
  <maxAge>120</maxAge>
  <maxUses>1</maxUses>
</checkout>`;
}

function parseXmlToParams(xml: string): Record<string, string> {
  // Converter XML em parâmetros para PagSeguro
  const params: Record<string, string> = {};
  
  // Currency
  params.currency = 'BRL';
  
  // Reference
  const refMatch = xml.match(/<reference>([^<]+)<\/reference>/);
  if (refMatch) params.reference = refMatch[1];
  
  // Redirect URL
  const urlMatch = xml.match(/<redirectURL>([^<]+)<\/redirectURL>/);
  if (urlMatch) params.redirectURL = urlMatch[1];
  
  // MaxAge e MaxUses
  params.maxAge = '120';
  params.maxUses = '1';
  
  // Sender
  const nameMatch = xml.match(/<name>([^<]+)<\/name>/);
  if (nameMatch) params.senderName = nameMatch[1];
  
  const emailMatch = xml.match(/<email>([^<]+)<\/email>/);
  if (emailMatch) params.senderEmail = emailMatch[1];
  
  const cpfMatch = xml.match(/<value>([^<]+)<\/value>/);
  if (cpfMatch) params.senderCPF = cpfMatch[1];
  
  // Items
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g);
  if (itemMatches) {
    itemMatches.forEach((item, index) => {
      const num = index + 1;
      
      const descMatch = item.match(/<description>([^<]+)<\/description>/);
      if (descMatch) params[`itemDescription${num}`] = descMatch[1];
      
      const amountMatch = item.match(/<amount>([^<]+)<\/amount>/);
      if (amountMatch) params[`itemAmount${num}`] = amountMatch[1];
      
      const qtyMatch = item.match(/<quantity>([^<]+)<\/quantity>/);
      if (qtyMatch) params[`itemQuantity${num}`] = qtyMatch[1];
      
      params[`itemId${num}`] = num.toString();
    });
  }
  
  return params;
}