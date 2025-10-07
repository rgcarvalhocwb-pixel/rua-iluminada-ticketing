import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Iniciando limpeza de dados de teste...');

    // Tabelas em ordem (respeitando foreign keys)
    const tables = [
      'validations',
      'tickets',
      'order_items',
      'orders',
      'event_sessions',
      'show_times',
      'ticket_types',
      'events',
      'store_daily_sales',
      'stores',
      'turnstiles',
      'imported_sales'
    ];

    let totalDeleted = 0;
    const deletionReport: Record<string, number> = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .delete({ count: 'exact' })
          .eq('is_test_data', true);

        if (error) {
          console.error(`Erro ao limpar ${table}:`, error);
          deletionReport[table] = 0;
        } else {
          totalDeleted += count || 0;
          deletionReport[table] = count || 0;
          console.log(`✅ Limpados ${count} registros de ${table}`);
        }
      } catch (err) {
        console.error(`Exceção ao limpar ${table}:`, err);
        deletionReport[table] = 0;
      }
    }

    console.log(`Limpeza concluída. Total de registros removidos: ${totalDeleted}`);

    return new Response(JSON.stringify({
      success: true,
      deletedRecords: totalDeleted,
      report: deletionReport,
      message: `${totalDeleted} registros de teste removidos com sucesso`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro na limpeza:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
