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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const format = url.searchParams.get('format') || 'json';

    switch (action) {
      case 'backup':
        return await createBackup(supabase, format);
      
      case 'export':
        const table = url.searchParams.get('table');
        return await exportTable(supabase, table, format);
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action. Use ?action=backup or ?action=export&table=table_name' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createBackup(supabase: any, format: string) {
  const tables = [
    'events', 'ticket_types', 'orders', 'order_items', 'tickets',
    'daily_closures', 'admin_transfers', 'stores', 'store_daily_sales',
    'online_sales', 'online_transfers', 'user_roles', 'user_permissions',
    'payment_settings'
  ];

  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {} as any
  };

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) {
        console.error(`Error backing up ${table}:`, error);
        backup.data[table] = { error: error.message };
      } else {
        backup.data[table] = data;
        console.log(`Backed up ${table}: ${data?.length || 0} records`);
      }
    } catch (err) {
      console.error(`Exception backing up ${table}:`, err);
      backup.data[table] = { error: err.message };
    }
  }

  if (format === 'csv') {
    // Para CSV, criar um ZIP com múltiplos arquivos seria ideal
    // Por simplicidade, retornamos JSON mesmo
    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  }

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`
    }
  });
}

async function exportTable(supabase: any, tableName: string, format: string) {
  if (!tableName) {
    throw new Error('Table name is required');
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*');

  if (error) {
    throw new Error(`Error exporting ${tableName}: ${error.message}`);
  }

  if (format === 'csv' && data && data.length > 0) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row: any) => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${tableName}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${tableName}-${new Date().toISOString().split('T')[0]}.json"`
    }
  });
}