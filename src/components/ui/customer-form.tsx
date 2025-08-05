import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomerFormProps {
  ticketData: {
    selectedDate: Date;
    selectedTime: string;
    ticketQuantities: Record<string, number>;
    totalPrice: number;
    totalTickets: number;
  };
  onBack: () => void;
  onProceedToPayment: (customerData: CustomerData) => void;
}

export interface CustomerData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

export const CustomerForm = ({ ticketData, onBack, onProceedToPayment }: CustomerFormProps) => {
  const { toast } = useToast();
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    email: "",
    cpf: "",
    phone: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    
    // Validação básica do CPF
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    
    return digit1 === parseInt(numbers[9]) && digit2 === parseInt(numbers[10]);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    if (field === 'cpf') {
      const formatted = formatCPF(value);
      if (formatted.replace(/\D/g, '').length <= 11) {
        setCustomerData(prev => ({ ...prev, [field]: formatted }));
      }
    } else if (field === 'phone') {
      const formatted = formatPhone(value);
      if (formatted.replace(/\D/g, '').length <= 11) {
        setCustomerData(prev => ({ ...prev, [field]: formatted }));
      }
    } else {
      setCustomerData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome completo.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(customerData.email)) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, informe um e-mail válido.",
        variant: "destructive"
      });
      return;
    }

    if (!validateCPF(customerData.cpf)) {
      toast({
        title: "CPF inválido",
        description: "Por favor, informe um CPF válido.",
        variant: "destructive"
      });
      return;
    }

    if (!customerData.phone.trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Por favor, informe seu telefone.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      onProceedToPayment(customerData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar seus dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-2 md:px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à seleção
        </Button>
        
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Dados do Comprador
        </h1>
        <p className="text-muted-foreground">
          Informe seus dados para finalizar a compra
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card className="bg-card/50 backdrop-blur-sm border-border shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Todos os campos são obrigatórios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={customerData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={customerData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={customerData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg py-6"
                    disabled={isLoading}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {isLoading ? "Processando..." : "Continuar para Pagamento"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Informações de Segurança */}
          <Card className="mt-6 bg-accent/10 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Seus dados estão seguros</p>
                  <p className="text-xs text-muted-foreground">
                    Utilizamos criptografia para proteger suas informações pessoais
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo do Pedido */}
        <div>
          <Card className="bg-gradient-secondary border-border shadow-magic sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-semibold">
                  {ticketData.selectedDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Horário</p>
                <p className="font-semibold">{ticketData.selectedTime}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ingressos</p>
                {Object.entries(ticketData.ticketQuantities).map(([type, quantity]) => {
                  if (quantity === 0) return null;
                  const price = type === 'inteira' ? 30 : 15;
                  return (
                    <div key={type} className="flex justify-between">
                      <span>
                        {quantity}x {type === 'inteira' ? 'Inteira' : 'Meia-entrada'}
                      </span>
                      <span>R$ {(price * quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    R$ {ticketData.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};