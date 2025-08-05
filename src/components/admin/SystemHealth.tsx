import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { validateSystemHealth, systemModules, getModuleStatus, type SystemModule } from '@/lib/system-validation';

export const SystemHealth = () => {
  const [healthStatus, setHealthStatus] = useState<{
    errors: string[];
    warnings: string[];
    isHealthy: boolean;
  }>({ errors: [], warnings: [], isHealthy: true });
  
  const [loading, setLoading] = useState(false);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const status = validateSystemHealth();
      setHealthStatus(status);
    } catch (error) {
      console.error('Erro ao verificar saúde do sistema:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const getStatusIcon = (status: 'active' | 'warning' | 'error') => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'active' | 'warning' | 'error') => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {healthStatus.isHealthy ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Status do Sistema
            </CardTitle>
            <Button 
              onClick={checkSystemHealth} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Verificar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthStatus.isHealthy ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  ✅ Sistema Funcionando Corretamente
                </Badge>
              </div>
            ) : (
              <div className="space-y-2">
                {healthStatus.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">{error}</span>
                  </div>
                ))}
                {healthStatus.warnings.map((warning, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-600">{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status dos Módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Módulos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(systemModules).map(([key, name]) => {
              const status = getModuleStatus(key as SystemModule);
              return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="font-medium">{name}</span>
                  </div>
                  <Badge className={getStatusColor(status)}>
                    {status === 'active' ? 'Ativo' : status === 'warning' ? 'Aviso' : 'Erro'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">🎄 Rua Iluminada - Sistema de Ingressos</h4>
              <p className="text-sm text-muted-foreground">
                Sistema completo de venda de ingressos e gestão de eventos
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Módulos Ativos</h4>
              <p className="text-sm text-muted-foreground">
                {Object.keys(systemModules).length} módulos disponíveis
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Tecnologias</h4>
              <p className="text-sm text-muted-foreground">
                React + TypeScript + Supabase + Tailwind CSS
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Desenvolvido por</h4>
              <p className="text-sm text-muted-foreground">
                Rayzer Serviços e Tecnologia LTDA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};