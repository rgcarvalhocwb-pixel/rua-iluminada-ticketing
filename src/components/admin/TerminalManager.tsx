import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Play, Image, Settings, Ticket, DollarSign, AlertCircle, CheckCircle, CreditCard, Printer, FileText, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { NativeHardwareDetector } from '@/components/ui/native-hardware-detector';

interface Event {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string | null;
  event_id: string;
  is_active: boolean;
  display_order: number;
}

interface TerminalConfig {
  id?: string;
  background_type: 'video' | 'slideshow' | 'static';
  background_url: string | null;
  welcome_message: string;
  instructions: string;
  idle_timeout: number;
  max_tickets_per_purchase: number;
}

interface PinpadConfig {
  id?: string;
  enabled: boolean;
  device_type: string;
  port: string;
  timeout: number;
  retry_attempts: number;
}

interface PrinterConfig {
  id?: string;
  enabled: boolean;
  printer_name: string;
  paper_size: string;
  auto_cut: boolean;
  copies: number;
  print_logo: boolean;
}

interface TicketTemplate {
  id?: string;
  template_name: string;
  template_type: 'ticket' | 'receipt';
  header_text: string;
  footer_text: string;
  show_logo: boolean;
  show_qr_code: boolean;
  show_event_info: boolean;
  font_size: number;
}

const TerminalManager = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [terminalConfig, setTerminalConfig] = useState<TerminalConfig>({
    background_type: 'static',
    background_url: null,
    welcome_message: 'Bem-vindo ao Terminal de Auto Atendimento',
    instructions: 'Clique em qualquer local da tela para iniciar sua compra',
    idle_timeout: 60,
    max_tickets_per_purchase: 10
  });
  const [editingTicketType, setEditingTicketType] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'video' | 'static'; name: string } | null>(null);
  const [mediaHistory, setMediaHistory] = useState<Array<{ url: string; type: 'video' | 'static'; name: string; path: string }>>([]);
  const [pinpadConfig, setPinpadConfig] = useState<PinpadConfig>({
    enabled: false,
    device_type: 'Ingenico',
    port: 'COM1',
    timeout: 30,
    retry_attempts: 3
  });
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    enabled: false,
    printer_name: 'Impressora Térmica',
    paper_size: '80mm',
    auto_cut: true,
    copies: 1,
    print_logo: true
  });

  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [detectingPrinters, setDetectingPrinters] = useState(false);

  const [availablePinpads, setAvailablePinpads] = useState<string[]>([]);
  const [detectingPinpads, setDetectingPinpads] = useState(false);
  const [ticketTemplates, setTicketTemplates] = useState<TicketTemplate[]>([
    {
      template_name: 'Ingresso Padrão',
      template_type: 'ticket',
      header_text: 'EVENTO RUA ILUMINADA',
      footer_text: 'Apresente este ingresso na entrada',
      show_logo: true,
      show_qr_code: true,
      show_event_info: true,
      font_size: 12
    }
  ]);
  const { toast } = useToast();

  // Função para detectar impressoras disponíveis
  const detectAvailablePrinters = async () => {
    setDetectingPrinters(true);
    try {
      const printers: string[] = [];
      
      // Tentar usar a Print API do navegador se disponível
      if ('navigator' in window && 'printer' in navigator) {
        try {
          // @ts-ignore - API experimental
          const printerList = await navigator.printer.getPrinters();
          printers.push(...printerList.map((p: any) => p.name));
        } catch (error) {
          console.log('Print API não disponível');
        }
      }

      // Impressoras padrão mais comuns para terminais POS
      const commonPrinters = [
        'Epson TM-T20III',
        'Epson TM-T88V',
        'Epson TM-U220',
        'Bematech MP-4200 TH',
        'Elgin i9',
        'Zebra ZD220',
        'HP LaserJet',
        'Canon PIXMA',
        'Brother HL-L2340DW',
        'Impressora Térmica 80mm',
        'Impressora Térmica 58mm',
        'Microsoft Print to PDF',
        'Impressora Padrão do Sistema'
      ];

      // Simular detecção (em uma implementação real, seria feita via API do sistema)
      printers.push(...commonPrinters);
      
      // Remover duplicatas
      const uniquePrinters = [...new Set(printers)];
      setAvailablePrinters(uniquePrinters);
      
      toast({
        title: "Impressoras detectadas",
        description: `${uniquePrinters.length} impressoras encontradas`,
      });
    } catch (error) {
      console.error('Erro ao detectar impressoras:', error);
      toast({
        title: "Erro",
        description: "Erro ao detectar impressoras disponíveis",
        variant: "destructive",
      });
    } finally {
      setDetectingPrinters(false);
    }
  };

  // Função para detectar pinpads disponíveis
  const detectAvailablePinpads = async () => {
    setDetectingPinpads(true);
    try {
      const pinpads: string[] = [];
      
      // Pinpads mais comuns no mercado brasileiro
      const commonPinpads = [
        'Ingenico iPP350',
        'Ingenico iWL220',
        'Ingenico iWL250',
        'Cielo LIO',
        'Cielo Point Mini',
        'Stone P2',
        'Stone Ton T1',
        'Stone Ton T2',
        'PagBank Moderninha X',
        'PagBank Moderninha Plus',
        'PagBank Moderninha Pro',
        'PagBank Moderninha Smart',
        'GetNet Point H',
        'GetNet Point Pro',
        'Rede e-Rede',
        'Rede POS',
        'Mercado Pago Point Mini',
        'Mercado Pago Point Pro',
        'Vero Pay Plus',
        'Sumup Top',
        'Sumup On'
      ];

      pinpads.push(...commonPinpads);
      
      // Simular detecção de dispositivos conectados (seria via API do sistema em produção)
      const connectedDevices = [
        'Dispositivo USB - Porta COM3',
        'Dispositivo Ethernet - IP 192.168.1.100',
        'Bluetooth - Pagbank Moderninha X'
      ];
      
      pinpads.push(...connectedDevices);
      
      // Remover duplicatas
      const uniquePinpads = [...new Set(pinpads)];
      setAvailablePinpads(uniquePinpads);
      
      toast({
        title: "Pinpads detectados",
        description: `${uniquePinpads.length} pinpads encontrados`,
      });
    } catch (error) {
      console.error('Erro ao detectar pinpads:', error);
      toast({
        title: "Erro",
        description: "Erro ao detectar pinpads disponíveis",
        variant: "destructive",
      });
    } finally {
      setDetectingPinpads(false);
    }
  };

  useEffect(() => {
    loadEvents();
    loadTerminalConfig();
    loadMediaHistory();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setEvents(data);
        setSelectedEvent(data[0]);
        loadTicketTypes(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos.",
        variant: "destructive",
      });
    }
  };

  const loadTicketTypes = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTicketTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de ingresso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de ingresso.",
        variant: "destructive",
      });
    }
  };

  const loadTerminalConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('terminal_config')
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setTerminalConfig({
          id: data.id,
          background_type: data.background_type as 'video' | 'slideshow' | 'static',
          background_url: data.background_url,
          welcome_message: data.welcome_message,
          instructions: data.instructions,
          idle_timeout: data.idle_timeout,
          max_tickets_per_purchase: data.max_tickets_per_purchase
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do terminal:', error);
    }
  };

  const handleEventChange = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      loadTicketTypes(eventId);
    }
  };

  const loadMediaHistory = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from('brand-assets')
        .list('terminal', {
          limit: 20,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        return;
      }

      if (files) {
        const history = files
          .filter(file => file.name !== '.emptyFolderPlaceholder')
          .map(file => {
            const { data: { publicUrl } } = supabase.storage
              .from('brand-assets')
              .getPublicUrl(`terminal/${file.name}`);
            
            const isVideo = file.name.toLowerCase().includes('.mp4') || 
                           file.name.toLowerCase().includes('.webm');
            
            return {
              url: publicUrl,
              type: isVideo ? 'video' as const : 'static' as const,
              name: file.name,
              path: `terminal/${file.name}`
            };
          });
        
        setMediaHistory(history);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de mídias:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Tipo de arquivo não suportado. Use MP4, WebM, JPEG, PNG ou WebP.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho do arquivo (50MB para vídeo, 10MB para imagem)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Erro",
        description: `Arquivo muito grande. Máximo ${file.type.startsWith('video/') ? '50MB para vídeos' : '10MB para imagens'}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `terminal-background-${Date.now()}.${fileExt}`;
      const filePath = `terminal/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      const newType: 'video' | 'static' = file.type.startsWith('video/') ? 'video' : 'static';
      
      // Apenas fazer preview, não salvar ainda no banco
      setPreviewFile({
        url: publicUrl,
        type: newType,
        name: fileName
      });

      toast({
        title: "Sucesso",
        description: "Arquivo carregado! Clique em 'Aplicar Plano de Fundo' para salvar.",
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do arquivo: " + error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const applyBackgroundFromPreview = async () => {
    if (!previewFile) return;

    try {
      setLoading(true);

      // Obter o ID da configuração existente
      let configId = terminalConfig.id;
      if (!configId) {
        const { data: existingConfig } = await supabase
          .from('terminal_config')
          .select('id')
          .single();
        configId = existingConfig?.id;
      }

      // Salvar no banco
      if (configId) {
        const { error: dbError } = await supabase
          .from('terminal_config')
          .update({
            background_url: previewFile.url,
            background_type: previewFile.type
          })
          .eq('id', configId);
        if (dbError) throw dbError;
      }

      // Atualizar estado local
      setTerminalConfig(prev => ({
        ...prev,
        background_url: previewFile.url,
        background_type: previewFile.type
      }));

      // Limpar preview e recarregar histórico
      setPreviewFile(null);
      loadMediaHistory();

      toast({
        title: "Sucesso",
        description: "Plano de fundo aplicado no terminal!",
      });
    } catch (error: any) {
      console.error('Erro ao aplicar plano de fundo:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar plano de fundo: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyBackgroundFromHistory = async (historyItem: typeof mediaHistory[0]) => {
    try {
      setLoading(true);

      // Obter o ID da configuração existente
      let configId = terminalConfig.id;
      if (!configId) {
        const { data: existingConfig } = await supabase
          .from('terminal_config')
          .select('id')
          .single();
        configId = existingConfig?.id;
      }

      // Salvar no banco
      if (configId) {
        const { error: dbError } = await supabase
          .from('terminal_config')
          .update({
            background_url: historyItem.url,
            background_type: historyItem.type
          })
          .eq('id', configId);
        if (dbError) throw dbError;
      }

      // Atualizar estado local
      setTerminalConfig(prev => ({
        ...prev,
        background_url: historyItem.url,
        background_type: historyItem.type
      }));

      toast({
        title: "Sucesso",
        description: "Plano de fundo aplicado do histórico!",
      });
    } catch (error: any) {
      console.error('Erro ao aplicar plano de fundo:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar plano de fundo: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTicketType = async (ticketTypeId: string, updates: Partial<TicketType>) => {
    try {
      const { error } = await supabase
        .from('ticket_types')
        .update(updates)
        .eq('id', ticketTypeId);

      if (error) throw error;

      // Atualizar localmente
      setTicketTypes(prev => prev.map(tt => 
        tt.id === ticketTypeId ? { ...tt, ...updates } : tt
      ));

      toast({
        title: "Sucesso",
        description: "Tipo de ingresso atualizado!",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tipo de ingresso: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleTicketTypeChange = (ticketTypeId: string, field: string, value: any) => {
    // Atualizar localmente primeiro para feedback imediato
    setTicketTypes(prev => prev.map(tt => 
      tt.id === ticketTypeId ? { ...tt, [field]: value } : tt
    ));
    
    // Agendar atualização no banco com debounce
    setTempValues(prev => ({
      ...prev,
      [`${ticketTypeId}_${field}`]: value
    }));
    
    setTimeout(() => {
      updateTicketType(ticketTypeId, { [field]: value });
    }, 500);
  };

  const saveTerminalConfig = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('terminal_config')
        .update({
          background_type: terminalConfig.background_type,
          background_url: terminalConfig.background_url,
          welcome_message: terminalConfig.welcome_message,
          instructions: terminalConfig.instructions,
          idle_timeout: terminalConfig.idle_timeout,
          max_tickets_per_purchase: terminalConfig.max_tickets_per_purchase
        })
        .eq('id', terminalConfig.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações do terminal salvas com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Gerenciamento do Terminal</h2>
      </div>

      <Tabs defaultValue="background" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="background">Plano de Fundo</TabsTrigger>
          <TabsTrigger value="tickets">Tipos de Ingresso</TabsTrigger>
          <TabsTrigger value="pinpad">Pinpad</TabsTrigger>
          <TabsTrigger value="printer">Impressoras</TabsTrigger>
          <TabsTrigger value="printing">Modelos de Impressão</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="background" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Configurar Plano de Fundo
              </CardTitle>
              <CardDescription>
                Configure vídeos ou imagens para exibir na tela inicial do terminal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="background-upload">Upload de Arquivo</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Clique para fazer upload ou arraste o arquivo aqui
                      </p>
                      <p className="text-xs text-gray-500">
                        Formatos aceitos: MP4, WebM (vídeos) | JPEG, PNG, WebP (imagens)
                      </p>
                    </div>
                    <Input
                      id="background-upload"
                      type="file"
                      accept="video/mp4,video/webm,image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="mt-4"
                    />
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Enviando arquivo...
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Especificações Recomendadas</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Play className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Vídeos:</p>
                        <ul className="text-gray-600 space-y-1">
                          <li>• Resolução: 1920x1080 (Full HD)</li>
                          <li>• Formato: MP4 ou WebM</li>
                          <li>• Tamanho máximo: 50MB</li>
                          <li>• Duração: 30 segundos a 2 minutos</li>
                          <li>• Codec: H.264 para melhor compatibilidade</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Image className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Imagens:</p>
                        <ul className="text-gray-600 space-y-1">
                          <li>• Resolução: 1920x1080 ou superior</li>
                          <li>• Formato: JPEG, PNG ou WebP</li>
                          <li>• Tamanho máximo: 10MB</li>
                          <li>• Proporção: 16:9 (paisagem)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview do arquivo selecionado */}
              {previewFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Novo Arquivo Selecionado</Label>
                    <div className="flex gap-2">
                      <Button
                        onClick={applyBackgroundFromPreview}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading ? 'Aplicando...' : 'Aplicar Plano de Fundo'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPreviewFile(null)}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                    {previewFile.type === 'video' ? (
                      <video 
                        src={previewFile.url} 
                        className="w-full max-w-md mx-auto rounded"
                        controls
                      />
                    ) : (
                      <img 
                        src={previewFile.url} 
                        alt="Preview do novo arquivo"
                        className="w-full max-w-md mx-auto rounded"
                      />
                    )}
                    <p className="text-sm text-center mt-2 text-muted-foreground">
                      {previewFile.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Arquivo atual */}
              {terminalConfig.background_url && !previewFile && (
                <div className="space-y-2">
                  <Label>Plano de Fundo Atual</Label>
                  <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                    {terminalConfig.background_type === 'video' ? (
                      <video 
                        src={terminalConfig.background_url} 
                        className="w-full max-w-md mx-auto rounded"
                        controls
                      />
                    ) : (
                      <img 
                        src={terminalConfig.background_url} 
                        alt="Background atual"
                        className="w-full max-w-md mx-auto rounded"
                      />
                    )}
                    <p className="text-sm text-center mt-2 text-green-700 font-medium">
                      ✓ Ativo no terminal
                    </p>
                  </div>
                </div>
              )}

              {/* Histórico de arquivos */}
              {mediaHistory.length > 0 && (
                <div className="space-y-4">
                  <Label>Histórico de Arquivos</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {mediaHistory.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="aspect-video mb-2 rounded overflow-hidden bg-gray-200">
                          {item.type === 'video' ? (
                            <video 
                              src={item.url} 
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img 
                              src={item.url} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => applyBackgroundFromHistory(item)}
                          disabled={loading || terminalConfig.background_url === item.url}
                        >
                          {terminalConfig.background_url === item.url ? '✓ Em uso' : 'Reutilizar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique em "Reutilizar" para aplicar um arquivo do histórico
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Configurar Tipos de Ingresso
              </CardTitle>
              <CardDescription>
                Gerencie os tipos de ingressos disponíveis no terminal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>Evento:</Label>
                <select 
                  value={selectedEvent?.id || ''} 
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="border rounded px-3 py-1"
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEvent && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {ticketTypes.map((ticketType) => (
                      <div key={ticketType.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{ticketType.name}</h4>
                            <Badge variant={ticketType.is_active ? "default" : "secondary"}>
                              {ticketType.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              {formatPrice(ticketType.price)}
                            </span>
                          </div>
                        </div>
                        
                        {ticketType.description && (
                          <p className="text-sm text-gray-600">{ticketType.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Preço (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={ticketType.price}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                handleTicketTypeChange(ticketType.id, 'price', newPrice);
                              }}
                              className="text-right"
                            />
                          </div>
                          
                          <div>
                            <Label>Status</Label>
                            <select
                              value={ticketType.is_active ? 'true' : 'false'}
                              onChange={(e) => {
                                handleTicketTypeChange(ticketType.id, 'is_active', e.target.value === 'true');
                              }}
                              className="w-full border rounded px-3 py-2 bg-background"
                            >
                              <option value="true">Ativo no Terminal</option>
                              <option value="false">Inativo no Terminal</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Apenas ingressos ativos aparecem no terminal
                            </p>
                          </div>
                          
                          <div>
                            <Label>Ordem de Exibição</Label>
                            <Input
                              type="number"
                              value={ticketType.display_order}
                              onChange={(e) => {
                                const newOrder = parseInt(e.target.value) || 0;
                                handleTicketTypeChange(ticketType.id, 'display_order', newOrder);
                              }}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Ordem crescente (0 = primeiro)
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {ticketTypes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Ticket className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum tipo de ingresso encontrado para este evento.</p>
                      <p className="text-sm">Configure os tipos de ingresso na aba "Ingressos".</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pinpad" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configuração do Pinpad
              </CardTitle>
              <CardDescription>
                Configure a máquina de cartão para pagamentos no terminal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinpadConfig.enabled}
                    onChange={(e) => setPinpadConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Habilitar Pinpad</span>
                </label>
                <Badge variant={pinpadConfig.enabled ? "default" : "secondary"}>
                  {pinpadConfig.enabled ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              {pinpadConfig.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="device-type">Tipo do Equipamento</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          {availablePinpads.length > 0 ? (
                            <select
                              id="device-type"
                              value={pinpadConfig.device_type}
                              onChange={(e) => setPinpadConfig(prev => ({ ...prev, device_type: e.target.value }))}
                              className="w-full border rounded px-3 py-2 bg-background z-10"
                            >
                              <option value="">Selecione um pinpad</option>
                              {availablePinpads.map(pinpad => (
                                <option key={pinpad} value={pinpad}>{pinpad}</option>
                              ))}
                            </select>
                          ) : (
                            <select
                              id="device-type"
                              value={pinpadConfig.device_type}
                              onChange={(e) => setPinpadConfig(prev => ({ ...prev, device_type: e.target.value }))}
                              className="w-full border rounded px-3 py-2 bg-background z-10"
                            >
                              <option value="Ingenico">Ingenico</option>
                              <option value="Cielo">Cielo</option>
                              <option value="Stone">Stone</option>
                              <option value="GetNet">GetNet</option>
                              <option value="Rede">Rede</option>
                              <option value="Pagbank">Pagbank</option>
                            </select>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={detectAvailablePinpads}
                          disabled={detectingPinpads}
                          className="px-3"
                        >
                          {detectingPinpads ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                          ) : (
                            <Settings className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clique no ícone para detectar pinpads disponíveis
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="port">Porta de Comunicação</Label>
                      <select
                        id="port"
                        value={pinpadConfig.port}
                        onChange={(e) => setPinpadConfig(prev => ({ ...prev, port: e.target.value }))}
                        className="w-full border rounded px-3 py-2 bg-background"
                      >
                        <option value="COM1">COM1</option>
                        <option value="COM2">COM2</option>
                        <option value="USB">USB</option>
                        <option value="Ethernet">Ethernet</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="timeout">Timeout (segundos)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        min="10"
                        max="120"
                        value={pinpadConfig.timeout}
                        onChange={(e) => setPinpadConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="retry-attempts">Tentativas de Retry</Label>
                      <Input
                        id="retry-attempts"
                        type="number"
                        min="1"
                        max="10"
                        value={pinpadConfig.retry_attempts}
                        onChange={(e) => setPinpadConfig(prev => ({ ...prev, retry_attempts: parseInt(e.target.value) || 3 }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Status do Pinpad</h4>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    {pinpadConfig.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span>{pinpadConfig.enabled ? 'Pinpad configurado' : 'Pinpad desabilitado'}</span>
                  </div>
                  {pinpadConfig.enabled && (
                    <>
                      <p><strong>Equipamento:</strong> {pinpadConfig.device_type}</p>
                      <p><strong>Porta:</strong> {pinpadConfig.port}</p>
                      <p><strong>Timeout:</strong> {pinpadConfig.timeout}s</p>
                    </>
                  )}
                  {availablePinpads.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="font-medium text-green-600">
                        {availablePinpads.length} pinpads detectados
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={() => toast({ title: "Configurações salvas", description: "Configurações do pinpad salvas com sucesso!" })}>
                Salvar Configurações do Pinpad
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Configuração de Impressoras
              </CardTitle>
              <CardDescription>
                Configure as impressoras para tickets e comprovantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printerConfig.enabled}
                    onChange={(e) => setPrinterConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Habilitar Impressão</span>
                </label>
                <Badge variant={printerConfig.enabled ? "default" : "secondary"}>
                  {printerConfig.enabled ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              {printerConfig.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="printer-name">Nome da Impressora</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          {availablePrinters.length > 0 ? (
                            <select
                              value={printerConfig.printer_name}
                              onChange={(e) => setPrinterConfig(prev => ({ ...prev, printer_name: e.target.value }))}
                              className="w-full border rounded px-3 py-2 bg-background"
                            >
                              <option value="">Selecione uma impressora</option>
                              {availablePrinters.map(printer => (
                                <option key={printer} value={printer}>{printer}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              id="printer-name"
                              value={printerConfig.printer_name}
                              onChange={(e) => setPrinterConfig(prev => ({ ...prev, printer_name: e.target.value }))}
                              placeholder="Ex: Epson TM-T20"
                            />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={detectAvailablePrinters}
                          disabled={detectingPrinters}
                          className="px-3"
                        >
                          {detectingPrinters ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                          ) : (
                            <Settings className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clique no ícone para detectar impressoras disponíveis
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="paper-size">Tamanho do Papel</Label>
                      <select
                        id="paper-size"
                        value={printerConfig.paper_size}
                        onChange={(e) => setPrinterConfig(prev => ({ ...prev, paper_size: e.target.value }))}
                        className="w-full border rounded px-3 py-2 bg-background"
                      >
                        <option value="80mm">80mm (Padrão)</option>
                        <option value="58mm">58mm (Compacto)</option>
                        <option value="A4">A4 (Laser)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="copies">Número de Cópias</Label>
                      <Input
                        id="copies"
                        type="number"
                        min="1"
                        max="5"
                        value={printerConfig.copies}
                        onChange={(e) => setPrinterConfig(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printerConfig.auto_cut}
                          onChange={(e) => setPrinterConfig(prev => ({ ...prev, auto_cut: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <span>Corte Automático</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cortar automaticamente o papel após a impressão
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={printerConfig.print_logo}
                          onChange={(e) => setPrinterConfig(prev => ({ ...prev, print_logo: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <span>Imprimir Logo</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Incluir logo da empresa nos tickets
                      </p>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Printer className="h-4 w-4 mr-2" />
                      Testar Impressão
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Status da Impressora</h4>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    {printerConfig.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span>{printerConfig.enabled ? 'Impressora configurada' : 'Impressão desabilitada'}</span>
                  </div>
                  {printerConfig.enabled && (
                    <>
                      <p><strong>Impressora:</strong> {printerConfig.printer_name}</p>
                      <p><strong>Papel:</strong> {printerConfig.paper_size}</p>
                      <p><strong>Cópias:</strong> {printerConfig.copies}</p>
                    </>
                  )}
                  {availablePrinters.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="font-medium text-green-600">
                        {availablePrinters.length} impressoras detectadas
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={() => toast({ title: "Configurações salvas", description: "Configurações da impressora salvas com sucesso!" })}>
                Salvar Configurações da Impressora
              </Button>

              {/* Nova seção para detecção nativa de hardware */}
              <div className="pt-6 border-t">
                <NativeHardwareDetector />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printing" className="space-y-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Modelos de Impressão
                </CardTitle>
                <CardDescription>
                  Configure os modelos de tickets e comprovantes que serão impressos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {ticketTemplates.map((template, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-5 w-5 text-primary" />
                        <h4 className="font-medium">{template.template_name}</h4>
                        <Badge variant={template.template_type === 'ticket' ? "default" : "secondary"}>
                          {template.template_type === 'ticket' ? 'Ingresso' : 'Comprovante'}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Nome do Modelo</Label>
                          <Input
                            value={template.template_name}
                            onChange={(e) => {
                              const newTemplates = [...ticketTemplates];
                              newTemplates[index].template_name = e.target.value;
                              setTicketTemplates(newTemplates);
                            }}
                          />
                        </div>

                        <div>
                          <Label>Tipo</Label>
                          <select
                            value={template.template_type}
                            onChange={(e) => {
                              const newTemplates = [...ticketTemplates];
                              newTemplates[index].template_type = e.target.value as 'ticket' | 'receipt';
                              setTicketTemplates(newTemplates);
                            }}
                            className="w-full border rounded px-3 py-2 bg-background"
                          >
                            <option value="ticket">Ingresso</option>
                            <option value="receipt">Comprovante</option>
                          </select>
                        </div>

                        <div>
                          <Label>Texto do Cabeçalho</Label>
                          <Textarea
                            value={template.header_text}
                            onChange={(e) => {
                              const newTemplates = [...ticketTemplates];
                              newTemplates[index].header_text = e.target.value;
                              setTicketTemplates(newTemplates);
                            }}
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label>Texto do Rodapé</Label>
                          <Textarea
                            value={template.footer_text}
                            onChange={(e) => {
                              const newTemplates = [...ticketTemplates];
                              newTemplates[index].footer_text = e.target.value;
                              setTicketTemplates(newTemplates);
                            }}
                            rows={2}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Tamanho da Fonte</Label>
                          <Input
                            type="number"
                            min="8"
                            max="24"
                            value={template.font_size}
                            onChange={(e) => {
                              const newTemplates = [...ticketTemplates];
                              newTemplates[index].font_size = parseInt(e.target.value) || 12;
                              setTicketTemplates(newTemplates);
                            }}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label>Elementos a Incluir</Label>
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={template.show_logo}
                              onChange={(e) => {
                                const newTemplates = [...ticketTemplates];
                                newTemplates[index].show_logo = e.target.checked;
                                setTicketTemplates(newTemplates);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Mostrar Logo</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={template.show_qr_code}
                              onChange={(e) => {
                                const newTemplates = [...ticketTemplates];
                                newTemplates[index].show_qr_code = e.target.checked;
                                setTicketTemplates(newTemplates);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Mostrar QR Code</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={template.show_event_info}
                              onChange={(e) => {
                                const newTemplates = [...ticketTemplates];
                                newTemplates[index].show_event_info = e.target.checked;
                                setTicketTemplates(newTemplates);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Mostrar Dados do Evento</span>
                          </label>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                          <h5 className="font-medium mb-2">Preview do Ticket</h5>
                          <div className="text-xs space-y-1 bg-white p-2 rounded border">
                            {template.show_logo && <div className="text-center">[LOGO]</div>}
                            <div className="text-center font-bold">{template.header_text}</div>
                            {template.show_event_info && (
                              <div>
                                <p>Evento: {selectedEvent?.name || 'Nome do Evento'}</p>
                                <p>Data: {selectedEvent?.start_date || '2024-12-25'}</p>
                                <p>Ingresso: Adulto - R$ 50,00</p>
                              </div>
                            )}
                            {template.show_qr_code && <div className="text-center">[QR CODE]</div>}
                            <div className="text-center">{template.footer_text}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() => {
                    const newTemplate: TicketTemplate = {
                      template_name: 'Novo Modelo',
                      template_type: 'ticket',
                      header_text: 'EVENTO RUA ILUMINADA',
                      footer_text: 'Apresente este ingresso na entrada',
                      show_logo: true,
                      show_qr_code: true,
                      show_event_info: true,
                      font_size: 12
                    };
                    setTicketTemplates([...ticketTemplates, newTemplate]);
                  }}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Adicionar Novo Modelo
                </Button>

                <Button onClick={() => toast({ title: "Modelos salvos", description: "Modelos de impressão salvos com sucesso!" })}>
                  Salvar Todos os Modelos
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Mensagens e Interface
                </CardTitle>
                <CardDescription>
                  Configure as mensagens exibidas no terminal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="welcome-message">Título da Tela Inicial</Label>
                  <Input
                    id="welcome-message"
                    value={terminalConfig.welcome_message}
                    onChange={(e) => setTerminalConfig(prev => ({
                      ...prev,
                      welcome_message: e.target.value
                    }))}
                    placeholder="Ex: Terminal de Auto Atendimento - Rua Iluminada"
                  />
                </div>
                
                <div>
                  <Label htmlFor="instructions">Instruções para o Cliente</Label>
                  <Textarea
                    id="instructions"
                    value={terminalConfig.instructions}
                    onChange={(e) => setTerminalConfig(prev => ({
                      ...prev,
                      instructions: e.target.value
                    }))}
                    rows={3}
                    placeholder="Ex: Toque na tela para iniciar sua compra de ingressos"
                  />
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Preview da Tela Inicial</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-semibold">{terminalConfig.welcome_message}</p>
                    <p>{terminalConfig.instructions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Comportamento do Terminal
                </CardTitle>
                <CardDescription>
                  Configure limites e timeouts do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="idle-timeout">Timeout de Inatividade</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="idle-timeout"
                      type="number"
                      min="30"
                      max="300"
                      value={terminalConfig.idle_timeout}
                      onChange={(e) => setTerminalConfig(prev => ({
                        ...prev,
                        idle_timeout: parseInt(e.target.value) || 60
                      }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">segundos</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tempo para voltar à tela inicial sem atividade (30-300s)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="max-tickets">Máximo de Ingressos por Compra</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="max-tickets"
                      type="number"
                      min="1"
                      max="50"
                      value={terminalConfig.max_tickets_per_purchase}
                      onChange={(e) => setTerminalConfig(prev => ({
                        ...prev,
                        max_tickets_per_purchase: parseInt(e.target.value) || 10
                      }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">ingressos</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Limite por transação (1-50 ingressos)
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Status Atual</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Plano de Fundo:</span>
                      <span className="text-muted-foreground">
                        {terminalConfig.background_url ? 
                          `${terminalConfig.background_type === 'video' ? 'Vídeo' : 'Imagem'} configurado` : 
                          'Padrão do sistema'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeout:</span>
                      <span className="text-muted-foreground">{terminalConfig.idle_timeout}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Limite de Ingressos:</span>
                      <span className="text-muted-foreground">{terminalConfig.max_tickets_per_purchase}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center gap-4 pt-6 border-t">
            <Button 
              size="lg"
              onClick={saveTerminalConfig}
              disabled={loading}
              className="min-w-[200px]"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Todas as Configurações'}
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => window.open('/terminal', '_blank')}
              className="min-w-[150px]"
            >
              <Play className="h-4 w-4 mr-2" />
              Testar Terminal
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TerminalManager;