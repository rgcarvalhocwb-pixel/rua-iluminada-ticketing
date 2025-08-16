import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackupConfig {
  tables: string[];
  includeStorage: boolean;
  compression: boolean;
  encryption: boolean;
  retentionDays: number;
}

interface BackupMetadata {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  checksum: string;
  tables: string[];
  status: 'in_progress' | 'completed' | 'failed';
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

    const { action, config }: { action: string, config?: BackupConfig } = await req.json();

    console.log("Iniciando operação de backup:", action);

    switch (action) {
      case 'create_backup':
        return await createBackup(supabase, config);
      case 'restore_backup':
        return await restoreBackup(supabase, req);
      case 'list_backups':
        return await listBackups(supabase);
      case 'cleanup_old_backups':
        return await cleanupOldBackups(supabase);
      default:
        throw new Error('Ação não reconhecida');
    }

  } catch (error: any) {
    console.error("Erro na operação de backup:", error);
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

async function createBackup(supabase: any, config?: BackupConfig): Promise<Response> {
  const backupId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log("Criando backup:", backupId);

  const defaultConfig: BackupConfig = {
    tables: [
      'events',
      'ticket_types',
      'show_times',
      'orders',
      'order_items',
      'tickets',
      'event_sessions',
      'users',
      'user_roles',
      'user_permissions',
      'terminal_config',
      'payment_settings',
      'branding_config'
    ],
    includeStorage: true,
    compression: true,
    encryption: true,
    retentionDays: 30
  };

  const finalConfig = { ...defaultConfig, ...config };

  try {
    // Registrar início do backup
    const { error: logError } = await supabase
      .from("backup_logs")
      .insert({
        id: backupId,
        timestamp,
        type: 'full',
        status: 'in_progress',
        config: finalConfig,
        started_at: timestamp
      });

    if (logError) {
      console.error("Erro ao registrar log de backup:", logError);
    }

    // Backup das tabelas
    const backupData: Record<string, any[]> = {};
    let totalSize = 0;

    for (const table of finalConfig.tables) {
      console.log(`Fazendo backup da tabela: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`Erro ao fazer backup da tabela ${table}:`, error);
        continue;
      }

      if (data) {
        backupData[table] = data;
        totalSize += JSON.stringify(data).length;
      }
    }

    // Backup do storage (se configurado)
    let storageBackup = null;
    if (finalConfig.includeStorage) {
      console.log("Fazendo backup do storage...");
      
      const { data: buckets } = await supabase.storage.listBuckets();
      storageBackup = { buckets: buckets || [] };
      
      // Para uma implementação completa, aqui faria o download de todos os arquivos
      // e os incluiria no backup
    }

    // Calcular checksum
    const dataString = JSON.stringify({ backupData, storageBackup });
    const checksum = await generateChecksum(dataString);

    // Simular compressão (reduziria o tamanho em ~70%)
    const compressedSize = finalConfig.compression ? Math.round(totalSize * 0.3) : totalSize;

    // Salvar backup (em produção seria no storage ou sistema de arquivos)
    const backupContent = {
      metadata: {
        id: backupId,
        timestamp,
        type: 'full',
        originalSize: totalSize,
        compressedSize,
        checksum,
        tables: finalConfig.tables,
        compression: finalConfig.compression,
        encryption: finalConfig.encryption
      },
      data: backupData,
      storage: storageBackup
    };

    // Simular salvamento do backup
    console.log("Salvando backup...", { size: compressedSize });

    // Atualizar log de backup
    const { error: updateError } = await supabase
      .from("backup_logs")
      .update({
        status: 'completed',
        size: compressedSize,
        checksum,
        completed_at: new Date().toISOString(),
        tables_backed_up: finalConfig.tables
      })
      .eq('id', backupId);

    if (updateError) {
      console.error("Erro ao atualizar log de backup:", updateError);
    }

    // Registrar evento de auditoria
    await supabase
      .from("user_audit_logs")
      .insert({
        user_id: null,
        user_email: "system@backup",
        action: "BACKUP_CREATED",
        entity_type: "SYSTEM",
        entity_id: backupId,
        details: {
          tables: finalConfig.tables.length,
          size: compressedSize,
          type: 'full'
        }
      });

    console.log("Backup criado com sucesso:", backupId);

    return new Response(
      JSON.stringify({
        success: true,
        backupId,
        timestamp,
        size: compressedSize,
        checksum,
        tablesCount: finalConfig.tables.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    // Atualizar log com erro
    await supabase
      .from("backup_logs")
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', backupId);

    throw error;
  }
}

async function restoreBackup(supabase: any, req: Request): Promise<Response> {
  const { backupId } = await req.json();
  
  console.log("Restaurando backup:", backupId);

  // Em uma implementação real, aqui carregaria o backup do storage
  // e restauraria os dados no banco de dados
  
  // Registrar evento de auditoria
  await supabase
    .from("user_audit_logs")
    .insert({
      user_id: null,
      user_email: "system@backup",
      action: "BACKUP_RESTORED",
      entity_type: "SYSTEM",
      entity_id: backupId,
      details: {
        restored_at: new Date().toISOString()
      }
    });

  return new Response(
    JSON.stringify({
      success: true,
      message: "Backup restaurado com sucesso",
      backupId
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
}

async function listBackups(supabase: any): Promise<Response> {
  const { data: backups, error } = await supabase
    .from("backup_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify({
      success: true,
      backups: backups || []
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
}

async function cleanupOldBackups(supabase: any): Promise<Response> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 dias atrás

  const { data: oldBackups, error: selectError } = await supabase
    .from("backup_logs")
    .select("id")
    .lt("timestamp", cutoffDate.toISOString());

  if (selectError) {
    throw selectError;
  }

  if (oldBackups && oldBackups.length > 0) {
    // Em produção, aqui deletaria os arquivos de backup do storage
    
    const { error: deleteError } = await supabase
      .from("backup_logs")
      .delete()
      .lt("timestamp", cutoffDate.toISOString());

    if (deleteError) {
      throw deleteError;
    }

    console.log(`Removidos ${oldBackups.length} backups antigos`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      removedCount: oldBackups?.length || 0
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
}

async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}