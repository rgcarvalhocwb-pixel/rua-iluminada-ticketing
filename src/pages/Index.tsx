import { Link } from 'react-router-dom';
import { HeroSection } from "@/components/ui/hero-section";
import { TicketSelector } from "@/components/ui/ticket-selector";
import { CustomerForm } from "@/components/ui/customer-form";
import { HalfPriceInfo } from "@/components/ui/half-price-info";
import { ChristmasEffects } from "@/components/ui/christmas-effects";
import { useTicketFlow } from "@/hooks/use-ticket-flow";

const Index = () => {
  const { 
    currentStep, 
    ticketData, 
    proceedToCustomerForm, 
    proceedToPayment, 
    goBack 
  } = useTicketFlow();

  if (currentStep === 'customer-form' && ticketData) {
    return (
      <div className="min-h-screen bg-background p-2 md:p-0">
        <CustomerForm
          ticketData={ticketData}
          onBack={goBack}
          onProceedToPayment={proceedToPayment}
        />
      </div>
    );
  }

  if (currentStep === 'payment') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Processando Pagamento</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Complete o pagamento na janela do PagSeguro para finalizar sua compra.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Christmas Effects */}
      <ChristmasEffects />
      
      <HeroSection />
      <TicketSelector onProceedToCheckout={proceedToCustomerForm} />
      <HalfPriceInfo />
    </div>
  );
};

export default Index;
