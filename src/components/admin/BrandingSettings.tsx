import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Palette, Upload, Monitor } from 'lucide-react';

interface BrandingConfig {
  id?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  company_name: string;
  company_description: string;
  social_facebook?: string;
  social_instagram?: string;
  social_whatsapp?: string;
  email_footer: string;
  purchase_email_subject: string;
  purchase_email_template: string;
  welcome_email_subject: string;
  welcome_email_template: string;
}

export const BrandingSettings = () => {
  const [config, setConfig] = useState<BrandingConfig>({
    primary_color: '#DC2626',
    secondary_color: '#EAB308',
    company_name: 'Rua Iluminada',
    company_description: 'Sistema de vendas de ingressos',
    email_footer: 'Obrigado por escolher nossos eventos!',
    purchase_email_subject: 'Confirmação da sua compra - Rua Iluminada',
    purchase_email_template: `Olá {customer_name},

Obrigado pela sua compra! Seus ingressos estão prontos.

Detalhes da compra:
- Evento: {event_name}
- Data: {event_date}
- Horário: {event_time}
- Quantidade: {ticket_quantity}
- Total: {total_amount}

Seus ingressos estão em anexo com QR codes para entrada.

Atenciosamente,
Equipe Rua Iluminada`,
    welcome_email_subject: 'Bem-vindo à Rua Iluminada!',
    welcome_email_template: `Olá {customer_name},

Bem-vindo à Rua Iluminada!

Sua conta foi criada com sucesso. Agora você pode:
- Comprar ingressos online
- Acompanhar seus pedidos
- Receber promoções exclusivas

Para qualquer dúvida, entre em contato conosco.

Atenciosamente,
Equipe Rua Iluminada`
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBrandingConfig();
  }, []);

  const fetchBrandingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('branding_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Usar configurações padrão
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('branding_config')
        .upsert(config)
        .select()
        .single();

      if (error) throw error;

      setConfig(data);

      toast({
        title: "Sucesso",
        description: "Configurações de marca salvas com sucesso!"
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

  const applyCustomColors = () => {
    const root = document.documentElement;
    root.style.setProperty('--primary', config.primary_color);
    root.style.setProperty('--secondary', config.secondary_color);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Converter para base64 temporariamente
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setConfig({ ...config, logo_url: base64 });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao processar logo: " + error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Configurações de Marca</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identidade Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Identidade Visual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                {config.logo_url && (
                  <img src={config.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
                )}
                <div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-fit"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={config.primary_color}
                  onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={config.primary_color}
                  onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                  placeholder="#9333ea"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={config.secondary_color}
                  onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={config.secondary_color}
                  onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                  placeholder="#7c3aed"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                value={config.company_name}
                onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                placeholder="Rua Iluminada"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-description">Descrição</Label>
              <Textarea
                id="company-description"
                value={config.company_description}
                onChange={(e) => setConfig({ ...config, company_description: e.target.value })}
                placeholder="Descrição da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-footer">Rodapé dos E-mails</Label>
              <Textarea
                id="email-footer"
                value={config.email_footer}
                onChange={(e) => setConfig({ ...config, email_footer: e.target.value })}
                placeholder="Texto que aparece no rodapé dos e-mails"
              />
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais */}
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={config.social_facebook || ''}
                onChange={(e) => setConfig({ ...config, social_facebook: e.target.value })}
                placeholder="https://facebook.com/suapagina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={config.social_instagram || ''}
                onChange={(e) => setConfig({ ...config, social_instagram: e.target.value })}
                placeholder="https://instagram.com/suapagina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={config.social_whatsapp || ''}
                onChange={(e) => setConfig({ ...config, social_whatsapp: e.target.value })}
                placeholder="5511999999999"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Email */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personalização de E-mails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email de Compra */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">E-mail de Confirmação de Compra</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase-subject">Assunto do E-mail</Label>
                  <Input
                    id="purchase-subject"
                    value={config.purchase_email_subject}
                    onChange={(e) => setConfig({ ...config, purchase_email_subject: e.target.value })}
                    placeholder="Confirmação da sua compra - Rua Iluminada"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase-template">Modelo do E-mail</Label>
                  <Textarea
                    id="purchase-template"
                    value={config.purchase_email_template}
                    onChange={(e) => setConfig({ ...config, purchase_email_template: e.target.value })}
                    rows={8}
                    placeholder="Use {customer_name}, {event_name}, {event_date}, {event_time}, {ticket_quantity}, {total_amount} como variáveis"
                  />
                  <p className="text-xs text-muted-foreground">
                    Variáveis disponíveis: {'{customer_name}, {event_name}, {event_date}, {event_time}, {ticket_quantity}, {total_amount}'}
                  </p>
                </div>
              </div>
            </div>

            {/* Email de Boas-vindas */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">E-mail de Boas-vindas</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="welcome-subject">Assunto do E-mail</Label>
                  <Input
                    id="welcome-subject"
                    value={config.welcome_email_subject}
                    onChange={(e) => setConfig({ ...config, welcome_email_subject: e.target.value })}
                    placeholder="Bem-vindo à Rua Iluminada!"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcome-template">Modelo do E-mail</Label>
                  <Textarea
                    id="welcome-template"
                    value={config.welcome_email_template}
                    onChange={(e) => setConfig({ ...config, welcome_email_template: e.target.value })}
                    rows={8}
                    placeholder="Use {customer_name} como variável para personalizar"
                  />
                  <p className="text-xs text-muted-foreground">
                    Variáveis disponíveis: {'{customer_name}'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className="p-4 rounded-lg text-white"
                style={{ backgroundColor: config.primary_color }}
              >
                <h3 className="font-bold">{config.company_name}</h3>
                <p className="text-sm opacity-90">{config.company_description}</p>
              </div>
              
              <div 
                className="p-2 rounded text-white text-sm"
                style={{ backgroundColor: config.secondary_color }}
              >
                Cor secundária - botões e destaques
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};