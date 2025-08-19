import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ShoppingCart, Loader2, AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TerminalStatusBar } from "@/components/ui/terminal-status-bar";
import { useTerminalHardware } from "@/hooks/useTerminalHardware";
import { useNativeHardware } from "@/hooks/useNativeHardware";

interface Event {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string | null;
  event_id: string;
}

interface ShowTime {
  id: string;
  time_slot: string;
  event_id: string;
}

interface TerminalConfig {
  id: string;
  background_type: 'video' | 'slideshow' | 'static';
  background_url: string | null;
  welcome_message: string;
  instructions: string;
  idle_timeout: number;
  max_tickets_per_purchase: number;
}

const SelfServiceTerminal = () => {
  const [isIdle, setIsIdle] = useState(true);
  const [currentStep, setCurrentStep] = useState<'selection' | 'payment' | 'printing'>('selection');
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [terminalConfig, setTerminalConfig] = useState<TerminalConfig | null>(null);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { 
    hardwareStatus, 
    processPayment, 
    printTickets, 
    isAnyPrinterOnline, 
    isAnyPinpadOnline 
  } = useTerminalHardware();

  const { printNatively, isAnyPrinterConnected } = useNativeHardware();

  useEffect(() => {
    loadEvents();
    loadTerminalConfig();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Carregar eventos ativos (data atual entre start_date e end_date)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (eventsError) throw eventsError;

      if (eventsData && eventsData.length > 0) {
        setEvents(eventsData);
        
        // Automaticamente selecionar o primeiro evento
        const firstEvent = eventsData[0];
        setSelectedEvent(firstEvent);
        
        // Carregar tipos de ingresso para o primeiro evento
        const { data: ticketTypesData, error: ticketTypesError } = await supabase
          .from('ticket_types')
          .select('*')
          .eq('event_id', firstEvent.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (ticketTypesError) throw ticketTypesError;

        if (ticketTypesData && ticketTypesData.length > 0) {
          setTicketTypes(ticketTypesData);
          // Selecionar o primeiro tipo de ingresso disponível
          setSelectedTicketType(ticketTypesData[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do evento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTerminalConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('terminal_config')
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao carregar configurações do terminal:', error);
        return;
      }

      if (data) {
        setTerminalConfig({
          ...data,
          background_type: data.background_type as 'video' | 'slideshow' | 'static'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do terminal:', error);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    const maxTickets = terminalConfig?.max_tickets_per_purchase || 10;
    if (newQuantity >= 1 && newQuantity <= maxTickets) {
      setQuantity(newQuantity);
    }
  };

  const getTotalAmount = () => {
    return selectedTicketType ? selectedTicketType.price * quantity : 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleStartPurchase = () => {
    if (!selectedEvent || !selectedTicketType) {
      toast({
        title: "Erro",
        description: "Nenhum evento disponível no momento. Tente novamente mais tarde.",
        variant: "destructive",
      });
      return;
    }
    setIsIdle(false);
    setCurrentStep('selection');
  };

  const processRealPayment = async (paymentMethod: string) => {
    try {
      setLoading(true);

      if (!selectedEvent || !selectedTicketType) {
        toast({
          title: "Erro",
          description: "Evento ou tipo de ingresso não selecionado",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Verificar se há impressora disponível
      if (!isAnyPrinterOnline() && !isAnyPrinterConnected) {
        toast({
          title: "Impressora Indisponível",
          description: "Nenhuma impressora está disponível. Verifique as conexões.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log('Criando pedido para venda do terminal...');

      // 1. Buscar ou criar sessão do evento
      const sessionDate = new Date().toISOString().split('T')[0];
      const { data: existingSession } = await supabase
        .from('event_sessions')
        .select('*')
        .eq('event_id', selectedEvent.id)
        .eq('session_date', sessionDate)
        .single();

      let sessionId = existingSession?.id;

      if (!sessionId) {
        // Buscar horário do evento
        const { data: showTime } = await supabase
          .from('show_times')
          .select('*')
          .eq('event_id', selectedEvent.id)
          .single();

        if (showTime) {
          const { data: newSession } = await supabase
            .from('event_sessions')
            .insert({
              event_id: selectedEvent.id,
              show_time_id: showTime.id,
              session_date: sessionDate,
              capacity: showTime.capacity || 100,
              available_tickets: (showTime.capacity || 100) - quantity
            })
            .select('id')
            .single();

          sessionId = newSession?.id;
        }
      }

      // 2. Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          session_id: sessionId,
          customer_name: 'Cliente Terminal',
          customer_email: `terminal_${Date.now()}@autoatendimento.com`,
          customer_cpf: '00000000000',
          total_amount: getTotalAmount(),
          payment_status: 'pending',
          payment_method: paymentMethod
        })
        .select('id')
        .single();

      if (orderError) {
        throw new Error('Erro ao criar pedido: ' + orderError.message);
      }

      setCurrentOrderId(order.id);

      // 3. Criar item do pedido
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          ticket_type_id: selectedTicketType.id,
          quantity,
          unit_price: selectedTicketType.price,
          subtotal: getTotalAmount()
        });

      if (itemError) {
        throw new Error('Erro ao criar item do pedido: ' + itemError.message);
      }

      // 4. Processar pagamento real
      const paymentResult = await processPayment({
        orderId: order.id,
        amount: getTotalAmount(),
        customerName: 'Cliente Terminal',
        customerEmail: `terminal_${Date.now()}@autoatendimento.com`,
        customerCPF: '00000000000',
        description: `${selectedEvent.name} - ${quantity}x ${selectedTicketType.name}`
      });

      // 5. Abrir janela de pagamento
      const newWindow = window.open(paymentResult.paymentUrl, 'pagamento', 'width=800,height=600');
      setPaymentWindow(newWindow);
      setCurrentStep('payment');

      // 6. Monitorar fechamento da janela de pagamento
      const checkWindow = setInterval(() => {
        if (newWindow?.closed) {
          clearInterval(checkWindow);
          setPaymentWindow(null);
          // Verificar status do pagamento
          checkPaymentStatus(order.id);
        }
      }, 1000);

    } catch (error: any) {
      console.error('Erro ao processar venda:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento: " + error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (orderId: string) => {
    try {
      // Verificar status do pedido
      const { data: order, error } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      if (order.payment_status === 'approved') {
        // Pagamento aprovado, gerar e imprimir ingressos
        await handlePaymentApproved(orderId);
      } else {
        // Pagamento não aprovado, voltar para seleção
        toast({
          title: "Pagamento não realizado",
          description: "O pagamento não foi confirmado. Tente novamente.",
          variant: "destructive"
        });
        handleBackToIdle();
      }
    } catch (error: any) {
      console.error('Erro ao verificar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar status do pagamento",
        variant: "destructive"
      });
      handleBackToIdle();
    }
  };

  const handlePaymentApproved = async (orderId: string) => {
    try {
      setCurrentStep('printing');
      setLoading(true);
      
      // Buscar ingressos gerados para obter dados completos
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          id,
          ticket_number,
          qr_code,
          order_item_id,
          order_items(
            order_id,
            orders(
              session_id,
              event_sessions(
                event_id,
                events(name, start_date),
                show_time_id,
                show_times(time_slot)
              )
            ),
            ticket_type_id,
            ticket_types(name)
          )
        `)
        .eq('order_item_id', orderId);

      if (ticketsError) throw ticketsError;

      if (tickets && tickets.length > 0) {
        // Tentar impressão nativa primeiro
        let printSuccess = false;
        
        if (isAnyPrinterConnected) {
          console.log('Usando impressão nativa do navegador...');
          
          const ticketContent = tickets.map(ticket => `
            <div style="margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px;">
              <div style="text-align: center; font-weight: bold; font-size: 16px;">RUA ILUMINADA</div>
              <div style="text-align: center; margin: 10px 0;">${selectedEvent?.name || 'Evento'}</div>
              <div>Data: ${selectedEvent?.start_date ? new Date(selectedEvent.start_date).toLocaleDateString() : ''}</div>
              <div>Horário: ${ticketTypes.find(tt => tt.id === selectedTicketType?.id)?.name || ''}</div>
              <div>Tipo: ${selectedTicketType?.name || ''}</div>
              <div>Número: ${ticket.ticket_number}</div>
              <div style="margin: 10px 0; text-align: center; font-size: 10px;">
                QR Code: ${ticket.qr_code}
              </div>
              <div style="text-align: center; font-size: 12px;">
                Apresente este ingresso na entrada
              </div>
            </div>
          `).join('');
          
          printSuccess = await printNatively(ticketContent);
        }
        
        // Fallback para sistema tradicional se necessário
        if (!printSuccess) {
          console.log('Usando sistema de impressão tradicional...');
          const fallbackResult = await printTickets(tickets.map(t => t.id));
          printSuccess = fallbackResult.success;
        }

        if (printSuccess) {
          toast({
            title: "Compra finalizada!",
            description: `${tickets.length} ingresso(s) impresso(s) com sucesso!`,
          });
        } else {
          throw new Error('Falha na impressão dos ingressos');
        }
      }

      setLoading(false);

      // Voltar ao estado inicial após 3 segundos
      setTimeout(() => {
        handleBackToIdle();
      }, 3000);

    } catch (error: any) {
      console.error('Erro ao processar ingressos:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar ingressos: " + error.message,
        variant: "destructive"
      });
      setLoading(false);
      handleBackToIdle();
    }
  };

  const handleBackToIdle = () => {
    setIsIdle(true);
    setCurrentStep('selection');
    setQuantity(1);
    setLoading(false);
    setCurrentOrderId(null);
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    setPaymentWindow(null);
  };

  if (isIdle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-secondary/5 flex items-center justify-center relative overflow-hidden">
        {/* Dynamic Background */}
        {terminalConfig?.background_url ? (
          terminalConfig.background_type === 'video' ? (
            <video 
              autoPlay 
              muted 
              loop 
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
              src={terminalConfig.background_url}
              style={{
                width: '100vw',
                height: '100vh',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div 
              className="absolute inset-0 w-full h-full bg-contain bg-center bg-no-repeat"
              style={{ 
                backgroundImage: `url(${terminalConfig.background_url})`,
                animation: 'backgroundLoop 20s ease-in-out infinite',
                backgroundSize: 'contain',
                width: '100vw',
                height: '100vh'
              }}
            />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Touch to Start Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/10 transition-colors"
          onClick={handleStartPurchase}
        >
          {/* Status do Terminal */}
          <div className="absolute top-4 left-4">
            <TerminalStatusBar terminalId="terminal-001" compact={true} />
          </div>

          {/* Informações discretas no canto inferior direito */}
          <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                {terminalConfig?.welcome_message || 'Terminal de Auto Atendimento'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {terminalConfig?.instructions || 'Clique em qualquer local da tela para iniciar sua compra'}
            </p>
            <div className="flex items-center justify-center animate-pulse">
              <p className="text-sm text-primary font-medium">
                Toque aqui para começar
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-secondary/5 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Compra de Ingressos
          </h1>
          <Button
            variant="outline"
            onClick={handleBackToIdle}
            className="text-lg px-6 py-3"
          >
            Cancelar
          </Button>
        </div>

        {currentStep === 'selection' && (
          <Card className="p-8">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-xl text-muted-foreground">Carregando evento...</p>
              </div>
            ) : !selectedEvent || !selectedTicketType ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-4">
                  Nenhum evento disponível no momento.
                </p>
                <Button onClick={handleBackToIdle} variant="outline">
                  Voltar
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-semibold mb-2">{selectedEvent.name}</h2>
                  <p className="text-muted-foreground text-lg">
                    {selectedEvent.description || "Selecione a quantidade de ingressos"}
                  </p>
                </div>
                
                <p className="text-muted-foreground mb-8 text-lg text-center">
                  Disponível apenas ingresso inteiro. Para meia entrada, dirija-se ao caixa.
                </p>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <p className="text-xl font-medium mb-2">{selectedTicketType.name}</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(selectedTicketType.price)}
                      </p>
                      {selectedTicketType.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedTicketType.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-4">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="h-16 w-16 text-2xl"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="text-4xl font-bold min-w-[80px] text-center">
                          {quantity}
                        </span>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="h-16 w-16 text-2xl"
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= (terminalConfig?.max_tickets_per_purchase || 10)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-2xl font-semibold">Total:</span>
                      <span className="text-3xl font-bold text-primary">
                        {formatPrice(getTotalAmount())}
                      </span>
                    </div>
                    
                    <Button 
                      className="w-full py-6 text-2xl"
                      onClick={() => processRealPayment('pagseguro')}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Continuar para Pagamento'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        )}

        {currentStep === 'payment' && (
          <Card className="p-8">
            <div className="text-center mb-6">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-semibold mb-4">Processando Pagamento</h2>
              <p className="text-muted-foreground text-lg">
                Complete o pagamento na janela que foi aberta
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-lg">Aguardando confirmação do pagamento...</span>
              </div>
              
              {paymentWindow && !paymentWindow.closed && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Finalize o pagamento na janela aberta e feche-a quando concluído
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (paymentWindow && !paymentWindow.closed) {
                        paymentWindow.focus();
                      }
                    }}
                  >
                    Focar Janela de Pagamento
                  </Button>
                </div>
              )}
            </div>
            
            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={handleBackToIdle}>
                Cancelar Compra
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 'printing' && (
          <Card className="p-8">
            <div className="text-center">
              <div className="mb-6">
                {loading ? (
                  <>
                    <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
                    <h2 className="text-2xl font-semibold mb-4">Imprimindo Ingressos</h2>
                    <p className="text-lg text-muted-foreground">
                      Aguarde enquanto seus ingressos são impressos...
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                    <h2 className="text-2xl font-semibold mb-4 text-green-700">Compra Finalizada!</h2>
                    <p className="text-lg text-muted-foreground">
                      Seus ingressos foram impressos com sucesso!
                    </p>
                  </>
                )}
              </div>
              
              {/* Informações sobre a impressão */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Ingressos Impressos</p>
                    <p className="text-2xl font-bold text-primary">{quantity}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Pago</p>
                    <p className="text-2xl font-bold text-primary">{formatPrice(getTotalAmount())}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Retorne à tela inicial em alguns segundos...
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SelfServiceTerminal;