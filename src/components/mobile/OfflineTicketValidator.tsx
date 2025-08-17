import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Camera, 
  Keyboard, 
  Search, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Users,
  Clock,
  Database,
  AlertTriangle,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOfflineValidator } from '@/hooks/useOfflineValidator';
import { useTheme } from 'next-themes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import QrScanner from 'qr-scanner';

interface ValidationResult {
  isValid: boolean;
  message: string;
  ticket?: any;
}

const OfflineTicketValidator = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [inputMode, setInputMode] = useState<'scanner' | 'manual' | 'search'>('search');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const {
    tickets,
    searchQuery,
    setSearchQuery,
    syncStatus,
    isLoading,
    validateTicket,
    forcSync,
    getCurrentDate
  } = useOfflineValidator();

  // Scanner QR Code
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
        description: "Não foi possível iniciar a câmera.",
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
    await handleValidation(code);
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
    handleValidation(manualCode.trim());
  };

  const handleValidation = async (code: string) => {
    const result = await validateTicket(code);
    
    setValidationResult({
      isValid: result.success,
      message: result.message,
      ticket: result.ticket
    });

    setManualCode('');
  };

  const resetValidation = () => {
    setValidationResult(null);
    setManualCode('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Limpar scanner ao trocar de modo
  useEffect(() => {
    if (inputMode !== 'scanner') {
      stopScanner();
    }
  }, [inputMode]);

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Header com Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Validador Offline
            </div>
            <div className="flex items-center gap-3">
              {/* Seletor de Tema */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {theme === 'light' ? (
                      <Sun className="h-4 w-4" />
                    ) : theme === 'dark' ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="h-4 w-4 mr-2" />
                    Claro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="h-4 w-4 mr-2" />
                    Escuro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="h-4 w-4 mr-2" />
                    Sistema
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Status Online/Offline */}
              <div className="flex items-center gap-2">
                {syncStatus.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <Badge variant={syncStatus.isOnline ? "default" : "secondary"}>
                  {syncStatus.isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{syncStatus.totalTickets}</p>
              <p className="text-xs text-muted-foreground">Ingressos Hoje</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{syncStatus.pendingSync}</p>
              <p className="text-xs text-muted-foreground">Pendente Sync</p>
            </div>
            <div>
              <p className="text-sm font-medium">{getCurrentDate()}</p>
              <p className="text-xs text-muted-foreground">Data Atual</p>
            </div>
          </div>
          
          {syncStatus.lastSync && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Última sync: {syncStatus.lastSync.toLocaleTimeString('pt-BR')}</span>
              <Button variant="ghost" size="sm" onClick={forcSync} disabled={isLoading}>
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      {!syncStatus.isOnline && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Modo offline ativo. Validações serão sincronizadas quando voltar online.
          </AlertDescription>
        </Alert>
      )}

      {syncStatus.pendingSync > 0 && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            {syncStatus.pendingSync} validações aguardando sincronização.
          </AlertDescription>
        </Alert>
      )}

      {/* Modos de Entrada */}
      <div className="flex gap-2">
        <Button
          variant={inputMode === 'search' ? 'default' : 'outline'}
          onClick={() => setInputMode('search')}
          className="flex-1"
        >
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
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
                    <p><strong>Valor:</strong> {formatPrice(validationResult.ticket.unit_price)}</p>
                    <p><strong>Número:</strong> {validationResult.ticket.ticket_number}</p>
                    {!syncStatus.isOnline && (
                      <Badge variant="secondary" className="mt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        Validação Offline
                      </Badge>
                    )}
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

      {/* Busca por Nome */}
      {!validationResult && inputMode === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Buscar por Nome
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome, email ou CPF do cliente..."
              className="text-base"
            />
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {tickets.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum ingresso encontrado para hoje
                </p>
              )}
              
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleValidation(ticket.qr_code)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ticket.customer_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {ticket.customer_email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.ticket_number} • {ticket.ticket_type} • {formatPrice(ticket.unit_price)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={ticket.status === 'used' ? 'secondary' : 'default'}>
                        {ticket.status === 'used' ? 'Usado' : 'Válido'}
                      </Badge>
                      {ticket.needs_sync && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-2 w-2 mr-1" />
                          Sync
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
};

export default OfflineTicketValidator;