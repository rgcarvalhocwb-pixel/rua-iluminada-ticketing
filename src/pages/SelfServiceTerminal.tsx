import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ShoppingCart } from "lucide-react";

const SelfServiceTerminal = () => {
  const [isIdle, setIsIdle] = useState(true);
  const [currentStep, setCurrentStep] = useState<'selection' | 'payment' | 'printing'>('selection');

  const handleStartPurchase = () => {
    setIsIdle(false);
    setCurrentStep('selection');
  };

  const handleBackToIdle = () => {
    setIsIdle(true);
    setCurrentStep('selection');
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
            <h2 className="text-2xl font-semibold mb-6">
              Selecione a quantidade de ingressos
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Disponível apenas ingresso inteiro. Para meia entrada, dirija-se ao caixa.
            </p>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-xl font-medium mb-2">Ingresso Inteiro</p>
                  <p className="text-3xl font-bold text-primary">R$ 50,00</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="lg" className="h-16 w-16 text-2xl">
                      -
                    </Button>
                    <span className="text-4xl font-bold min-w-[80px] text-center">1</span>
                    <Button variant="outline" size="lg" className="h-16 w-16 text-2xl">
                      +
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-2xl font-semibold">Total:</span>
                  <span className="text-3xl font-bold text-primary">R$ 50,00</span>
                </div>
                
                <Button 
                  className="w-full py-6 text-2xl"
                  onClick={() => setCurrentStep('payment')}
                >
                  Continuar para Pagamento
                </Button>
              </div>
            </div>
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
                <span className="text-2xl font-bold text-primary">R$ 50,00</span>
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