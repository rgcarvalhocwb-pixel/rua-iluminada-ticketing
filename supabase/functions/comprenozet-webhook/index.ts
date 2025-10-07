import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompreNoZetOrder {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  paymentType: 'PIX' | 'CREDITO' | 'DEBITO';
  paymentSituation: 'PAGO' | 'ESTORNADO';
  paymentConfirmeDate: string;
  totalValue: number;
  totalTax: number;
  discount: number;
  createdAt: string;
}

interface CompreNoZetTicket {
  id: number;
  voucher: string;
  date: string;
  time: string;
  used: boolean;
  dateTimeUsed: string | null;
  name: string;
  email: string;
  phone: string;
  document: string;
}

interface CompreNoZetEvent {
  id: number;
  name: string;
  slug: string;
}

interface CompreNoZetPayload {
  action: 'CP' | 'ES';
  data: {
    order: CompreNoZetOrder;
    eventTicketCodes: CompreNoZetTicket[];
    event: CompreNoZetEvent;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: CompreNoZetPayload = await req.json();
    
    console.log('📥 Webhook received from Compre no Zet:', {
      action: payload.action,
      orderId: payload.data.order.uuid,
      event: payload.data.event.name,
    });

    // Validate payload structure
    if (!payload.action || !payload.data?.order?.uuid) {
      throw new Error('Invalid payload structure');
    }

    if (payload.action === 'CP') {
      // Process confirmed purchase
      await handleConfirmedPurchase(supabase, payload);
    } else if (payload.action === 'ES') {
      // Process refund
      await handleRefund(supabase, payload);
    } else {
      throw new Error(`Unknown action: ${payload.action}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleConfirmedPurchase(supabase: any, payload: CompreNoZetPayload) {
  const { order, eventTicketCodes, event } = payload.data;

  // Check for duplicate (idempotency)
  const { data: existingImport } = await supabase
    .from('imported_sales')
    .select('id')
    .eq('reference', order.uuid)
    .eq('source', 'comprenozet')
    .maybeSingle();

  if (existingImport) {
    console.log('⚠️ Duplicate webhook detected, skipping:', order.uuid);
    return;
  }

  // Find event by external_id, external_slug, or name
  const { data: internalEvent, error: eventError } = await supabase
    .from('events')
    .select('id, name')
    .or(`external_id.eq.${event.id},external_slug.eq.${event.slug},name.ilike.${event.name}`)
    .maybeSingle();

  if (eventError || !internalEvent) {
    throw new Error(`Event not found: ${event.name} (${event.slug})`);
  }

  console.log('✅ Event mapped:', { external: event.name, internal: internalEvent.name });

  // Get or create a default session for today
  const today = new Date().toISOString().split('T')[0];
  let { data: session } = await supabase
    .from('event_sessions')
    .select('id')
    .eq('event_id', internalEvent.id)
    .eq('session_date', today)
    .maybeSingle();

  if (!session) {
    // Create default session
    const { data: newSession, error: sessionError } = await supabase
      .from('event_sessions')
      .insert({
        event_id: internalEvent.id,
        session_date: today,
        capacity: 1000,
        available_tickets: 1000,
        status: 'active',
      })
      .select()
      .single();

    if (sessionError) throw sessionError;
    session = newSession;
  }

  // Create order
  const { data: createdOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      session_id: session.id,
      customer_name: order.name,
      customer_email: order.email,
      customer_cpf: order.cpf,
      payment_method: `comprenozet_${order.paymentType.toLowerCase()}`,
      payment_status: 'paid',
      payment_reference: order.uuid,
      total_amount: order.totalValue - order.discount,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  console.log('✅ Order created:', createdOrder.id);

  // Get or create default ticket type
  const { data: ticketType } = await supabase
    .from('ticket_types')
    .select('id, price')
    .eq('event_id', internalEvent.id)
    .eq('name', 'Ingresso Compre no Zet')
    .maybeSingle();

  let ticketTypeId = ticketType?.id;
  const unitPrice = eventTicketCodes.length > 0 
    ? (order.totalValue - order.discount) / eventTicketCodes.length 
    : 0;

  if (!ticketTypeId) {
    const { data: newTicketType, error: ttError } = await supabase
      .from('ticket_types')
      .insert({
        event_id: internalEvent.id,
        name: 'Ingresso Compre no Zet',
        description: 'Ingresso vendido via Compre no Zet',
        price: unitPrice,
        is_active: true,
      })
      .select()
      .single();

    if (ttError) throw ttError;
    ticketTypeId = newTicketType.id;
  }

  // Create order items and tickets
  for (const ticket of eventTicketCodes) {
    // Create order item
    const { data: orderItem, error: oiError } = await supabase
      .from('order_items')
      .insert({
        order_id: createdOrder.id,
        ticket_type_id: ticketTypeId,
        quantity: 1,
        unit_price: unitPrice,
        subtotal: unitPrice,
      })
      .select()
      .single();

    if (oiError) throw oiError;

    // Create ticket
    const { error: ticketError } = await supabase
      .from('tickets')
      .insert({
        order_item_id: orderItem.id,
        ticket_number: `CNZ-${ticket.voucher}`,
        qr_code: ticket.voucher,
        external_voucher: ticket.voucher,
        ticket_holder_name: ticket.name,
        ticket_holder_email: ticket.email,
        ticket_holder_cpf: ticket.document,
        status: 'valid',
      });

    if (ticketError) throw ticketError;

    console.log('✅ Ticket created:', ticket.voucher);
  }

  // Register online sale
  const { error: saleError } = await supabase
    .from('online_sales')
    .insert({
      event_id: internalEvent.id,
      platform_name: 'Compre no Zet',
      ticket_type: 'Ingresso',
      quantity_sold: eventTicketCodes.length,
      quantity_refunded: 0,
      unit_price: unitPrice,
      sale_date: order.paymentConfirmeDate.split('T')[0],
    });

  if (saleError) throw saleError;

  // Register imported sale (for idempotency)
  const { error: importError } = await supabase
    .from('imported_sales')
    .insert({
      reference: order.uuid,
      source: 'comprenozet',
      import_date: new Date().toISOString().split('T')[0],
      amount: order.totalValue - order.discount,
    });

  if (importError) throw importError;

  console.log('✅ Purchase processed successfully:', {
    orderUuid: order.uuid,
    tickets: eventTicketCodes.length,
    amount: order.totalValue - order.discount,
  });
}

async function handleRefund(supabase: any, payload: CompreNoZetPayload) {
  const { order, eventTicketCodes } = payload.data;

  // Find existing order
  const { data: existingOrder, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .eq('payment_reference', order.uuid)
    .maybeSingle();

  if (orderError || !existingOrder) {
    throw new Error(`Order not found for refund: ${order.uuid}`);
  }

  // Update order status
  const { error: updateError } = await supabase
    .from('orders')
    .update({ payment_status: 'refunded' })
    .eq('id', existingOrder.id);

  if (updateError) throw updateError;

  // Invalidate tickets
  for (const ticket of eventTicketCodes) {
    const { error: ticketError } = await supabase
      .from('tickets')
      .update({ status: 'cancelled' })
      .eq('external_voucher', ticket.voucher);

    if (ticketError) {
      console.error('⚠️ Error invalidating ticket:', ticket.voucher, ticketError);
    }
  }

  // Update online_sales refund count
  const { error: saleError } = await supabase
    .from('online_sales')
    .update({ 
      quantity_refunded: supabase.raw('quantity_refunded + ?', [eventTicketCodes.length]) 
    })
    .eq('platform_name', 'Compre no Zet')
    .eq('sale_date', order.paymentConfirmeDate?.split('T')[0] || new Date().toISOString().split('T')[0]);

  if (saleError) {
    console.error('⚠️ Error updating online_sales refund:', saleError);
  }

  console.log('✅ Refund processed successfully:', {
    orderUuid: order.uuid,
    ticketsRefunded: eventTicketCodes.length,
  });
}
