import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ShoppingCart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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

  const handlePaymentConfirmed = async (orderId: string, paymentMethod: string) => {
    try {
      setLoading(true);
      
      // Chamar edge function para processar confirmação de pagamento e registrar no caixa
      const { data: confirmationResult, error: confirmationError } = await supabase.functions.invoke('process-payment-confirmation', {
        body: {
          orderId,
          paymentStatus: 'approved',
          paymentMethod,
          totalAmount: getTotalAmount(),
          isTerminalSale: true,
          paymentReference: `TERM_${orderId}_${Date.now()}`
        }
      });

      if (confirmationError) {
        console.error('Erro na confirmação:', confirmationError);
        toast({
          title: "Erro na confirmação",
          description: "Erro ao processar confirmação do pagamento",
          variant: "destructive"
        });
        return;
      }

      if (!confirmationResult.success) {
        toast({
          title: "Erro",
          description: confirmationResult.error || "Erro ao confirmar pagamento",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Pagamento confirmado!",
        description: "Venda registrada no sistema. Ingressos sendo impressos...",
      });

      // Simular impressão dos ingressos
      setCurrentStep('printing');
      
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar confirmação: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async (paymentMethod: string) => {
    try {
      setLoading(true);
      setCurrentStep('printing');

      if (!selectedEvent || !selectedTicketType) {
        toast({
          title: "Erro",
          description: "Evento ou tipo de ingresso não selecionado",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Criar pedido real
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

      // 4. Simular aprovação do pagamento (3 segundos)
      setTimeout(async () => {
        await handlePaymentConfirmed(order.id, paymentMethod);
        
        // 5. Simular impressão dos ingressos
        setTimeout(() => {
          toast({
            title: "Compra finalizada!",
            description: `${quantity} ingresso(s) impresso(s) com sucesso!`,
          });
          
          // Voltar ao estado inicial após 3 segundos
          setTimeout(() => {
            handleBackToIdle();
          }, 3000);
        }, 2000);
      }, 3000);
      
    } catch (error: any) {
      console.error('Erro ao processar venda:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento: " + error.message,
        variant: "destructive"
      });
      setLoading(false);
      setCurrentStep('payment'); // Voltar para tela de pagamento
    }
  };

  const handleBackToIdle = () => {
    setIsIdle(true);
    setCurrentStep('selection');
    setQuantity(1);
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
              className="absolute inset-0 w-full h-full object-cover"
              src={terminalConfig.background_url}
            />
          ) : (
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${terminalConfig.background_url})` }}
            />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Touch to Start Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-colors"
          onClick={handleStartPurchase}
        >
          <Card className="p-12 text-center bg-white/95 backdrop-blur-sm border-2 border-primary/20 shadow-2xl max-w-2xl mx-4">
            <ShoppingCart className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              {terminalConfig?.welcome_message || 'Terminal de Auto Atendimento'}
            </h1>
            <p className="text-2xl text-muted-foreground mb-6">
              {terminalConfig?.instructions || 'Clique em qualquer local da tela para iniciar sua compra'}
            </p>
            <div className="animate-pulse">
              <p className="text-lg text-primary font-medium">
                Toque aqui para começar
              </p>
            </div>
          </Card>
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
                      onClick={() => setCurrentStep('payment')}
                    >
                      Continuar para Pagamento
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        )}

        {currentStep === 'payment' && (
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">
              Forma de Pagamento
            </h2>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <Button
                variant="outline"
                className="h-24 text-xl flex flex-col items-center justify-center space-y-2 border-2 hover:border-primary"
                onClick={() => simulatePayment('credit_card')}
                disabled={loading}
              >
                <span className="text-2xl">💳</span>
                <span>Cartão</span>
                <span className="text-sm text-muted-foreground">Débito/Crédito</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-24 text-xl flex flex-col items-center justify-center space-y-2 border-2 hover:border-primary"
                onClick={() => simulatePayment('pix')}
                disabled={loading}
              >
                <span className="text-2xl">📱</span>
                <span>PIX</span>
                <span className="text-sm text-muted-foreground">Pagamento instantâneo</span>
              </Button>
            </div>
            
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl">Total a pagar:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(getTotalAmount())}
                </span>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  className="flex-1 py-4 text-lg"
                  onClick={() => setCurrentStep('selection')}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 py-4 text-lg"
                  onClick={() => setCurrentStep('printing')}
                >
                  Processar Pagamento
                </Button>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 'printing' && (
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-6">
              {loading ? 'Processando Pagamento...' : 'Imprimindo Ingressos...'}
            </h2>
            
            <div className="space-y-6">
              {loading ? (
                <>
                  <div className="text-6xl mb-4">💳</div>
                  <p className="text-xl">Aguardando confirmação do pagamento...</p>
                  <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🖨️</div>
                  <p className="text-xl">Imprimindo {quantity} ingresso(s)...</p>
                  <div className="animate-pulse">
                    <div className="bg-primary/20 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        • Comprovante de pagamento ✓<br/>
                        • Ingresso(s) com QR Code ✓<br/>
                        • Registrando venda no caixa diário ✓
                      </p>
                    </div>
                  </div>
                  <div className="animate-bounce text-4xl">📄</div>
                </>
              )}
              
              <div className="mt-8 p-4 bg-muted rounded-lg text-left">
                <h3 className="font-semibold mb-2">Resumo da compra:</h3>
                <p>{selectedEvent?.name}</p>
                <p>{selectedTicketType?.name} × {quantity}</p>
                <p className="font-bold text-primary">{formatPrice(getTotalAmount())}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SelfServiceTerminal;