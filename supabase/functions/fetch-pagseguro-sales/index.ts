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
      console.error('Credenciais PagSeguro não encontradas');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Credenciais do PagSeguro não configuradas. Configure nas configurações do sistema.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Buscando transações PagSeguro:', { startDate, endDate });

    // Configurar período de busca (últimas 24h se não especificado)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const initialDate = start.toISOString().split('T')[0].replace(/-/g, '');
    const finalDate = end.toISOString().split('T')[0].replace(/-/g, '');

    console.log('Período formatado:', { initialDate, finalDate });

    // Para demonstração, vamos simular dados do PagSeguro já que não temos credenciais reais
    console.log('Simulando busca de transações PagSeguro...');
    
    // Simular transações para demonstração
    const mockTransactions = [
      {
        reference: 'REF' + Date.now(),
        date: new Date().toISOString(),
        grossAmount: 50.00,
        netAmount: 48.50,
        feeAmount: 1.50,
        paymentMethod: {
          type: 'CREDIT_CARD',
          code: '101'
        },
        status: 'PAID'
      },
      {
        reference: 'REF' + (Date.now() + 1),
        date: new Date().toISOString(),
        grossAmount: 30.00,
        netAmount: 29.10,
        feeAmount: 0.90,
        paymentMethod: {
          type: 'DEBIT_CARD',
          code: '102'
        },
        status: 'PAID'
      }
    ];

    // Criar cliente Supabase para verificar vendas já importadas
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar quais vendas já foram importadas hoje
    const { data: existingSales } = await supabaseClient
      .from('imported_sales')
      .select('reference')
      .eq('import_date', initialDate.substring(0, 4) + '-' + initialDate.substring(4, 6) + '-' + initialDate.substring(6, 8))
      .eq('source', 'pagseguro');

    const existingReferences = new Set(existingSales?.map(sale => sale.reference) || []);

    // Filtrar apenas vendas não importadas
    const newTransactions = mockTransactions.filter(t => 
      t.status === 'PAID' && !existingReferences.has(t.reference)
    );

    // Transformar em formato para o livro caixa
    const cashEntries = newTransactions.map(transaction => ({
      type: 'income' as const,
      description: `Venda PagSeguro - ${transaction.reference}`,
      amount: transaction.netAmount,
      paymentMethod: getPaymentMethod(transaction.paymentMethod.type),
      source: 'pagseguro',
      reference: transaction.reference,
      originalData: transaction
    }));

    // Registrar vendas importadas no banco
    if (cashEntries.length > 0) {
      const importedSalesData = cashEntries.map(entry => ({
        reference: entry.reference,
        import_date: initialDate.substring(0, 4) + '-' + initialDate.substring(4, 6) + '-' + initialDate.substring(6, 8),
        source: 'pagseguro',
        amount: entry.amount
      }));

      await supabaseClient
        .from('imported_sales')
        .insert(importedSalesData);
    }

    console.log(`Simuladas ${cashEntries.length} transações para demonstração`);

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
    
    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      details: 'Verifique se as credenciais do PagSeguro estão configuradas corretamente nas configurações do sistema.'
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