import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Users, Zap } from "lucide-react";
import { useState } from "react";
import { format, addDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const timeSlots = [
  { time: "19:00", available: 45, total: 100 },
  { time: "20:00", available: 12, total: 100 },
  { time: "21:00", available: 0, total: 100 },
  { time: "22:00", available: 67, total: 100 },
  { time: "23:00", available: 89, total: 100 },
  { time: "23:30", available: 23, total: 100 },
];

const ticketTypes = [
  { 
    id: "inteira", 
    name: "Inteira", 
    price: 30.00, 
    description: "Ingresso padrão para o evento",
    icon: Users 
  },
  { 
    id: "meia", 
    name: "Meia-entrada", 
    price: 15.00, 
    description: "Para estudantes, idosos e pessoas com deficiência",
    icon: Zap 
  },
];

interface TicketSelectorProps {
  onProceedToCheckout?: (ticketData: {
    selectedDate: Date;
    selectedTime: string;
    ticketQuantities: Record<string, number>;
    totalPrice: number;
    totalTickets: number;
  }) => void;
}

export const TicketSelector = ({ onProceedToCheckout }: TicketSelectorProps) => {
  // Datas do evento: 14 de novembro a 31 de dezembro de 2025
  const eventStartDate = new Date(2025, 10, 14); // November is month 10
  const eventEndDate = new Date(2025, 11, 31); // December is month 11
  
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({
    inteira: 0,
    meia: 0,
  });

  const isDateInEventRange = (date: Date) => {
    return isWithinInterval(date, { start: eventStartDate, end: eventEndDate });
  };

  const getAvailabilityStatus = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (available === 0) return { text: "Esgotado", variant: "destructive" as const };
    if (percentage <= 20) return { text: "Últimos ingressos", variant: "secondary" as const };
    return { text: "Disponível", variant: "default" as const };
  };

  const updateQuantity = (type: string, change: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [type]: Math.max(0, Math.min(10, prev[type] + change))
    }));
  };

  const getTotalPrice = () => {
    return Object.entries(ticketQuantities).reduce((total, [type, quantity]) => {
      const ticketType = ticketTypes.find(t => t.id === type);
      return total + (ticketType?.price || 0) * quantity;
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <section id="ticket-selector" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Escolha sua Experiência
          </h2>
          <p className="text-xl text-muted-foreground">
            Selecione a data, horário e ingressos para sua sessão mágica
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Date and Time Selection */}
          <div className="space-y-6">
            {/* Date Picker */}
            <Card className="bg-card/50 backdrop-blur-sm border-border shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Escolha a Data
                </CardTitle>
                <CardDescription>
                  14 de novembro a 31 de dezembro de 2025
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => !isDateInEventRange(date)}
                      fromDate={eventStartDate}
                      toDate={eventEndDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Time Selection */}
            <Card className="bg-card/50 backdrop-blur-sm border-border shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Horários Disponíveis
                </CardTitle>
                <CardDescription>
                  6 sessões especiais todos os dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((slot) => {
                    const status = getAvailabilityStatus(slot.available, slot.total);
                    const isDisabled = slot.available === 0;
                    
                    return (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        disabled={isDisabled}
                        onClick={() => setSelectedTime(slot.time)}
                        className="h-auto p-4 flex flex-col items-center gap-2 relative"
                      >
                        <span className="text-lg font-semibold">{slot.time}</span>
                        <Badge variant={status.variant} className="text-xs">
                          {status.text}
                        </Badge>
                        {!isDisabled && (
                          <span className="text-xs text-muted-foreground">
                            {slot.available} vagas
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Selection */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-secondary" />
                  Tipos de Ingresso
                </CardTitle>
                <CardDescription>
                  Escolha a quantidade de cada tipo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticketTypes.map((ticket) => {
                  const Icon = ticket.icon;
                  const quantity = ticketQuantities[ticket.id];
                  
                  return (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{ticket.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.description}
                          </p>
                          <p className="text-lg font-bold text-primary">
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
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(ticket.id, 1)}
                          disabled={quantity >= 10}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Summary and Checkout */}
            {getTotalTickets() > 0 && (
              <Card className="bg-gradient-secondary border-border shadow-magic">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total de Ingressos:</span>
                      <span className="text-lg font-bold">{getTotalTickets()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold">Valor Total:</span>
                      <span className="text-2xl font-bold text-primary">
                        R$ {getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                    
                    {selectedDate && selectedTime && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-2">
                          Data: {format(selectedDate, "PPP", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Horário: {selectedTime}
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg py-6"
                      disabled={!selectedDate || !selectedTime}
                      onClick={() => {
                        if (selectedDate && selectedTime && getTotalTickets() > 0) {
                          const ticketData = {
                            selectedDate,
                            selectedTime,
                            ticketQuantities,
                            totalPrice: getTotalPrice(),
                            totalTickets: getTotalTickets()
                          };
                          // Esta função será passada via props
                          onProceedToCheckout?.(ticketData);
                        }
                      }}
                    >
                      Continuar para Pagamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};