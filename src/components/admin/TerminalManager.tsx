import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Play, Image, Settings, Ticket, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

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
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
    loadTerminalConfig();
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

      setTerminalConfig(prev => ({
        ...prev,
        background_url: publicUrl,
        background_type: file.type.startsWith('video/') ? 'video' : 'static'
      }));

      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="background">Plano de Fundo</TabsTrigger>
          <TabsTrigger value="tickets">Tipos de Ingresso</TabsTrigger>
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

              {terminalConfig.background_url && (
                <div className="space-y-2">
                  <Label>Preview do Arquivo Atual</Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
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
                  </div>
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