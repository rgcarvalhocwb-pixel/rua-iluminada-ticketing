import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin, Sparkles } from "lucide-react";
import logoRuaIluminada from "@/assets/logo-rua-iluminada.webp";

export const HeroSection = () => {
  const [totalShowTimes, setTotalShowTimes] = useState<number>(0);

  useEffect(() => {
    const fetchShowTimes = async () => {
      try {
        const { data, error } = await supabase
          .from('show_times')
          .select('id');

        if (error) throw error;
        setTotalShowTimes(data?.length || 0);
      } catch (error) {
        console.error('Erro ao buscar horários:', error);
        setTotalShowTimes(6); // Fallback para 6 se houver erro
      }
    };

    fetchShowTimes();

    // Escutar mudanças nos horários
    const handleShowTimesUpdate = () => {
      fetchShowTimes();
    };

    window.addEventListener('eventsUpdated', handleShowTimesUpdate);

    return () => {
      window.removeEventListener('eventsUpdated', handleShowTimesUpdate);
    };
  }, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/lovable-uploads/c2d39665-54d0-425c-8022-13fd43871e5f.png)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/90" />
      </div>
      
      {/* Floating lights animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-pulse absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full shadow-glow" />
        <div className="animate-pulse absolute top-1/3 right-1/3 w-1 h-1 bg-accent rounded-full shadow-glow opacity-60" style={{ animationDelay: '1s' }} />
        <div className="animate-pulse absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-secondary rounded-full shadow-glow opacity-80" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Logo Oficial */}
        <div className="mb-8 animate-in slide-in-from-top-8 duration-1000">
          <img 
            src={logoRuaIluminada} 
            alt="Rua Iluminada - Família Moletta" 
            className="mx-auto h-32 md:h-40 w-auto drop-shadow-2xl"
          />
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Família Moletta 2025
          </span>
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        </div>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-in slide-in-from-bottom-8 duration-1000 delay-200">
          14 de Novembro a 31 de Dezembro de 2025<br />
          <span className="text-primary font-semibold">48 dias de espetáculo natalino</span>
        </p>
        
        {/* Event Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 animate-in slide-in-from-bottom-8 duration-1000 delay-400">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-soft">
            <CalendarDays className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Período</p>
            <p className="font-semibold">48 Dias Consecutivos</p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-soft">
            <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Horários</p>
            <p className="font-semibold">19h às 23h30</p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-soft">
            <MapPin className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Shows</p>
            <p className="font-semibold">
              {totalShowTimes} {totalShowTimes === 1 ? 'Sessão Diária' : 'Sessões Diárias'}
            </p>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-8 duration-1000 delay-600">
          <Button 
            size="lg" 
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300 transform hover:scale-105 px-8 py-3 text-lg font-semibold"
            onClick={() => {
              document.getElementById('ticket-selector')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Comprar Ingressos
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300 px-8 py-3 text-lg"
            onClick={() => {
              window.open('https://ruailuminada.com.br/#programacao', '_blank');
            }}
          >
            Ver Programação
          </Button>
        </div>
      </div>
    </section>
  );
};