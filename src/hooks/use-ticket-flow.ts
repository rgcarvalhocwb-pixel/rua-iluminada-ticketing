import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CustomerData } from "@/components/ui/customer-form";

export type FlowStep = 'selection' | 'customer-form' | 'payment';

export interface TicketData {
  selectedDate: Date;
  selectedTime: string;
  ticketQuantities: Record<string, number>;
  totalPrice: number;
  totalTickets: number;
  eventId: string;
  eventName: string;
}

export const useTicketFlow = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<FlowStep>('selection');
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const proceedToCustomerForm = (data: TicketData) => {
    setTicketData(data);
    setCurrentStep('customer-form');
  };

  const proceedToPayment = async (customer: CustomerData) => {
    if (!ticketData) {
      toast({
        title: "Erro",
        description: "Dados do pedido não encontrados.",
        variant: "destructive"
      });
      return;
    }

    setCustomerData(customer);
    setIsProcessing(true);

    try {
      // Validar se o evento existe
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, name')
        .eq('id', ticketData.eventId)
        .single();

      if (eventError || !event) {
        throw new Error('Evento não encontrado. Verifique se o evento ainda está disponível.');
      }

      // Buscar o horário selecionado
      const { data: showTime, error: showTimeError } = await supabase
        .from('show_times')
        .select('id, time_slot, capacity')
        .eq('event_id', event.id)
        .eq('time_slot', ticketData.selectedTime)
        .single();

      if (showTimeError || !showTime) {
        throw new Error('Horário não encontrado. O horário selecionado pode não estar mais disponível.');
      }

      // Buscar ou criar sessão do evento
      const sessionDate = ticketData.selectedDate.toISOString().split('T')[0];
      let { data: session, error: sessionError } = await supabase
        .from('event_sessions')
        .select('id, available_tickets')
        .eq('event_id', event.id)
        .eq('show_time_id', showTime.id)
        .eq('session_date', sessionDate)
        .maybeSingle();

      if (sessionError) {
        throw new Error('Erro ao buscar sessão: ' + sessionError.message);
      }

      if (!session) {
        // Criar nova sessão com a capacidade do horário
        const { data: newSession, error: createSessionError } = await supabase
          .from('event_sessions')
          .insert({
            event_id: event.id,
            show_time_id: showTime.id,
            session_date: sessionDate,
            capacity: showTime.capacity,
            available_tickets: showTime.capacity
          })
          .select('id, available_tickets')
          .single();

        if (createSessionError) {
          throw new Error('Erro ao criar sessão: ' + createSessionError.message);
        }
        session = newSession;
      }

      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          session_id: session.id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_cpf: customer.cpf.replace(/\D/g, ''),
          total_amount: ticketData.totalPrice,
          payment_status: 'pending'
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Buscar tipos de ingresso para validação
      const { data: ticketTypes, error: ticketTypesError } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', event.id);

      if (ticketTypesError || !ticketTypes || ticketTypes.length === 0) {
        throw new Error('Tipos de ingresso não encontrados para este evento.');
      }

      // Criar itens do pedido
      const orderItems = [];
      for (const [ticketTypeId, quantity] of Object.entries(ticketData.ticketQuantities)) {
        if (quantity === 0) continue;
        
        const ticketType = ticketTypes.find(t => t.id === ticketTypeId);
        
        if (!ticketType) {
          throw new Error(`Tipo de ingresso não encontrado: ${ticketTypeId}`);
        }
        
        orderItems.push({
          order_id: order.id,
          ticket_type_id: ticketType.id,
          quantity,
          unit_price: ticketType.price,
          subtotal: ticketType.price * quantity
        });
      }

      if (orderItems.length === 0) {
        throw new Error('Nenhum item foi selecionado para o pedido.');
      }

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error('Erro ao criar itens do pedido: ' + itemsError.message);
      }

      // Processar pagamento via PagSeguro
      await processPayment(order.id, customer, ticketData);

    } catch (error: any) {
      console.error('Erro ao processar pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processPayment = async (orderId: string, customer: CustomerData, tickets: TicketData) => {
    try {
      // Aqui seria a integração com PagSeguro
      // Por enquanto, simularemos o redirecionamento
      toast({
        title: "Redirecionando para pagamento",
        description: "Você será redirecionado para o PagSeguro em instantes...",
      });

      // Simular redirecionamento para PagSeguro
      setTimeout(() => {
        // Em produção, isso seria um redirect real para o PagSeguro
        const pagseguroUrl = `https://pagseguro.uol.com.br/checkout/payment.html?code=SIMULATED_${orderId}`;
        window.open(pagseguroUrl, '_blank');
        
        toast({
          title: "Página de pagamento aberta",
          description: "Complete o pagamento na nova aba para finalizar sua compra.",
        });
      }, 2000);

      setCurrentStep('payment');

    } catch (error: any) {
      throw new Error('Erro ao processar pagamento: ' + error.message);
    }
  };

  const goBack = () => {
    if (currentStep === 'customer-form') {
      setCurrentStep('selection');
    } else if (currentStep === 'payment') {
      setCurrentStep('customer-form');
    }
  };

  const resetFlow = () => {
    setCurrentStep('selection');
    setTicketData(null);
    setCustomerData(null);
    setIsProcessing(false);
  };

  return {
    currentStep,
    ticketData,
    customerData,
    isProcessing,
    proceedToCustomerForm,
    proceedToPayment,
    goBack,
    resetFlow
  };
};