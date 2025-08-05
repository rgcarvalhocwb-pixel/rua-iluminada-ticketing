import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Facebook, Share2 } from 'lucide-react';

interface AnalyticsConfig {
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  google_tag_manager_id?: string;
  hotjar_id?: string;
  custom_scripts?: string;
  track_events: boolean;
  track_conversions: boolean;
  track_ecommerce: boolean;
}

export const AnalyticsIntegration = () => {
  const [config, setConfig] = useState<AnalyticsConfig>({
    track_events: true,
    track_conversions: true,
    track_ecommerce: true
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    // Carregar configuração do localStorage (em produção seria do banco)
    const saved = localStorage.getItem('analytics_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      // Salvar no localStorage (em produção seria no banco)
      localStorage.setItem('analytics_config', JSON.stringify(config));
      
      // Aplicar scripts
      await applyAnalyticsScripts();
      
      toast({
        title: "Sucesso",
        description: "Configurações de analytics salvas!"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyAnalyticsScripts = async () => {
    // Google Analytics
    if (config.google_analytics_id) {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${config.google_analytics_id}`;
      document.head.appendChild(gaScript);

      const gaConfig = document.createElement('script');
      gaConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.google_analytics_id}');
      `;
      document.head.appendChild(gaConfig);
    }

    // Facebook Pixel
    if (config.facebook_pixel_id) {
      const fbScript = document.createElement('script');
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${config.facebook_pixel_id}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);
    }

    // Scripts customizados
    if (config.custom_scripts) {
      const customScript = document.createElement('script');
      customScript.innerHTML = config.custom_scripts;
      document.head.appendChild(customScript);
    }
  };

  const trackEvent = (eventName: string, parameters?: any) => {
    if (!config.track_events) return;

    // Google Analytics
    if (config.google_analytics_id && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }

    // Facebook Pixel
    if (config.facebook_pixel_id && (window as any).fbq) {
      (window as any).fbq('track', eventName, parameters);
    }

    console.log('Event tracked:', eventName, parameters);
  };

  const trackPurchase = (orderData: any) => {
    if (!config.track_ecommerce) return;

    // Google Analytics Enhanced Ecommerce
    if ((window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: orderData.id,
        value: orderData.total_amount,
        currency: 'BRL',
        items: orderData.items?.map((item: any) => ({
          item_id: item.ticket_type_id,
          item_name: item.ticket_type_name,
          category: 'Ticket',
          quantity: item.quantity,
          price: item.unit_price
        }))
      });
    }

    // Facebook Pixel Purchase
    if ((window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        value: orderData.total_amount,
        currency: 'BRL',
        content_ids: orderData.items?.map((item: any) => item.ticket_type_id),
        content_type: 'product',
        num_items: orderData.items?.reduce((sum: number, item: any) => sum + item.quantity, 0)
      });
    }
  };

  const testTracking = () => {
    trackEvent('test_event', {
      test_parameter: 'test_value',
      timestamp: new Date().toISOString()
    });

    toast({
      title: "Teste enviado",
      description: "Evento de teste foi disparado. Verifique o console e suas ferramentas de analytics."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Integrações de Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Google Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ga-id">Google Analytics ID</Label>
              <Input
                id="ga-id"
                value={config.google_analytics_id || ''}
                onChange={(e) => setConfig({ ...config, google_analytics_id: e.target.value })}
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gtm-id">Google Tag Manager ID (opcional)</Label>
              <Input
                id="gtm-id"
                value={config.google_tag_manager_id || ''}
                onChange={(e) => setConfig({ ...config, google_tag_manager_id: e.target.value })}
                placeholder="GTM-XXXXXXX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Facebook Pixel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="w-5 h-5" />
              Facebook Pixel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
              <Input
                id="fb-pixel"
                value={config.facebook_pixel_id || ''}
                onChange={(e) => setConfig({ ...config, facebook_pixel_id: e.target.value })}
                placeholder="123456789012345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotjar-id">Hotjar ID (opcional)</Label>
              <Input
                id="hotjar-id"
                value={config.hotjar_id || ''}
                onChange={(e) => setConfig({ ...config, hotjar_id: e.target.value })}
                placeholder="1234567"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="track-events">Rastrear Eventos</Label>
                <p className="text-sm text-muted-foreground">
                  Cliques, visualizações, formulários
                </p>
              </div>
              <Switch
                id="track-events"
                checked={config.track_events}
                onCheckedChange={(checked) => setConfig({ ...config, track_events: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="track-conversions">Rastrear Conversões</Label>
                <p className="text-sm text-muted-foreground">
                  Cadastros, leads, contatos
                </p>
              </div>
              <Switch
                id="track-conversions"
                checked={config.track_conversions}
                onCheckedChange={(checked) => setConfig({ ...config, track_conversions: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="track-ecommerce">Rastrear E-commerce</Label>
                <p className="text-sm text-muted-foreground">
                  Vendas, produtos, carrinhos
                </p>
              </div>
              <Switch
                id="track-ecommerce"
                checked={config.track_ecommerce}
                onCheckedChange={(checked) => setConfig({ ...config, track_ecommerce: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scripts Customizados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Scripts Customizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-scripts">JavaScript Personalizado</Label>
              <Textarea
                id="custom-scripts"
                value={config.custom_scripts || ''}
                onChange={(e) => setConfig({ ...config, custom_scripts: e.target.value })}
                placeholder="// Seu código JavaScript personalizado aqui"
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                Adicione scripts personalizados, pixels de terceiros, etc.
              </p>
            </div>

            <Button onClick={testTracking} variant="outline" className="w-full">
              Testar Tracking
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Configurar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">Google Analytics:</h4>
              <p className="text-muted-foreground">
                1. Acesse analytics.google.com<br/>
                2. Crie uma propriedade GA4<br/>
                3. Copie o ID da medição (formato: G-XXXXXXXXXX)
              </p>
            </div>
            <div>
              <h4 className="font-medium">Facebook Pixel:</h4>
              <p className="text-muted-foreground">
                1. Acesse business.facebook.com<br/>
                2. Vá em Gerenciador de Eventos<br/>
                3. Crie um pixel e copie o ID
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};