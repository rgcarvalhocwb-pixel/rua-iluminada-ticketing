import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QrCode, CheckCircle, XCircle, Camera, Keyboard, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QrScanner from 'qr-scanner';

interface TicketInfo {
  id: string;
  ticket_number: string;
  qr_code: string;
  status: string;
  customer_name: string;
  customer_email: string;
  event_name: string;
  session_date: string;
  ticket_type: string;
  used_at?: string;
}

const TicketValidator = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    ticket?: TicketInfo;
  } | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketInfo[]>([]);
  const [inputMode, setInputMode] = useState<'scanner' | 'manual'>('scanner');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRecentTickets();
  }, []);

  const loadRecentTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          order_items!inner(
            orders!inner(
              customer_name,
              customer_email,
              session_id,
              event_sessions!inner(
                events!inner(name),
                session_date
              )
            ),
            ticket_types!inner(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedTickets: TicketInfo[] = data?.map((ticket: any) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        qr_code: ticket.qr_code,
        status: ticket.status,
        customer_name: ticket.order_items.orders.customer_name,
        customer_email: ticket.order_items.orders.customer_email,
        event_name: ticket.order_items.orders.event_sessions.events.name,
        session_date: ticket.order_items.orders.event_sessions.session_date,
        ticket_type: ticket.order_items.ticket_types.name,
        used_at: ticket.used_at
      })) || [];

      setRecentTickets(formattedTickets);
    } catch (error) {
      console.error('Erro ao carregar ingressos:', error);
    }
  };

  const startScanner = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setValidationResult(null);
      
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          handleScanResult(result.data);
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        }
      );

      await qrScannerRef.current.start();
    } catch (error) {
      console.error('Erro ao iniciar scanner:', error);
      toast({
        title: "Erro no Scanner",
        description: "Não foi possível iniciar a câmera. Verifique as permissões.",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = async (code: string) => {
    stopScanner();
    await validateTicket(code);
  };

  const handleManualValidation = () => {
    if (!manualCode.trim()) {
      toast({
        title: "Código Obrigatório",
        description: "Digite um código de ingresso para validar.",
        variant: "destructive"
      });
      return;
    }
    validateTicket(manualCode.trim());
  };

  const validateTicket = async (code: string) => {
    try {
      // Buscar ingresso pelo QR code ou número do ingresso
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          order_items!inner(
            orders!inner(
              customer_name,
              customer_email,
              session_id,
              event_sessions!inner(
                events!inner(name),
                session_date
              )
            ),
            ticket_types!inner(name)
          )
        `)
        .or(`qr_code.eq.${code},ticket_number.eq.${code}`)
        .single();

      if (error || !data) {
        setValidationResult({
          isValid: false,
          message: "Ingresso não encontrado ou inválido"
        });
        return;
      }

      // Verificar se já foi usado
      if (data.status === 'used' || data.used_at) {
        setValidationResult({
          isValid: false,
          message: "Ingresso já foi utilizado anteriormente"
        });
        return;
      }

      // Marcar como usado
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          validated_by: 'mobile_app'
        })
        .eq('id', data.id);

      if (updateError) {
        throw updateError;
      }

      // Registrar validação
      await supabase
        .from('validations')
        .insert({
          ticket_id: data.id,
          validation_method: inputMode === 'scanner' ? 'qr_scanner' : 'manual_entry',
          validator_user: 'mobile_validator',
          notes: `Validado via app mobile - ${inputMode === 'scanner' ? 'Scanner QR' : 'Entrada Manual'}`
        });

      const ticketInfo: TicketInfo = {
        id: data.id,
        ticket_number: data.ticket_number,
        qr_code: data.qr_code,
        status: 'used',
        customer_name: data.order_items.orders.customer_name,
        customer_email: data.order_items.orders.customer_email,
        event_name: data.order_items.orders.event_sessions.events.name,
        session_date: data.order_items.orders.event_sessions.session_date,
        ticket_type: data.order_items.ticket_types.name,
        used_at: new Date().toISOString()
      };

      setValidationResult({
        isValid: true,
        message: "Ingresso válido! Entrada liberada.",
        ticket: ticketInfo
      });

      // Atualizar lista de ingressos recentes
      loadRecentTickets();
      
      // Limpar código manual
      setManualCode('');

    } catch (error) {
      console.error('Erro na validação:', error);
      setValidationResult({
        isValid: false,
        message: "Erro ao validar ingresso. Tente novamente."
      });
    }
  };

  const resetValidation = () => {
    setValidationResult(null);
    setManualCode('');
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Validador de Ingressos
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Modo de entrada */}
      <div className="flex gap-2">
        <Button
          variant={inputMode === 'scanner' ? 'default' : 'outline'}
          onClick={() => setInputMode('scanner')}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          Scanner
        </Button>
        <Button
          variant={inputMode === 'manual' ? 'default' : 'outline'}
          onClick={() => setInputMode('manual')}
          className="flex-1"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Manual
        </Button>
      </div>

      {/* Resultado da Validação */}
      {validationResult && (
        <Card className={`${validationResult.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              {validationResult.isValid ? (
                <CheckCircle className="h-16 w-16 text-green-600" />
              ) : (
                <XCircle className="h-16 w-16 text-red-600" />
              )}
              
              <div>
                <p className={`font-bold text-lg ${validationResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                  {validationResult.message}
                </p>
                
                {validationResult.ticket && (
                  <div className="mt-4 space-y-2 text-sm">
                    <p><strong>Cliente:</strong> {validationResult.ticket.customer_name}</p>
                    <p><strong>Evento:</strong> {validationResult.ticket.event_name}</p>
                    <p><strong>Tipo:</strong> {validationResult.ticket.ticket_type}</p>
                    <p><strong>Número:</strong> {validationResult.ticket.ticket_number}</p>
                  </div>
                )}
              </div>

              <Button onClick={resetValidation} className="mt-4">
                Validar Novo Ingresso
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner QR Code */}
      {!validationResult && inputMode === 'scanner' && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Button onClick={startScanner} size="lg">
                      <Camera className="h-5 w-5 mr-2" />
                      Iniciar Scanner
                    </Button>
                  </div>
                )}
              </div>
              
              {isScanning && (
                <Button onClick={stopScanner} variant="outline" className="w-full">
                  Parar Scanner
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entrada Manual */}
      {!validationResult && inputMode === 'manual' && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Código do Ingresso
                </label>
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Digite o código QR ou número do ingresso"
                  className="text-center text-lg"
                />
              </div>
              
              <Button 
                onClick={handleManualValidation}
                className="w-full"
                disabled={!manualCode.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                Validar Ingresso
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Ingressos Recentes */}
      {!validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Validações Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum ingresso encontrado
                </p>
              ) : (
                recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {ticket.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ticket.ticket_number} • {ticket.ticket_type}
                      </p>
                    </div>
                    <Badge variant={ticket.status === 'used' ? 'secondary' : 'default'}>
                      {ticket.status === 'used' ? 'Usado' : 'Válido'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TicketValidator;