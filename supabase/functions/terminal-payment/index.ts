import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerCPF: string;
  description: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId, amount, customerName, customerEmail, customerCPF, description }: PaymentRequest = await req.json();

    // Obter configurações do PagSeguro
    const pagseguroEmail = Deno.env.get("PAGSEGURO_EMAIL");
    const pagseguroToken = Deno.env.get("PAGSEGURO_TOKEN");

    if (!pagseguroEmail || !pagseguroToken) {
      throw new Error("Configurações do PagSeguro não encontradas");
    }

    // Criar pagamento no PagSeguro
    const paymentData = {
      email: pagseguroEmail,
      token: pagseguroToken,
      currency: "BRL",
      itemId1: "INGRESSO",
      itemDescription1: description,
      itemAmount1: amount.toFixed(2),
      itemQuantity1: "1",
      senderName: customerName,
      senderEmail: customerEmail,
      senderCPF: customerCPF,
      paymentMode: "default",
      paymentMethod: "CREDIT_CARD,DEBIT_CARD,BOLETO,PIX",
      redirectURL: `${new URL(req.url).origin}/terminal?success=true`,
      notificationURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-payment-confirmation`
    };

    // Fazer requisição para PagSeguro
    const formData = new URLSearchParams();
    Object.entries(paymentData).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    console.log("Criando pagamento PagSeguro para terminal:", { orderId, amount });

    const pagseguroResponse = await fetch("https://ws.sandbox.pagseguro.uol.com.br/v2/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    const responseText = await pagseguroResponse.text();
    
    if (!pagseguroResponse.ok) {
      console.error("Erro PagSeguro:", responseText);
      throw new Error(`Erro ao criar pagamento: ${responseText}`);
    }

    // Parse da resposta XML do PagSeguro
    const codeMatch = responseText.match(/<code>(.*?)<\/code>/);
    const paymentCode = codeMatch ? codeMatch[1] : null;

    if (!paymentCode) {
      throw new Error("Código de pagamento não encontrado na resposta");
    }

    // Atualizar pedido com referência do pagamento
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_reference: paymentCode,
        payment_status: "pending"
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Erro ao atualizar pedido:", updateError);
      throw updateError;
    }

    // URL de pagamento do PagSeguro
    const paymentUrl = `https://sandbox.pagseguro.uol.com.br/v2/checkout/payment.html?code=${paymentCode}`;

    console.log("Pagamento criado com sucesso:", { paymentCode, paymentUrl });

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl,
        paymentCode,
        orderId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Erro na criação do pagamento:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});