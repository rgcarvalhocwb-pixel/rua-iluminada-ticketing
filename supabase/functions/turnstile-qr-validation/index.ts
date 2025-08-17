import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TurnstileValidationRequest {
  turnstileId: string;
  qrCode?: string;
  ticketNumber?: string;
  validatorUser: string;
}

interface ValidationResponse {
  success: boolean;
  ticketInfo?: {
    id: string;
    ticketNumber: string;
    customerName: string;
    eventName: string;
    status: string;
    sessionDate: string;
    showTime: string;
  };
  error?: string;
  allowPassage: boolean;
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

    const { turnstileId, qrCode, ticketNumber, validatorUser }: TurnstileValidationRequest = await req.json();

    console.log("Validação de catraca:", { turnstileId, qrCode, ticketNumber, validatorUser });

    // Buscar informações do ticket
    let ticketQuery = supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        qr_code,
        status,
        used_at,
        order_item_id,
        order_items!inner(
          order_id,
          ticket_type_id,
          orders!inner(
            customer_name,
            customer_email,
            session_id,
            event_sessions!inner(
              session_date,
              event_id,
              show_time_id,
              events!inner(name),
              show_times!inner(time_slot)
            )
          ),
          ticket_types!inner(name, price)
        )
      `);

    if (qrCode) {
      ticketQuery = ticketQuery.eq('qr_code', qrCode);
    } else if (ticketNumber) {
      ticketQuery = ticketQuery.eq('ticket_number', ticketNumber);
    } else {
      throw new Error('QR Code ou número do ticket é obrigatório');
    }

    const { data: tickets, error: ticketError } = await ticketQuery.single();

    if (ticketError || !tickets) {
      console.error('Ticket não encontrado:', ticketError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Ticket não encontrado',
          allowPassage: false
        } as ValidationResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Verificar se o ticket já foi usado
    if (tickets.status === 'used') {
      console.log('Ticket já utilizado');
      
      // Registrar tentativa de uso de ticket já utilizado
      await supabase.from("user_audit_logs").insert({
        user_id: null,
        user_email: validatorUser,
        action: "TICKET_VALIDATION_ATTEMPT",
        entity_type: "TURNSTILE",
        entity_id: turnstileId,
        details: {
          ticketId: tickets.id,
          ticketNumber: tickets.ticket_number,
          reason: 'ticket_already_used',
          usedAt: tickets.used_at
        }
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Ticket já foi utilizado',
          allowPassage: false,
          ticketInfo: {
            id: tickets.id,
            ticketNumber: tickets.ticket_number,
            customerName: tickets.order_item_id.orders.customer_name,
            eventName: tickets.order_item_id.orders.event_sessions.events.name,
            status: tickets.status,
            sessionDate: tickets.order_item_id.orders.event_sessions.session_date,
            showTime: tickets.order_item_id.orders.event_sessions.show_times.time_slot
          }
        } as ValidationResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Marcar ticket como usado
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        validated_by: validatorUser
      })
      .eq('id', tickets.id);

    if (updateError) {
      console.error('Erro ao marcar ticket como usado:', updateError);
      throw new Error('Erro interno ao processar validação');
    }

    // Registrar a validação
    const { error: validationError } = await supabase.from("validations").insert({
      ticket_id: tickets.id,
      validation_method: qrCode ? 'qr_code' : 'ticket_number',
      validator_user: validatorUser,
      turnstile_id: turnstileId,
      notes: `Validação via catraca ${turnstileId}`
    });

    if (validationError) {
      console.error('Erro ao registrar validação:', validationError);
    }

    // Log de auditoria
    await supabase.from("user_audit_logs").insert({
      user_id: null,
      user_email: validatorUser,
      action: "TICKET_VALIDATED",
      entity_type: "TURNSTILE",
      entity_id: turnstileId,
      details: {
        ticketId: tickets.id,
        ticketNumber: tickets.ticket_number,
        customerName: tickets.order_item_id.orders.customer_name,
        eventName: tickets.order_item_id.orders.event_sessions.events.name,
        validationMethod: qrCode ? 'qr_code' : 'ticket_number'
      }
    });

    // Comando para liberar a catraca
    const { error: commandError } = await supabase
      .from('terminal_commands')
      .insert({
        terminal_id: turnstileId,
        command_type: 'RELEASE_PASSAGE',
        command_data: {
          ticketId: tickets.id,
          ticketNumber: tickets.ticket_number,
          customerName: tickets.order_item_id.orders.customer_name
        },
        status: 'pending'
      });

    if (commandError) {
      console.error('Erro ao enviar comando para catraca:', commandError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        allowPassage: true,
        ticketInfo: {
          id: tickets.id,
          ticketNumber: tickets.ticket_number,
          customerName: tickets.order_item_id.orders.customer_name,
          eventName: tickets.order_item_id.orders.event_sessions.events.name,
          status: 'used',
          sessionDate: tickets.order_item_id.orders.event_sessions.session_date,
          showTime: tickets.order_item_id.orders.event_sessions.show_times.time_slot
        }
      } as ValidationResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Erro na validação da catraca:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        allowPassage: false
      } as ValidationResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});