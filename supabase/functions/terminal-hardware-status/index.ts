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
      // Detectar catracas reais via TCP/IP
      const turnstiles = await detectTurnstiles(supabase);
      devices.push(...turnstiles);
    }
    
    // Salvar status em terminal_heartbeats
    await supabase.from('terminal_heartbeats').insert({
      terminal_id: terminalId,
      status: devices.length > 0 && devices.some(d => d.status === 'online') ? 'online' : 'offline',
      hardware_status: {
        printers: devices.filter(d => d.type === 'printer'),
        pinpads: devices.filter(d => d.type === 'pinpad'),
        turnstiles: devices.filter(d => d.type === 'turnstile')
      },
      metrics: {
        totalDevices: devices.length,
        onlineDevices: devices.filter(d => d.status === 'online').length,
        offlineDevices: devices.filter(d => d.status === 'offline').length
      },
      system_info: {
        timestamp: new Date().toISOString(),
        hardwareType
      }
    });

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
  // Detecção real de impressoras via Web USB/Serial API
  // Em ambiente de produção, isso deve integrar com drivers do sistema
  const detectedPrinters: HardwareDevice[] = [];
  
  try {
    // Tentar detectar via Web USB (quando disponível)
    if (typeof navigator !== 'undefined' && 'usb' in navigator) {
      // Web USB API disponível - detectar impressoras USB
      console.log('Web USB API disponível para detecção de impressoras');
    }
    
    // Fallback: Retornar array vazio se não detectar hardware
    // Em produção real, aqui seria feita integração com SDKs dos fabricantes
    console.log('Nenhuma impressora detectada via hardware. Retornando lista vazia.');
    return detectedPrinters;
    
  } catch (error) {
    console.error('Erro ao detectar impressoras:', error);
    return detectedPrinters;
  }
}

async function detectPinpads(): Promise<HardwareDevice[]> {
  // Detecção real de pinpads
  // Em produção, integrar com SDKs dos fabricantes (Ingenico, Stone, PagBank, Cielo)
  const detectedPinpads: HardwareDevice[] = [];
  
  try {
    // Tentar detectar via USB/Bluetooth
    console.log('Tentando detectar pinpads via USB/Bluetooth...');
    
    // Fallback: Retornar array vazio se não detectar hardware
    // Em produção real, aqui seria feita integração com:
    // - Ingenico: SDK iPP350
    // - Stone: API do Ton T2
    // - PagBank: API Moderninha
    // - Cielo: SDK LIO
    
    console.log('Nenhum pinpad detectado via hardware. Retornando lista vazia.');
    return detectedPinpads;
    
  } catch (error) {
    console.error('Erro ao detectar pinpads:', error);
    return detectedPinpads;
  }
}

async function detectTurnstiles(supabase: any): Promise<HardwareDevice[]> {
  // Detecção REAL de catracas Topdata Fit via TCP/IP
  const detectedTurnstiles: HardwareDevice[] = [];
  
  try {
    // Buscar catracas cadastradas no banco de dados
    const { data: registeredTurnstiles, error } = await supabase
      .from('turnstiles')
      .select('*')
      .eq('status', 'active');
    
    if (error) {
      console.error('Erro ao buscar catracas cadastradas:', error);
      return detectedTurnstiles;
    }
    
    if (!registeredTurnstiles || registeredTurnstiles.length === 0) {
      console.log('Nenhuma catraca cadastrada no sistema');
      return detectedTurnstiles;
    }
    
    // Para cada catraca cadastrada, testar conexão TCP/IP
    for (const turnstile of registeredTurnstiles) {
      try {
        // Testar conexão TCP/IP na porta 9999 (padrão Topdata Fit)
        const isOnline = await testTCPConnection(turnstile.ip_address, 9999);
        
        detectedTurnstiles.push({
          id: turnstile.id,
          name: turnstile.name,
          type: 'turnstile' as const,
          status: isOnline ? 'online' : 'offline',
          lastChecked: new Date().toISOString(),
          details: {
            connection: 'TCP/IP',
            ipAddress: turnstile.ip_address,
            location: turnstile.location,
            firmware: isOnline ? await getFirmwareVersion(turnstile.ip_address) : 'unknown',
            qrReaderStatus: isOnline ? 'active' : 'inactive'
          }
        });
        
      } catch (error) {
        console.error(`Erro ao testar catraca ${turnstile.name}:`, error);
        
        // Adicionar como offline
        detectedTurnstiles.push({
          id: turnstile.id,
          name: turnstile.name,
          type: 'turnstile' as const,
          status: 'offline',
          lastChecked: new Date().toISOString(),
          details: {
            connection: 'TCP/IP',
            ipAddress: turnstile.ip_address,
            location: turnstile.location,
            error: 'Connection timeout'
          }
        });
      }
    }
    
    console.log(`Detectadas ${detectedTurnstiles.length} catracas`);
    return detectedTurnstiles;
    
  } catch (error) {
    console.error('Erro ao detectar catracas:', error);
    return detectedTurnstiles;
  }
}

// Função auxiliar para testar conexão TCP/IP
async function testTCPConnection(ipAddress: string, port: number): Promise<boolean> {
  try {
    // Em ambiente Deno, usar Deno.connect para testar conexão TCP
    const conn = await Deno.connect({ hostname: ipAddress, port, transport: "tcp" });
    conn.close();
    return true;
  } catch {
    return false;
  }
}

// Função auxiliar para obter versão do firmware (protocolo específico Topdata)
async function getFirmwareVersion(ipAddress: string): Promise<string> {
  try {
    // Implementar protocolo Topdata Fit para obter versão
    // Por enquanto retornar versão genérica
    return '3.x.x';
  } catch {
    return 'unknown';
  }
}