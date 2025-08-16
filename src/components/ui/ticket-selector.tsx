import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Clock, MapPin, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TicketType {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_active: boolean;
}

interface ShowTime {
  id: string;
  time_slot: string;
  capacity: number;
  event_id: string;
}

interface TicketSelectorProps {
  onProceedToCheckout: (data: any) => void;
}

export const TicketSelector = ({ onProceedToCheckout }: TicketSelectorProps) => {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [showTimes, setShowTimes] = useState<ShowTime[]>([]);
  const [selectedTicketType, setSelectedTicketType] = useState<string>('');
  const [selectedShowTime, setSelectedShowTime] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();

    // Listener para atualizações em tempo real quando eventos são alterados no admin
    const handleEventsUpdate = () => {
      fetchData();
    };

    window.addEventListener('eventsUpdated', handleEventsUpdate);
    return () => window.removeEventListener('eventsUpdated', handleEventsUpdate);
  }, []);

  const fetchData = async () => {
    try {
      const [ticketTypesResult, showTimesResult] = await Promise.all([
        supabase.from('ticket_types').select('*').eq('is_active', true),
        supabase.from('show_times').select('*').order('time_slot', { ascending: true })
      ]);

      if (ticketTypesResult.error) throw ticketTypesResult.error;
      if (showTimesResult.error) throw showTimesResult.error;

      setTicketTypes(ticketTypesResult.data || []);
      setShowTimes(showTimesResult.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar informações dos ingressos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketType);
  const selectedShow = showTimes.find(s => s.id === selectedShowTime);
  const totalPrice = selectedTicket ? selectedTicket.price * quantity : 0;

  // Definir tema dinâmico do Resumo conforme o tipo de ingresso
  const getTicketTheme = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('vip')) return { from: 'success', to: 'secondary', accent: 'success' } as const;
    if (n.includes('meia')) return { from: 'secondary', to: 'primary', accent: 'secondary' } as const;
    if (n.includes('cortes')) return { from: 'muted', to: 'secondary', accent: 'muted-foreground' } as const;
    // padrão (ex.: inteira)
    return { from: 'primary', to: 'secondary', accent: 'secondary' } as const;
  };

  const theme = getTicketTheme(selectedTicket?.name);
  const summaryCardStyle = {
    background: `linear-gradient(135deg, hsl(var(--${theme.from}) / 0.15), hsl(var(--${theme.to}) / 0.15))`,
    borderColor: `hsl(var(--${theme.accent}))`,
  };
  const handleProceed = () => {
    if (!selectedTicket || !selectedShow) {
      toast({
        title: "Seleção incompleta",
        description: "Por favor, selecione o tipo de ingresso e horário",
        variant: "destructive",
      });
      return;
    }

    onProceedToCheckout({
      ticketType: selectedTicket,
      showTime: selectedShow,
      quantity,
      totalPrice
    });
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-white">Carregando ingressos...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="ticket-section" className="py-16 px-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-red-600/20 to-yellow-600/20 rounded-full mb-6">
            <Gift className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Adquira seus <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">Ingressos</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Garante sua entrada para a experiência natalina mais mágica da região
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seleção de Ingressos */}
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Users className="mr-2 h-5 w-5 text-yellow-400" />
                  Tipos de Ingresso
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Escolha o tipo de ingresso desejado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticketTypes.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedTicketType === ticket.id
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                    onClick={() => setSelectedTicketType(ticket.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-white">{ticket.name}</h3>
                        {ticket.description && (
                          <p className="text-sm text-gray-300 mt-1">{ticket.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-red-600 text-white">
                        R$ {ticket.price.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Calendar className="mr-2 h-5 w-5 text-yellow-400" />
                  Data e Horário
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Selecione quando deseja visitar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedShowTime} onValueChange={setSelectedShowTime}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Escolha uma data e horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {showTimes.map((show) => (
                      <SelectItem key={show.id} value={show.id}>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {show.time_slot}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Users className="mr-2 h-5 w-5 text-yellow-400" />
                  Quantidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    -
                  </Button>
                  <span className="text-2xl font-bold text-white min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    +
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:sticky lg:top-8">
            <Card className="backdrop-blur-md border" style={summaryCardStyle}>
              <CardHeader>
                <CardTitle className="text-white text-xl">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedTicket && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/20">
                      <span className="text-gray-300">Tipo de Ingresso</span>
                      <span className="text-white font-semibold">{selectedTicket.name}</span>
                    </div>
                    
                    {selectedShow && (
                      <div className="flex justify-between items-center pb-2 border-b border-white/20">
                        <span className="text-gray-300">Data e Horário</span>
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            {selectedShow.time_slot}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pb-2 border-b border-white/20">
                      <span className="text-gray-300">Quantidade</span>
                      <span className="text-white font-semibold">{quantity}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span style={{ color: `hsl(var(--${theme.accent}))` }}>Total</span>
                      <span style={{ color: `hsl(var(--${theme.accent}))` }}>R$ {totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleProceed}
                  disabled={!selectedTicket || !selectedShow}
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold py-3 text-lg shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  🎄 Continuar para Pagamento
                </Button>

                <div className="text-center bg-white/10 p-3 rounded-lg border border-white/20">
                  <div className="flex items-center justify-center space-x-2 text-white text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    <span>R. Nicola Pellanda, 5962 - Umbará, Curitiba - PR, 81940-305</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};