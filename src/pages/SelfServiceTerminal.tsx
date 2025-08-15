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

const SelfServiceTerminal = () => {
  const [isIdle, setIsIdle] = useState(true);
  const [currentStep, setCurrentStep] = useState<'selection' | 'payment' | 'printing'>('selection');
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
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

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
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

  const handleBackToIdle = () => {
    setIsIdle(true);
    setCurrentStep('selection');
    setQuantity(1);
  };

  if (isIdle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-secondary/5 flex items-center justify-center relative">
        {/* Video Background Placeholder */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-center text-white">
            <Play className="h-24 w-24 mx-auto mb-4 opacity-50" />
            <p className="text-xl opacity-75">Vídeo promocional do evento...</p>
          </div>
        </div>
        
        {/* Touch to Start Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/40 hover:bg-black/30 transition-colors"
          onClick={handleStartPurchase}
        >
          <Card className="p-12 text-center bg-white/95 backdrop-blur-sm border-2 border-primary/20 shadow-2xl">
            <ShoppingCart className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              Terminal de Auto Atendimento
            </h1>
            <p className="text-2xl text-muted-foreground mb-6">
              Clique em qualquer local da tela para iniciar sua compra
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
                          disabled={quantity >= 10}
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
              >
                <span className="text-2xl">💳</span>
                <span>Cartão</span>
                <span className="text-sm text-muted-foreground">Débito/Crédito</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-24 text-xl flex flex-col items-center justify-center space-y-2 border-2 hover:border-primary"
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
            <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold mb-4">
              Processando Pagamento...
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Aguarde enquanto processamos seu pagamento e imprimimos seus ingressos.
            </p>
            
            <div className="space-y-4 text-left bg-muted/50 p-6 rounded-lg">
              <p className="flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-3"></span>
                Pagamento aprovado
              </p>
              <p className="flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-3"></span>
                Gerando comprovante
              </p>
              <p className="flex items-center">
                <span className="h-2 w-2 bg-yellow-500 rounded-full mr-3 animate-pulse"></span>
                Imprimindo ingressos...
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SelfServiceTerminal;