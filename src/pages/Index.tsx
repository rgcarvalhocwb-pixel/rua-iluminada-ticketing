import { Link } from 'react-router-dom';
import { HeroSection } from "@/components/ui/hero-section";
import { TicketSelector } from "@/components/ui/ticket-selector";
import { CustomerForm } from "@/components/ui/customer-form";
import { HalfPriceInfo } from "@/components/ui/half-price-info";
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
      <div className="min-h-screen bg-background">
        {/* Header com botão admin */}
        <header className="flex justify-between items-center p-6">
          <div></div>
          <Link 
            to="/admin" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Área Restrita
          </Link>
        </header>
        
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
      <div className="min-h-screen bg-background">
        {/* Header com botão admin */}
        <header className="flex justify-between items-center p-6">
          <div></div>
          <Link 
            to="/admin" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Área Restrita
          </Link>
        </header>
        
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center p-8">
            <h1 className="text-3xl font-bold mb-4">Processando Pagamento</h1>
            <p className="text-muted-foreground">
              Complete o pagamento na janela do PagSeguro para finalizar sua compra.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header com botão admin */}
      <header className="flex justify-between items-center p-6">
        <div></div>
        <Link 
          to="/admin" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Área Restrita
        </Link>
      </header>
      
      <HeroSection />
      <TicketSelector onProceedToCheckout={proceedToCustomerForm} />
      <HalfPriceInfo />
    </div>
  );
};

export default Index;
