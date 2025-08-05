import { useEffect, useState } from 'react';
import { Calendar, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import logoRuaIluminada from '@/assets/logo-rua-iluminada.webp';
import heroImage from '@/assets/hero-rua-iluminada.jpg';

export const HeroSection = () => {
  const [totalShowTimes, setTotalShowTimes] = useState<number>(6);

  useEffect(() => {
    const fetchShowTimes = async () => {
      try {
        const { data, error } = await supabase
          .from('show_times')
          .select('*');
        
        if (!error && data) {
          setTotalShowTimes(data.length);
        }
      } catch (error) {
        console.error('Erro ao buscar horários:', error);
        setTotalShowTimes(6);
      }
    };

    fetchShowTimes();

    // Listener para atualizações em tempo real
    const handleEventsUpdate = () => {
      fetchShowTimes();
    };

    window.addEventListener('eventsUpdated', handleEventsUpdate);
    return () => window.removeEventListener('eventsUpdated', handleEventsUpdate);
  }, []);

  const scrollToTickets = () => {
    const ticketSection = document.getElementById('ticket-section');
    if (ticketSection) {
      ticketSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background com overlay elegante */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      
      {/* Efeito de luzes sutis */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-twinkle" />
        <div className="absolute top-32 right-20 w-1 h-1 bg-red-400 rounded-full animate-twinkle" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-green-400 rounded-full animate-twinkle" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-twinkle" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 text-center px-4 md:px-8 max-w-6xl mx-auto">
        {/* Logo Principal */}
        <div className="mb-8 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600/30 via-yellow-500/30 to-red-600/30 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            <img 
              src={logoRuaIluminada} 
              alt="Rua Iluminada - Família Moletta" 
              className="relative h-24 md:h-32 w-auto object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Título Principal */}
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent drop-shadow-lg">
              Rua Iluminada
            </span>
          </h1>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-red-100">
            Família Moletta
          </h2>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Viva a magia do Natal com uma experiência única de luzes, cores e alegria
          </p>
        </div>

        {/* Informações do Evento */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-600/20 rounded-full group-hover:bg-red-600/30 transition-colors">
                  <Calendar className="h-8 w-8 text-red-300" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Período</h3>
              <p className="text-red-100 text-lg">
                07 Dezembro a<br />06 Janeiro
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-yellow-600/20 rounded-full group-hover:bg-yellow-600/30 transition-colors">
                  <Clock className="h-8 w-8 text-yellow-300" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Horários</h3>
              <p className="text-yellow-100 text-lg">
                19h às 22h<br />Todos os dias
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-600/20 rounded-full group-hover:bg-green-600/30 transition-colors">
                  <Star className="h-8 w-8 text-green-300" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Shows</h3>
              <p className="text-green-100 text-lg">
                {totalShowTimes} apresentações<br />diárias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Actions */}
        <div className="space-y-4 md:space-y-0 md:space-x-6 md:flex md:justify-center">
          <Button
            onClick={scrollToTickets}
            size="lg"
            className="w-full md:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-red-500/50"
          >
            🎫 Comprar Ingressos
          </Button>
          
          <Button
            onClick={() => window.open('https://ruailuminada.com.br/', '_blank')}
            variant="outline"
            size="lg"
            className="w-full md:w-auto bg-white/10 backdrop-blur-md border-2 border-yellow-400/50 text-yellow-100 hover:bg-yellow-400/20 hover:text-white font-bold py-4 px-8 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            ✨ Ver Programação
          </Button>
        </div>
      </div>
    </section>
  );
};