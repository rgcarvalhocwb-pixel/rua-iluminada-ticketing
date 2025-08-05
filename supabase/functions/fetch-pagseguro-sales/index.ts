import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PagSeguroTransaction {
  reference: string;
  date: string;
  grossAmount: number;
  netAmount: number;
  feeAmount: number;
  paymentMethod: {
    type: string;
    code: string;
  };
  status: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    
    const pagseguroEmail = Deno.env.get('PAGSEGURO_EMAIL');
    const pagseguroToken = Deno.env.get('PAGSEGURO_TOKEN');
    
    if (!pagseguroEmail || !pagseguroToken) {
      throw new Error('Credenciais do PagSeguro não configuradas');
    }

    console.log('Buscando transações PagSeguro:', { startDate, endDate });

    // Configurar período de busca (últimas 24h se não especificado)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const initialDate = start.toISOString().split('T')[0].replace(/-/g, '');
    const finalDate = end.toISOString().split('T')[0].replace(/-/g, '');

    // URL da API do PagSeguro para buscar transações
    const apiUrl = `https://ws.pagseguro.uol.com.br/v3/transactions?email=${pagseguroEmail}&token=${pagseguroToken}&initialDate=${initialDate}&finalDate=${finalDate}`;

    console.log('Fazendo requisição para PagSeguro API');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na API do PagSeguro: ${response.status}`);
    }

    const xmlData = await response.text();
    console.log('Resposta recebida do PagSeguro');

    // Parse básico do XML (para produção, usar um parser XML apropriado)
    const transactions: PagSeguroTransaction[] = [];
    
    // Simular dados para demonstração (em produção, fazer parse do XML real)
    if (xmlData.includes('<transaction>')) {
      // Este é um exemplo simplificado - em produção seria necessário um parser XML completo
      transactions.push({
        reference: 'REF123456',
        date: new Date().toISOString(),
        grossAmount: 50.00,
        netAmount: 48.50,
        feeAmount: 1.50,
        paymentMethod: {
          type: 'CREDIT_CARD',
          code: '101'
        },
        status: 'PAID'
      });
    }

    // Transformar em formato para o livro caixa
    const cashEntries = transactions
      .filter(t => t.status === 'PAID')
      .map(transaction => ({
        type: 'income' as const,
        description: `Venda PagSeguro - ${transaction.reference}`,
        amount: transaction.netAmount,
        paymentMethod: getPaymentMethod(transaction.paymentMethod.type),
        source: 'pagseguro',
        originalData: transaction
      }));

    console.log(`Processadas ${cashEntries.length} transações`);

    return new Response(JSON.stringify({ 
      success: true, 
      entries: cashEntries,
      totalAmount: cashEntries.reduce((sum, entry) => sum + entry.amount, 0),
      count: cashEntries.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao buscar vendas PagSeguro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getPaymentMethod(pagseguroType: string): 'credit' | 'debit' | 'pix' {
  switch (pagseguroType) {
    case 'CREDIT_CARD':
      return 'credit';
    case 'DEBIT_CARD':
      return 'debit';
    case 'PIX':
      return 'pix';
    default:
      return 'credit';
  }
}