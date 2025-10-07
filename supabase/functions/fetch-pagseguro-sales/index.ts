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

    // Detectar ambiente (sandbox ou produção)
    const pagseguroEnvironment = Deno.env.get('PAGSEGURO_ENVIRONMENT') || 'sandbox';
    const apiUrl = pagseguroEnvironment === 'production' 
      ? 'https://ws.pagseguro.uol.com.br/v4/transactions'
      : 'https://ws.sandbox.pagseguro.uol.com.br/v4/transactions';
    
    console.log(`Buscando transações reais do PagSeguro (${pagseguroEnvironment})...`);

    // Implementar retry logic
    let transactions: PagSeguroTransaction[] = [];
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch(
          `${apiUrl}?initialDate=${initialDate}&finalDate=${finalDate}&page=1&maxPageResults=100`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${pagseguroToken}`,
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Credenciais PagSeguro inválidas. Verifique o token e email configurados.');
          } else if (response.status === 429) {
            // Rate limit - aguardar antes de tentar novamente
            const waitTime = Math.pow(2, retryCount) * 1000; // Backoff exponencial
            console.log(`Rate limit atingido. Aguardando ${waitTime}ms antes de retry ${retryCount + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
            continue;
          } else {
            throw new Error(`Erro na API PagSeguro: ${response.status} - ${response.statusText}`);
          }
        }

        const data = await response.json();
        
        // Parsear resposta da API do PagSeguro
        if (data.transactions && Array.isArray(data.transactions)) {
          transactions = data.transactions.filter((t: any) => t.status === 'PAID');
        } else if (data.transaction) {
          // Resposta única
          transactions = data.transaction.status === 'PAID' ? [data.transaction] : [];
        }
        
        console.log(`Encontradas ${transactions.length} transações pagas`);
        break; // Sucesso - sair do loop
        
      } catch (error: any) {
        console.error(`Tentativa ${retryCount + 1}/${maxRetries} falhou:`, error.message);
        
        if (retryCount === maxRetries - 1) {
          // Última tentativa falhou - retornar erro
          throw error;
        }
        
        // Aguardar antes de tentar novamente (backoff exponencial)
        const waitTime = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retryCount++;
      }
    }

    // Criar cliente Supabase para verificar vendas já importadas
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar quais vendas já foram importadas
    const { data: existingSales } = await supabaseClient
      .from('imported_sales')
      .select('reference')
      .eq('source', 'pagseguro');

    const existingReferences = new Set(existingSales?.map(sale => sale.reference) || []);

    // Filtrar apenas vendas não importadas
    const newTransactions = transactions.filter(t => 
      !existingReferences.has(t.reference)
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

    console.log(`Importadas ${cashEntries.length} transações reais do PagSeguro (${pagseguroEnvironment})`);

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