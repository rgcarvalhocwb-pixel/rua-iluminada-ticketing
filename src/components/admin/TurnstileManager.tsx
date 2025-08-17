import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTerminalHardware } from '@/hooks/useTerminalHardware';
import { DoorOpen, QrCode, CreditCard, Settings, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TurnstileConfig {
  id: string;
  name: string;
  location: string;
  ipAddress: string;
  qrReaderEnabled: boolean;
  cardReaderEnabled: boolean;
  terminalIntegration: boolean;
  allowCheckIn: boolean;
  allowValidation: boolean;
  status: 'online' | 'offline' | 'error';
}

const TurnstileManager = () => {
  const [turnstiles, setTurnstiles] = useState<TurnstileConfig[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const { toast } = useToast();
  const { 
    hardwareStatus, 
    checkHardwareStatus, 
    getTurnstiles, 
    validateTicketOnTurnstile 
  } = useTerminalHardware();

  useEffect(() => {
    loadTurnstileConfigs();
    checkHardwareStatus('turnstile');
  }, []);

  const loadTurnstileConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('turnstiles')
        .select('*')
        .order('name');

      if (error) throw error;

      const configs: TurnstileConfig[] = data?.map(t => ({
        id: t.id,
        name: t.name,
        location: t.location || '',
        ipAddress: t.ip_address?.toString() || '',
        qrReaderEnabled: true,
        cardReaderEnabled: true,
        terminalIntegration: true,
        allowCheckIn: true,
        allowValidation: true,
        status: t.status === 'active' ? 'online' : 'offline'
      })) || [];

      setTurnstiles(configs);
    } catch (error: any) {
      console.error('Erro ao carregar catracas:', error);
      toast({
        title: "Erro ao carregar catracas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveTurnstileConfig = async (config: TurnstileConfig) => {
    try {
      const { error } = await supabase
        .from('turnstiles')
        .upsert({
          id: config.id,
          name: config.name,
          location: config.location,
          ip_address: config.ipAddress,
          status: config.status === 'online' ? 'active' : 'inactive'
        });

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: `Catraca ${config.name} configurada com sucesso`,
      });
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const testTurnstileConnection = async (turnstileId: string) => {
    setTestLoading(true);
    try {
      // Testar conexão com a catraca
      const testData = await validateTicketOnTurnstile(turnstileId, {
        qrCode: 'TEST_QR_CODE',
        validatorUser: 'system@test',
        isTerminalCheckIn: false
      });

      setTestResult({
        turnstileId,
        success: testData.success,
        error: testData.error
      });

      if (testData.success) {
        toast({
          title: "Teste bem-sucedido",
          description: "Catraca respondeu corretamente",
        });
      }
    } catch (error: any) {
      setTestResult({
        turnstileId,
        success: false,
        error: error.message
      });
      
      toast({
        title: "Teste falhou",
        description: "Erro na comunicação com a catraca",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const updateTurnstile = (id: string, updates: Partial<TurnstileConfig>) => {
    setTurnstiles(prev => 
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  };

  const detectedTurnstiles = getTurnstiles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Catracas</h2>
          <p className="text-muted-foreground">
            Configure e monitore as catracas Topdata Fit com leitores QR e cartões
          </p>
        </div>
        
        <Button onClick={() => checkHardwareStatus('turnstile')}>
          <DoorOpen className="h-4 w-4 mr-2" />
          Detectar Catracas
        </Button>
      </div>

      <Tabs defaultValue="detected" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detected">Detectadas</TabsTrigger>
          <TabsTrigger value="configuration">Configuração</TabsTrigger>
          <TabsTrigger value="integration">Integração</TabsTrigger>
        </TabsList>

        <TabsContent value="detected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5" />
                Catracas Detectadas
              </CardTitle>
              <CardDescription>
                Status em tempo real das catracas conectadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectedTurnstiles.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <DoorOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma catraca detectada</p>
                  <p className="text-sm">Verifique as conexões de rede</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {detectedTurnstiles.map((turnstile) => (
                    <div key={turnstile.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-secondary rounded-lg">
                          <DoorOpen className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{turnstile.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>Última verificação: {new Date(turnstile.lastChecked).toLocaleTimeString()}</span>
                          </div>
                          {turnstile.details?.terminalIntegration === 'enabled' && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Zap className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-blue-600">Integração Terminal Ativa</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {turnstile.details?.qrReaderStatus === 'active' && (
                          <div className="flex items-center space-x-1">
                            <QrCode className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600">QR OK</span>
                          </div>
                        )}
                        
                        {turnstile.details?.cardReaderStatus === 'active' && (
                          <div className="flex items-center space-x-1">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-blue-600">Cartão OK</span>
                          </div>
                        )}
                        
                        <Badge 
                          variant={turnstile.status === 'online' ? "default" : "destructive"}
                        >
                          {turnstile.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testTurnstileConnection(turnstile.id)}
                          disabled={testLoading}
                        >
                          Testar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações das Catracas</CardTitle>
              <CardDescription>
                Configure parâmetros individuais de cada catraca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {turnstiles.map((turnstile) => (
                <div key={turnstile.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{turnstile.name}</h3>
                    <Badge variant={turnstile.status === 'online' ? "default" : "destructive"}>
                      {turnstile.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Catraca</Label>
                      <Input
                        value={turnstile.name}
                        onChange={(e) => updateTurnstile(turnstile.id, { name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label>Localização</Label>
                      <Input
                        value={turnstile.location}
                        onChange={(e) => updateTurnstile(turnstile.id, { location: e.target.value })}
                        placeholder="Ex: Entrada Principal"
                      />
                    </div>
                    
                    <div>
                      <Label>Endereço IP</Label>
                      <Input
                        value={turnstile.ipAddress}
                        onChange={(e) => updateTurnstile(turnstile.id, { ipAddress: e.target.value })}
                        placeholder="192.168.1.100"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Recursos</h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <QrCode className="h-4 w-4" />
                          <Label>Leitor QR Code</Label>
                        </div>
                        <Switch
                          checked={turnstile.qrReaderEnabled}
                          onCheckedChange={(checked) => 
                            updateTurnstile(turnstile.id, { qrReaderEnabled: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <Label>Leitor de Cartões</Label>
                        </div>
                        <Switch
                          checked={turnstile.cardReaderEnabled}
                          onCheckedChange={(checked) => 
                            updateTurnstile(turnstile.id, { cardReaderEnabled: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Funcionalidades</h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <Label>Integração Terminal</Label>
                        </div>
                        <Switch
                          checked={turnstile.terminalIntegration}
                          onCheckedChange={(checked) => 
                            updateTurnstile(turnstile.id, { terminalIntegration: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <Label>Permitir Check-in</Label>
                        </div>
                        <Switch
                          checked={turnstile.allowCheckIn}
                          onCheckedChange={(checked) => 
                            updateTurnstile(turnstile.id, { allowCheckIn: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => testTurnstileConnection(turnstile.id)}
                      disabled={testLoading}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </Button>
                    
                    <Button onClick={() => saveTurnstileConfig(turnstile)}>
                      Salvar Configuração
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integração com Sistema</CardTitle>
              <CardDescription>
                Status da integração com caixa e terminal de auto-atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Funcionalidades Ativas</h3>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Leitura QR Code</p>
                      <p className="text-sm text-muted-foreground">Validação de ingressos via QR</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Cartões Meia/Inteira</p>
                      <p className="text-sm text-muted-foreground">Leitura de cartões pré-configurados</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Integração Caixa</p>
                      <p className="text-sm text-muted-foreground">Conciliação automática</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Check-in Terminal</p>
                      <p className="text-sm text-muted-foreground">Validação de ingressos do terminal</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Modelo da Catraca</h3>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <DoorOpen className="h-6 w-6 text-primary" />
                      <div>
                        <h4 className="font-semibold">Topdata Fit</h4>
                        <p className="text-sm text-muted-foreground">Catraca com leitor QR Code</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Firmware:</span>
                        <span className="font-mono">3.2.1</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conexão:</span>
                        <span>TCP/IP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>QR Reader:</span>
                        <Badge variant="default" className="text-xs">Ativo</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Card Reader:</span>
                        <Badge variant="default" className="text-xs">Ativo</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {testResult && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Resultado do Último Teste</h3>
                  <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                    <div className="flex items-center space-x-2">
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {testResult.success ? 'Teste bem-sucedido' : 'Teste falhou'}
                      </span>
                    </div>
                    {testResult.error && (
                      <p className="text-sm text-red-600 mt-2">{testResult.error}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TurnstileManager;