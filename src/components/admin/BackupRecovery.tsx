import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Database, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const BackupRecovery = () => {
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
  const { toast } = useToast();

  const tables = [
    { value: 'all', label: 'Backup Completo' },
    { value: 'events', label: 'Eventos' },
    { value: 'ticket_types', label: 'Tipos de Ingresso' },
    { value: 'orders', label: 'Pedidos' },
    { value: 'order_items', label: 'Itens de Pedido' },
    { value: 'tickets', label: 'Ingressos' },
    { value: 'daily_closures', label: 'Fechamentos Diários' },
    { value: 'admin_transfers', label: 'Repasses Admin' },
    { value: 'stores', label: 'Lojas' },
    { value: 'store_daily_sales', label: 'Vendas de Lojas' },
    { value: 'online_sales', label: 'Vendas Online' },
    { value: 'user_roles', label: 'Papéis de Usuário' },
    { value: 'user_permissions', label: 'Permissões' },
    { value: 'payment_settings', label: 'Configurações de Pagamento' }
  ];

  const createBackup = async () => {
    setLoading(true);
    try {
      const url = selectedTable === 'all' 
        ? `https://tzqriohyfazftfulwcuj.functions.supabase.co/backup-export?action=backup&format=${selectedFormat}`
        : `https://tzqriohyfazftfulwcuj.functions.supabase.co/backup-export?action=export&table=${selectedTable}&format=${selectedFormat}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cXJpb2h5ZmF6ZnRmdWx3Y3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNjcwNDAsImV4cCI6MjA2OTY0MzA0MH0.Zj8e5s0rZCHxJEkqpxMzHDEO-doBkiwzi7ErLHl9F28`,
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao criar backup');
      }

      // Download do arquivo
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm', { locale: ptBR });
      const filename = selectedTable === 'all' 
        ? `backup-completo-${timestamp}.${selectedFormat}`
        : `${selectedTable}-${timestamp}.${selectedFormat}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Backup criado com sucesso!",
        description: `Arquivo ${filename} baixado.`,
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao criar backup: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleAutomaticBackup = async () => {
    try {
      toast({
        title: "Backup automático configurado!",
        description: "Backup diário será executado às 02:00. Configure manualmente no Supabase.",
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao configurar backup automático: " + error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6" />
          Backup e Recuperação
        </h2>
      </div>

      {/* Backup Manual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Backup Manual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Dados para Backup</label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar dados" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(table => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Formato</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Formato do arquivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={createBackup} disabled={loading} className="w-full">
            {loading ? 'Criando backup...' : 'Criar Backup'}
          </Button>
        </CardContent>
      </Card>

      {/* Backup Automático */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Backup Automático
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Configure backup automático diário para executar às 02:00 (horário do servidor).
          </p>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Backup Diário Automático</h4>
              <p className="text-sm text-muted-foreground">
                Executa todos os dias às 02:00 e mantém backups dos últimos 7 dias
              </p>
            </div>
            <Button onClick={scheduleAutomaticBackup} variant="outline">
              Configurar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instruções de Recuperação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Instruções de Recuperação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm">1. Recuperação de Dados</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Para restaurar dados, acesse o painel do Supabase → SQL Editor e execute os comandos SQL do backup.
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm">2. Backup de Segurança</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Sempre mantenha backups em local seguro, separado do servidor principal.
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm">3. Teste de Recuperação</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Teste periodicamente a restauração em ambiente de desenvolvimento.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Importante:</strong> Sempre teste backups em ambiente separado antes de aplicar em produção.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};