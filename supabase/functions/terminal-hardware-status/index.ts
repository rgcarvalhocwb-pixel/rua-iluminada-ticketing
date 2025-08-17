import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HardwareStatusRequest {
  terminalId: string;
  hardwareType: 'printer' | 'pinpad' | 'turnstile' | 'all';
}

interface HardwareDevice {
  id: string;
  name: string;
  type: 'printer' | 'pinpad' | 'turnstile';
  status: 'online' | 'offline' | 'error';
  lastChecked: string;
  details?: any;
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

    const { terminalId, hardwareType }: HardwareStatusRequest = await req.json();

    console.log("Verificando status de hardware:", { terminalId, hardwareType });

    // Simular verificação de hardware (em produção seria integração real)
    const devices: HardwareDevice[] = [];

    if (hardwareType === 'printer' || hardwareType === 'all') {
      // Simular detecção de impressoras
      const printers = await detectPrinters();
      devices.push(...printers);
    }

    if (hardwareType === 'pinpad' || hardwareType === 'all') {
      // Simular detecção de pinpads
      const pinpads = await detectPinpads();
      devices.push(...pinpads);
    }

    if (hardwareType === 'turnstile' || hardwareType === 'all') {
      // Simular detecção de catracas
      const turnstiles = await detectTurnstiles();
      devices.push(...turnstiles);
    }

    // Registrar status no banco de dados
    const { error: logError } = await supabase
      .from("user_audit_logs")
      .insert({
        user_id: null,
        user_email: "terminal@system",
        action: "HARDWARE_CHECK",
        entity_type: "TERMINAL",
        entity_id: terminalId,
        details: {
          hardwareType,
          devicesFound: devices.length,
          devices: devices.map(d => ({ id: d.id, name: d.name, status: d.status }))
        }
      });

    if (logError) {
      console.error("Erro ao registrar log:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        terminalId,
        devices,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Erro na verificação de hardware:", error);
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

async function detectPrinters(): Promise<HardwareDevice[]> {
  // Simular detecção de impressoras via API do sistema
  const commonPrinters = [
    "Epson TM-T88V",
    "Bematech MP-4200 TH",
    "Elgin i9",
    "Zebra ZD220"
  ];

  return commonPrinters.map((name, index) => ({
    id: `printer_${index + 1}`,
    name,
    type: 'printer' as const,
    status: Math.random() > 0.2 ? 'online' : 'offline' as const,
    lastChecked: new Date().toISOString(),
    details: {
      port: `USB${index + 1}`,
      paperStatus: Math.random() > 0.1 ? 'ok' : 'low',
      temperature: Math.floor(Math.random() * 10) + 35
    }
  }));
}

async function detectPinpads(): Promise<HardwareDevice[]> {
  // Simular detecção de pinpads
  const commonPinpads = [
    "Ingenico iPP350",
    "PagBank Moderninha X",
    "Stone Ton T2",
    "Cielo LIO"
  ];

  return commonPinpads.map((name, index) => ({
    id: `pinpad_${index + 1}`,
    name,
    type: 'pinpad' as const,
    status: Math.random() > 0.3 ? 'online' : 'offline' as const,
    lastChecked: new Date().toISOString(),
    details: {
      connection: index % 2 === 0 ? 'USB' : 'Bluetooth',
      battery: Math.floor(Math.random() * 100),
      lastTransaction: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }
  }));
}

async function detectTurnstiles(): Promise<HardwareDevice[]> {
  // Simular detecção de catracas
  const commonTurnstiles = [
    "Henry Catraca TC-01",
    "Controlid iDBlock",
    "Linear HCS Catraca",
    "Intelbras SS 3530"
  ];

  return commonTurnstiles.map((name, index) => ({
    id: `turnstile_${index + 1}`,
    name,
    type: 'turnstile' as const,
    status: Math.random() > 0.2 ? 'online' : 'offline' as const,
    lastChecked: new Date().toISOString(),
    details: {
      connection: index % 2 === 0 ? 'TCP/IP' : 'Serial',
      firmware: '2.1.' + Math.floor(Math.random() * 10),
      passageCount: Math.floor(Math.random() * 1000),
      qrReaderStatus: Math.random() > 0.1 ? 'active' : 'inactive',
      lastValidation: new Date(Date.now() - Math.random() * 3600000).toISOString()
    }
  }));
}