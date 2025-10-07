import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  BarChart3, 
  Webhook, 
  Mail, 
  MessageSquare, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Copy,
  Key
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface IntegrationSetting {
  id: string;
  category: string;
  key: string;
  value: string | null;
  display_name: string;
  description: string | null;
  is_active: boolean;
  is_encrypted: boolean;
}

export const IntegrationHub = () => {
  const [settings, setSettings] = useState<IntegrationSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateSetting = async (id: string, newValue: string | boolean, field: 'value' | 'is_active' = 'value') => {
    try {
      const { error } = await supabase
        .from('integration_settings')
        .update({ [field]: newValue })
        .eq('id', id);

      if (error) throw error;

      setSettings(prev => prev.map(s => 
        s.id === id ? { ...s, [field]: newValue } : s
      ));

      toast({
        title: "✅ Salvo",
        description: "Configuração atualizada com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleVisibility = (key: string) => {
    setVisibleSecrets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const testConnection = async (category: string) => {
    setLoading(true);
    try {
      if (category === 'payment') {
        const email = settings.find(s => s.key === 'pagseguro_email')?.value;
        const token = settings.find(s => s.key === 'pagseguro_token')?.value;
        const env = settings.find(s => s.key === 'pagseguro_environment')?.value || 'sandbox';

        if (!email || !token) {
          throw new Error('Configure email e token do PagSeguro primeiro');
        }

        const apiUrl = env === 'production'
          ? 'https://ws.pagseguro.uol.com.br/v4/session'
          : 'https://ws.sandbox.pagseguro.uol.com.br/v4/session';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email })
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: Credenciais inválidas`);
        }

        toast({
          title: "✅ Conexão bem-sucedida",
          description: `Conectado ao PagSeguro (${env})`
        });
      } else if (category === 'webhook') {
        toast({
          title: "ℹ️ Webhook Configurado",
          description: "Secret configurado. Teste fazendo uma chamada ao endpoint."
        });
      } else {
        toast({
          title: "ℹ️ Configuração Salva",
          description: "As configurações foram salvas com sucesso."
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateWebhookSecret = async () => {
    const secret = crypto.randomUUID();
    const setting = settings.find(s => s.key === 'webhook_secret');
    if (setting) {
      await updateSetting(setting.id, secret);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copiado!",
      description: "Texto copiado para a área de transferência"
    });
  };

  const renderSettingInput = (setting: IntegrationSetting) => {
    const isVisible = visibleSecrets.has(setting.key);
    const inputType = setting.is_encrypted && !isVisible ? 'password' : 'text';

    if (setting.key.includes('enabled')) {
      return (
        <div className="flex items-center justify-between">
          <div>
            <Label>{setting.display_name}</Label>
            {setting.description && (
              <p className="text-sm text-muted-foreground">{setting.description}</p>
            )}
          </div>
          <Switch
            checked={setting.is_active}
            onCheckedChange={(checked) => updateSetting(setting.id, checked, 'is_active')}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={setting.key}>
          {setting.display_name}
          {setting.is_encrypted && <span className="ml-1 text-red-500">*</span>}
        </Label>
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={setting.key}
              type={inputType}
              value={setting.value || ''}
              onChange={(e) => {
                setSettings(prev => prev.map(s => 
                  s.id === setting.id ? { ...s, value: e.target.value } : s
                ));
              }}
              onBlur={(e) => updateSetting(setting.id, e.target.value)}
              placeholder={`Digite o ${setting.display_name.toLowerCase()}`}
              className="pr-10"
            />
            {setting.is_encrypted && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => toggleVisibility(setting.key)}
              >
                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
          </div>
          {setting.value && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(setting.value || '')}
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return <CreditCard className="w-5 h-5" />;
      case 'analytics': return <BarChart3 className="w-5 h-5" />;
      case 'webhook': return <Webhook className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      case 'sms': return <MessageSquare className="w-5 h-5" />;
      default: return <Key className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6" />
            Central de Integrações
          </h2>
          <p className="text-muted-foreground">
            Configure todas as chaves de API e integrações em um só lugar
          </p>
        </div>
        <Button onClick={loadSettings} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Recarregar
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          <strong>🔒 Segurança:</strong> Todas as chaves sensíveis (tokens, senhas) são marcadas com * e 
          ficam ocultas por padrão. Clique no ícone do olho para visualizar.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="payment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="webhook">Webhooks</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        {/* PAGAMENTOS */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon('payment')}
                Configurações de Pagamento
              </CardTitle>
              <CardDescription>
                Configure suas credenciais do PagSeguro para processar pagamentos online
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('payment').map(setting => (
                <div key={setting.id}>
                  {renderSettingInput(setting)}
                </div>
              ))}

              <div className="flex gap-2">
                <Button onClick={() => testConnection('payment')} disabled={loading} className="flex-1">
                  {loading ? 'Testando...' : 'Testar Conexão PagSeguro'}
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p><strong>Como obter suas credenciais:</strong></p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Acesse <a href="https://pagseguro.uol.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">pagseguro.uol.com.br</a></li>
                      <li>Vá em Preferências → Integrações</li>
                      <li>Gere um token de produção ou use o sandbox para testes</li>
                    </ol>
                    <p className="text-yellow-600 mt-2">
                      <strong>⚠️ Importante:</strong> Use sandbox para testes e production apenas quando estiver pronto.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon('analytics')}
                Ferramentas de Analytics
              </CardTitle>
              <CardDescription>
                Configure Google Analytics, Facebook Pixel e outras ferramentas de rastreamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('analytics').map(setting => (
                <div key={setting.id}>
                  {renderSettingInput(setting)}
                </div>
              ))}

              <Alert>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p><strong>Onde encontrar os IDs:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Google Analytics:</strong> analytics.google.com → Admin → Fluxos de dados → ID de medição (formato: G-XXXXXXXXXX)</li>
                      <li><strong>Facebook Pixel:</strong> business.facebook.com → Gerenciador de Eventos → Criar Pixel</li>
                      <li><strong>Google Tag Manager:</strong> tagmanager.google.com → Container ID (formato: GTM-XXXXXXX)</li>
                      <li><strong>Hotjar:</strong> hotjar.com → Site ID (número)</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WEBHOOKS */}
        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon('webhook')}
                Webhooks para Integrações Externas
              </CardTitle>
              <CardDescription>
                Configure webhooks para receber vendas de plataformas externas (Sympla, Eventbrite, etc)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input 
                    value="https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/external-sales-webhook" 
                    readOnly 
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/external-sales-webhook')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {getSettingsByCategory('webhook').map(setting => (
                <div key={setting.id}>
                  {renderSettingInput(setting)}
                </div>
              ))}

              <Button
                onClick={generateWebhookSecret}
                variant="outline"
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                Gerar Novo Secret
              </Button>

              <Alert>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p><strong>Como usar:</strong></p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Copie a URL do webhook acima</li>
                      <li>Gere um secret de segurança</li>
                      <li>Forneça ambos para os desenvolvedores da plataforma externa</li>
                      <li>Eles configurarão o sistema para enviar dados automaticamente</li>
                    </ol>
                    <p className="text-blue-600 mt-2">
                      <strong>ℹ️ Nota:</strong> O secret é usado para validar que as requisições são legítimas.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMAIL */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon('email')}
                Configurações de Email (SMTP)
              </CardTitle>
              <CardDescription>
                Configure servidor SMTP para envio automático de emails de confirmação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('email').map(setting => (
                <div key={setting.id}>
                  {renderSettingInput(setting)}
                </div>
              ))}

              <Alert>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p><strong>🚧 Em Desenvolvimento</strong></p>
                    <p>O envio de emails está em desenvolvimento. Configure as credenciais SMTP para quando a funcionalidade estiver pronta.</p>
                    <p className="text-muted-foreground mt-2">
                      Provedores recomendados: SendGrid, Mailgun, Amazon SES
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon('sms')}
                Configurações de SMS
              </CardTitle>
              <CardDescription>
                Configure Twilio ou outro provedor para envio de SMS de confirmação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSettingsByCategory('sms').map(setting => (
                <div key={setting.id}>
                  {renderSettingInput(setting)}
                </div>
              ))}

              <Alert>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p><strong>🚧 Em Desenvolvimento</strong></p>
                    <p>O envio de SMS está em desenvolvimento. Configure suas credenciais do Twilio para quando a funcionalidade estiver pronta.</p>
                    <p className="text-muted-foreground mt-2">
                      Você pode obter credenciais em: <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">twilio.com</a>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Status das Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span>PagSeguro</span>
              </div>
              {getSettingsByCategory('payment').some(s => s.value) ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> Configurado
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <X className="w-3 h-3" /> Pendente
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </div>
              {getSettingsByCategory('analytics').some(s => s.value) ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> Configurado
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <X className="w-3 h-3" /> Pendente
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                <span>Webhooks</span>
              </div>
              {getSettingsByCategory('webhook').some(s => s.key === 'webhook_secret' && s.value) ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> Configurado
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <X className="w-3 h-3" /> Pendente
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};