import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Save, ExternalLink } from 'lucide-react';

export const PaymentSettings = () => {
  const [settings, setSettings] = useState({
    pagseguroEmail: '',
    pagseguroToken: '',
    pagseguroEnvironment: 'sandbox'
  });
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          pagseguroEmail: data.pagseguro_email || '',
          pagseguroToken: data.pagseguro_token || '',
          pagseguroEnvironment: data.pagseguro_environment || 'sandbox'
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!settings.pagseguroEmail || !settings.pagseguroToken) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .upsert({
          pagseguro_email: settings.pagseguroEmail,
          pagseguro_token: settings.pagseguroToken,
          pagseguro_environment: settings.pagseguroEnvironment
        });

      if (error) throw error;
      
      toast({
        title: "Configurações salvas",
        description: "Configurações PagSeguro salvas com sucesso. Configure os secrets no Supabase para integração completa.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!settings.pagseguroEmail || !settings.pagseguroToken) {
      toast({
        title: "Erro",
        description: "Configure as credenciais antes de testar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Teste de demonstração",
        description: "Para integração real, configure os secrets no Supabase. A função retornará dados simulados.",
      });
    } catch (error: any) {
      toast({
        title: "Erro de conexão",
        description: "Verifique suas credenciais e tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          <strong>Modo Demonstração:</strong> A integração PagSeguro está configurada para retornar dados simulados. 
          Para produção, configure os secrets PAGSEGURO_EMAIL e PAGSEGURO_TOKEN no painel do Supabase.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Credenciais do PagSeguro</CardTitle>
          <CardDescription>
            Insira suas credenciais de produção ou sandbox do PagSeguro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail da Conta PagSeguro</Label>
            <Input
              id="email"
              type="email"
              value={settings.pagseguroEmail}
              onChange={(e) => setSettings({...settings, pagseguroEmail: e.target.value})}
              placeholder="seu-email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="token">Token de API</Label>
            <div className="relative">
              <Input
                id="token"
                type={showToken ? "text" : "password"}
                value={settings.pagseguroToken}
                onChange={(e) => setSettings({...settings, pagseguroToken: e.target.value})}
                placeholder="Seu token de API do PagSeguro"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="environment">Ambiente</Label>
            <select
              id="environment"
              value={settings.pagseguroEnvironment}
              onChange={(e) => setSettings({...settings, pagseguroEnvironment: e.target.value})}
              className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
            >
              <option value="sandbox">Sandbox (Teste)</option>
              <option value="production">Produção</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button 
              onClick={testConnection} 
              disabled={loading} 
              variant="outline"
              className="flex-1"
            >
              {loading ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como obter suas credenciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">1. Acesse sua conta PagSeguro</div>
              <div className="text-sm text-muted-foreground">
                Entre na sua conta do PagSeguro ou UOL
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://pagseguro.uol.com.br/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Acessar
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">2. Vá para Preferências &gt; Integrações</div>
              <div className="text-sm text-muted-foreground">
                Encontre a seção de integrações e tokens de API
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">3. Gere seu Token de Produção</div>
              <div className="text-sm text-muted-foreground">
                Crie um token para integração com sua aplicação
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Importante:</strong> Use o ambiente Sandbox para testes e Produção apenas quando 
              estiver pronto para receber pagamentos reais. Mantenha suas credenciais seguras e 
              nunca as compartilhe.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};