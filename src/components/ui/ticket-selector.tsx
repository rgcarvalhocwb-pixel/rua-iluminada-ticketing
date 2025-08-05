import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Users, Zap, Loader2, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { format, addDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  description: string | null;
  price: number;
  event_id: string;
}

interface ShowTime {
  id: string;
  time_slot: string;
  capacity: number;
  event_id: string;
}

interface TicketSelectorProps {
  onProceedToCheckout?: (ticketData: {
    selectedDate: Date;
    selectedTime: string;
    ticketQuantities: Record<string, number>;
    totalPrice: number;
    totalTickets: number;
    eventId: string;
    eventName: string;
  }) => void;
}

export const TicketSelector = ({ onProceedToCheckout }: TicketSelectorProps) => {
  const { toast } = useToast();
  
  // Estado para dados dinâmicos
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [showTimes, setShowTimes] = useState<ShowTime[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para seleções do usuário
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});

  // Buscar eventos e dados relacionados
  useEffect(() => {
    fetchEventData();
    
    // Listener para atualizações de eventos vindas do admin
    const handleEventsUpdate = () => {
      fetchEventData();
    };
    
    window.addEventListener('eventsUpdated', handleEventsUpdate);
    
    return () => {
      window.removeEventListener('eventsUpdated', handleEventsUpdate);
    };
  }, []);

  // Atualizar tipos de ticket quando evento muda
  useEffect(() => {
    if (selectedEvent) {
      fetchTicketTypes();
      fetchShowTimes();
    }
  }, [selectedEvent]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setEvents(eventsData || []);
      
      // Selecionar o primeiro evento por padrão
      if (eventsData && eventsData.length > 0) {
        setSelectedEvent(eventsData[0]);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketTypes = async () => {
    if (!selectedEvent) return;
    
    try {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', selectedEvent.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      setTicketTypes(data || []);
      
      // Inicializar quantidades
      const initialQuantities: Record<string, number> = {};
      data?.forEach(type => {
        initialQuantities[type.id] = 0;
      });
      setTicketQuantities(initialQuantities);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de ingresso: " + error.message,
        variant: "destructive"
      });
    }
  };

  const fetchShowTimes = async () => {
    if (!selectedEvent) return;
    
    try {
      const { data, error } = await supabase
        .from('show_times')
        .select('*')
        .eq('event_id', selectedEvent.id)
        .order('time_slot', { ascending: true });

      if (error) throw error;
      setShowTimes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar horários: " + error.message,
        variant: "destructive"
      });
    }
  };

  const isDateInEventRange = (date: Date) => {
    if (!selectedEvent) return false;
    const eventStart = new Date(selectedEvent.start_date);
    const eventEnd = new Date(selectedEvent.end_date);
    return isWithinInterval(date, { start: eventStart, end: eventEnd });
  };

  const getAvailabilityStatus = (capacity: number) => {
    // Por enquanto assumimos disponibilidade total, mas isso pode ser calculado
    // baseado nas vendas quando implementarmos o controle de estoque
    const available = capacity;
    const percentage = 100; // (available / capacity) * 100;
    
    if (available === 0) return { text: "Esgotado", variant: "destructive" as const };
    if (percentage <= 20) return { text: "Últimos ingressos", variant: "secondary" as const };
    return { text: "Disponível", variant: "default" as const };
  };

  const updateQuantity = (typeId: string, change: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [typeId]: Math.max(0, Math.min(10, (prev[typeId] || 0) + change))
    }));
  };

  const getTotalPrice = () => {
    return Object.entries(ticketQuantities).reduce((total, [typeId, quantity]) => {
      const ticketType = ticketTypes.find(t => t.id === typeId);
      return total + (ticketType?.price || 0) * quantity;
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  if (loading) {
    return (
      <section id="ticket-selector" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            <span>Carregando eventos...</span>
          </div>
        </div>
      </section>
    );
  }

  if (!selectedEvent) {
    return (
      <section id="ticket-selector" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="text-xl text-muted-foreground">
              Nenhum evento disponível no momento.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="ticket-selector" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 christmas-text">
            {selectedEvent.name}
          </h2>
          <p className="text-xl text-foreground/80">
            {selectedEvent.description || "Selecione a data, horário e ingressos para sua sessão mágica"}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Date and Time Selection */}
          <div className="space-y-6">
            {/* Date Picker */}
            <div className="christmas-card p-6 rounded-xl">
              <div className="mb-4">
                <h3 className="text-xl font-semibold gold-accent flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Escolha a Data
                </h3>
                <p className="text-foreground/70 mt-1">
                  {format(new Date(selectedEvent.start_date), "dd 'de' MMMM", { locale: ptBR })} a {format(new Date(selectedEvent.end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal christmas-input border-accent/30 text-foreground"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 christmas-select">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => !isDateInEventRange(date)}
                      fromDate={new Date(selectedEvent.start_date)}
                      toDate={new Date(selectedEvent.end_date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Time Selection */}
            <div className="christmas-card p-6 rounded-xl">
              <div className="mb-4">
                <h3 className="text-xl font-semibold gold-accent flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horários Disponíveis
                </h3>
                <p className="text-foreground/70 mt-1">
                  {showTimes.length} horários disponíveis
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {showTimes.map((showTime) => {
                  const status = getAvailabilityStatus(showTime.capacity);
                  const isDisabled = false; // Por enquanto não há controle de estoque
                  
                  return (
                    <Button
                      key={showTime.id}
                      variant={selectedTime === showTime.time_slot ? "default" : "outline"}
                      disabled={isDisabled}
                      onClick={() => setSelectedTime(showTime.time_slot)}
                      className={cn(
                        "h-auto p-4 flex flex-col items-center gap-2 relative transition-all duration-300",
                        selectedTime === showTime.time_slot 
                          ? "christmas-button" 
                          : "christmas-input border-accent/30 hover:border-accent/60"
                      )}
                    >
                      <span className="text-lg font-semibold">{showTime.time_slot}</span>
                      <Badge variant={status.variant} className="text-xs">
                        {status.text}
                      </Badge>
                      <span className="text-xs text-foreground/60">
                        {showTime.capacity} vagas
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="space-y-6">
            <div className="christmas-card p-6 rounded-xl">
              <div className="mb-6">
                <h3 className="text-xl font-semibold gold-accent flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Tipos de Ingresso
                </h3>
                <p className="text-foreground/70 mt-1">
                  Escolha a quantidade de cada tipo
                </p>
              </div>
              
              <div className="space-y-4">
                {ticketTypes.map((ticket) => {
                  const Icon = ticket.name.toLowerCase().includes('meia') ? Zap : Users;
                  const quantity = ticketQuantities[ticket.id] || 0;
                  
                  return (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-accent/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/20 rounded-lg">
                          <Icon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{ticket.name}</p>
                          <p className="text-sm text-foreground/60">
                            {ticket.description || "Ingresso para o evento"}
                          </p>
                          <p className="text-lg font-bold text-accent">
                            R$ {ticket.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(ticket.id, -1)}
                          disabled={quantity === 0}
                          className="christmas-input border-accent/30 w-8 h-8 p-0"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-semibold text-foreground">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(ticket.id, 1)}
                          disabled={quantity >= 10}
                          className="christmas-input border-accent/30 w-8 h-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary and Checkout */}
            {getTotalTickets() > 0 && (
              <div className="christmas-card p-6 rounded-xl border-accent/40">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">Total de Ingressos:</span>
                    <span className="text-lg font-bold text-accent">{getTotalTickets()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-foreground">Valor Total:</span>
                    <span className="text-2xl font-bold gold-accent">
                      R$ {getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                  
                  {selectedDate && selectedTime && (
                    <div className="pt-4 border-t border-accent/20">
                      <p className="text-sm text-foreground/70 mb-2">
                        Data: {format(selectedDate, "PPP", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-foreground/70">
                        Horário: {selectedTime}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full christmas-button text-lg py-6 font-semibold"
                    disabled={!selectedDate || !selectedTime || getTotalTickets() === 0}
                    onClick={() => {
                      if (selectedDate && selectedTime && getTotalTickets() > 0 && selectedEvent) {
                        const ticketData = {
                          selectedDate,
                          selectedTime,
                          ticketQuantities,
                          totalPrice: getTotalPrice(),
                          totalTickets: getTotalTickets(),
                          eventId: selectedEvent.id,
                          eventName: selectedEvent.name
                        };
                        onProceedToCheckout?.(ticketData);
                      }
                    }}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Continuar para Pagamento
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};