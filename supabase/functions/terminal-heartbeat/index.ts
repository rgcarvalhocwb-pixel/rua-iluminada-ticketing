import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HeartbeatData {
  terminalId: string;
  status: 'online' | 'offline' | 'maintenance';
  version: string;
  location: string;
  hardware: {
    printers: { name: string; status: string }[];
    pinpads: { name: string; status: string }[];
  };
  metrics: {
    dailySales: number;
    transactionsToday: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  systemInfo: {
    os: string;
    arch: string;
    nodeVersion: string;
    diskSpace: number;
  };
}

interface SystemAlert {
  terminalId: string;
  type: 'hardware' | 'connection' | 'error' | 'warning';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
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

    const heartbeatData: HeartbeatData = await req.json();

    console.log("Processando heartbeat do terminal:", heartbeatData.terminalId);

    // Processar e analisar dados do heartbeat
    const alerts = analyzeTerminalHealth(heartbeatData);

    // Registrar heartbeat no banco
    const { error: heartbeatError } = await supabase
      .from("terminal_heartbeats")
      .upsert({
        terminal_id: heartbeatData.terminalId,
        status: heartbeatData.status,
        version: heartbeatData.version,
        location: heartbeatData.location,
        hardware_status: heartbeatData.hardware,
        metrics: heartbeatData.metrics,
        system_info: heartbeatData.systemInfo,
        last_heartbeat: new Date().toISOString(),
        alerts_count: alerts.length
      }, {
        onConflict: 'terminal_id'
      });

    if (heartbeatError) {
      console.error("Erro ao registrar heartbeat:", heartbeatError);
    }

    // Registrar alertas críticos
    for (const alert of alerts) {
      if (alert.severity === 'critical' || alert.severity === 'high') {
        const { error: alertError } = await supabase
          .from("system_alerts")
          .insert({
            terminal_id: alert.terminalId,
            type: alert.type,
            message: alert.message,
            severity: alert.severity,
            resolved: false,
            created_at: new Date().toISOString()
          });

        if (alertError) {
          console.error("Erro ao registrar alerta:", alertError);
        }
      }
    }

    // Verificar se precisa de comandos remotos
    const { data: remoteCommands } = await supabase
      .from("terminal_commands")
      .select("*")
      .eq("terminal_id", heartbeatData.terminalId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    // Marcar comandos como enviados
    if (remoteCommands && remoteCommands.length > 0) {
      const commandIds = remoteCommands.map(cmd => cmd.id);
      await supabase
        .from("terminal_commands")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .in("id", commandIds);
    }

    // Verificar atualizações disponíveis
    const { data: updateInfo } = await supabase
      .from("terminal_updates")
      .select("*")
      .eq("target_version", heartbeatData.version)
      .eq("active", true)
      .single();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      alerts: alerts.filter(a => a.severity === 'critical' || a.severity === 'high'),
      commands: remoteCommands || [],
      updateAvailable: !!updateInfo,
      updateInfo: updateInfo || null,
      nextHeartbeat: 30 // segundos
    };

    console.log("Heartbeat processado com sucesso:", {
      terminalId: heartbeatData.terminalId,
      alertsCount: alerts.length,
      commandsCount: remoteCommands?.length || 0
    });

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Erro no processamento do heartbeat:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function analyzeTerminalHealth(data: HeartbeatData): SystemAlert[] {
  const alerts: SystemAlert[] = [];

  // Verificar hardware offline
  const offlinePrinters = data.hardware.printers.filter(p => p.status === 'offline');
  const offlinePinpads = data.hardware.pinpads.filter(p => p.status === 'offline');

  if (offlinePrinters.length > 0) {
    alerts.push({
      terminalId: data.terminalId,
      type: 'hardware',
      message: `${offlinePrinters.length} impressora(s) offline: ${offlinePrinters.map(p => p.name).join(', ')}`,
      severity: offlinePrinters.length === data.hardware.printers.length ? 'critical' : 'high'
    });
  }

  if (offlinePinpads.length > 0) {
    alerts.push({
      terminalId: data.terminalId,
      type: 'hardware',
      message: `${offlinePinpads.length} pinpad(s) offline: ${offlinePinpads.map(p => p.name).join(', ')}`,
      severity: offlinePinpads.length === data.hardware.pinpads.length ? 'critical' : 'high'
    });
  }

  // Verificar métricas do sistema
  if (data.metrics.memoryUsage > 90) {
    alerts.push({
      terminalId: data.terminalId,
      type: 'error',
      message: `Uso de memória crítico: ${data.metrics.memoryUsage}%`,
      severity: 'critical'
    });
  } else if (data.metrics.memoryUsage > 80) {
    alerts.push({
      terminalId: data.terminalId,
      type: 'warning',
      message: `Uso de memória alto: ${data.metrics.memoryUsage}%`,
      severity: 'medium'
    });
  }

  if (data.metrics.cpuUsage > 95) {
    alerts.push({
      terminalId: data.terminalId,
      type: 'error',
      message: `Uso de CPU crítico: ${data.metrics.cpuUsage}%`,
      severity: 'critical'
    });
  }

  if (data.systemInfo.diskSpace < 10) {
    alerts.push({
      terminalId: data.terminalId,
      type: 'error',
      message: `Espaço em disco baixo: ${data.systemInfo.diskSpace}% disponível`,
      severity: 'high'
    });
  }

  // Verificar uptime
  if (data.metrics.uptime < 95) {
    alerts.push({
      terminalId: data.terminalId,
      type: 'warning',
      message: `Uptime baixo: ${data.metrics.uptime}%`,
      severity: 'medium'
    });
  }

  return alerts;
}