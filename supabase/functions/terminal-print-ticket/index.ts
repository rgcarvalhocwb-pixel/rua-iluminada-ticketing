import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PrintRequest {
  ticketIds: string[];
  printerId?: string;
  copies?: number;
  template?: 'standard' | 'receipt';
}

interface TicketData {
  id: string;
  ticket_number: string;
  qr_code: string;
  order_item_id: string;
  event_name: string;
  ticket_type_name: string;
  customer_name: string;
  price: number;
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

    const { ticketIds, printerId, copies = 1, template = 'standard' }: PrintRequest = await req.json();

    console.log("Processando impressão de ingressos:", { ticketIds, printerId, copies });

    // Buscar dados completos dos ingressos
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(`
        id,
        ticket_number,
        qr_code,
        order_item_id,
        order_items!inner(
          order_id,
          ticket_type_id,
          unit_price,
          orders!inner(
            customer_name,
            session_id,
            event_sessions!inner(
              event_id,
              events!inner(name)
            )
          ),
          ticket_types!inner(name)
        )
      `)
      .in("id", ticketIds);

    if (ticketsError) {
      throw new Error(`Erro ao buscar ingressos: ${ticketsError.message}`);
    }

    if (!tickets || tickets.length === 0) {
      throw new Error("Nenhum ingresso encontrado");
    }

    // Processar dados dos ingressos
    const ticketData: TicketData[] = tickets.map(ticket => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      qr_code: ticket.qr_code,
      order_item_id: ticket.order_item_id,
      event_name: (ticket.order_items as any).orders.event_sessions.events.name,
      ticket_type_name: (ticket.order_items as any).ticket_types.name,
      customer_name: (ticket.order_items as any).orders.customer_name,
      price: (ticket.order_items as any).unit_price
    }));

    // Gerar comandos de impressão
    const printCommands = generatePrintCommands(ticketData, template, copies);

    // Simular envio para impressora (em produção seria integração real)
    const printResult = await sendToPrinter(printerId || 'default', printCommands);

    // Registrar tentativa de impressão
    const { error: logError } = await supabase
      .from("user_audit_logs")
      .insert({
        user_id: null,
        user_email: "terminal@system",
        action: "PRINT_TICKETS",
        entity_type: "TICKETS",
        entity_id: ticketIds.join(","),
        details: {
          printerId,
          copies,
          template,
          ticketCount: ticketIds.length,
          success: printResult.success,
          error: printResult.error
        }
      });

    if (logError) {
      console.error("Erro ao registrar log de impressão:", logError);
    }

    if (!printResult.success) {
      throw new Error(printResult.error || "Erro na impressão");
    }

    console.log("Impressão concluída com sucesso:", { ticketCount: ticketIds.length });

    return new Response(
      JSON.stringify({
        success: true,
        printedTickets: ticketIds.length,
        copies,
        printerId: printResult.printerId,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Erro na impressão:", error);
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

function generatePrintCommands(tickets: TicketData[], template: string, copies: number): string[] {
  const commands: string[] = [];

  tickets.forEach(ticket => {
    for (let copy = 0; copy < copies; copy++) {
      if (template === 'standard') {
        commands.push(...generateStandardTicket(ticket));
      } else {
        commands.push(...generateReceiptTicket(ticket));
      }
      
      if (copy < copies - 1) {
        commands.push("FEED_AND_CUT");
      }
    }
  });

  return commands;
}

function generateStandardTicket(ticket: TicketData): string[] {
  return [
    "INIT_PRINTER",
    "SET_FONT_SIZE_LARGE",
    "PRINT_CENTER:=== RUA ILUMINADA ===",
    "FEED_LINE",
    "SET_FONT_SIZE_NORMAL",
    `PRINT_LEFT:Ingresso: ${ticket.ticket_number}`,
    `PRINT_LEFT:Evento: ${ticket.event_name}`,
    `PRINT_LEFT:Tipo: ${ticket.ticket_type_name}`,
    `PRINT_LEFT:Cliente: ${ticket.customer_name}`,
    `PRINT_LEFT:Valor: R$ ${ticket.price.toFixed(2)}`,
    "FEED_LINE",
    "SET_FONT_SIZE_SMALL",
    "PRINT_CENTER:Apresente este ingresso na entrada",
    "FEED_LINE",
    `PRINT_QR_CODE:${ticket.qr_code}`,
    "FEED_LINE",
    "PRINT_CENTER:www.ruailuminada.com.br",
    "FEED_AND_CUT"
  ];
}

function generateReceiptTicket(ticket: TicketData): string[] {
  return [
    "INIT_PRINTER",
    "SET_FONT_SIZE_NORMAL",
    "PRINT_CENTER:COMPROVANTE DE COMPRA",
    "PRINT_LINE",
    `PRINT_LEFT:Ingresso: ${ticket.ticket_number}`,
    `PRINT_LEFT:Evento: ${ticket.event_name}`,
    `PRINT_LEFT:Valor: R$ ${ticket.price.toFixed(2)}`,
    "FEED_LINE",
    `PRINT_QR_CODE:${ticket.qr_code}`,
    "FEED_AND_CUT"
  ];
}

async function sendToPrinter(printerId: string, commands: string[]): Promise<{success: boolean, error?: string, printerId: string}> {
  // Simular comunicação com impressora
  // Em produção, aqui seria a integração real com drivers de impressora
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simular tempo de impressão
  
  // Simular falha ocasional
  if (Math.random() < 0.05) {
    return {
      success: false,
      error: "Erro de comunicação com a impressora",
      printerId
    };
  }

  console.log(`Comandos enviados para impressora ${printerId}:`, commands);
  
  return {
    success: true,
    printerId
  };
}