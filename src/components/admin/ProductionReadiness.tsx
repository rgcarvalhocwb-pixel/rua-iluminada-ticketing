import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Rocket, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Server,
  Shield,
  Database,
  Monitor,
  FileText,
  Settings,
  Cloud,
  Lock
} from 'lucide-react';

interface ProductionCheck {
  id: string;
  category: 'security' | 'performance' | 'infrastructure' | 'documentation';
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  priority: 'critical' | 'high' | 'medium' | 'low';
  details?: string;
  fix?: string;
}

const ProductionReadiness = () => {
  const [checks, setChecks] = useState<ProductionCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  const productionChecks: ProductionCheck[] = [
    // Security Checks
    {
      id: 'rls-policies',
      category: 'security',
      name: 'Políticas RLS Configuradas',
      description: 'Todas as tabelas sensíveis têm Row Level Security habilitado',
      status: 'pending',
      priority: 'critical',
      fix: 'Verificar e ativar RLS em todas as tabelas necessárias'
    },
    {
      id: 'auth-validation',
      category: 'security',
      name: 'Validação de Autenticação',
      description: 'Sistema de autenticação funcionando corretamente',
      status: 'pending',
      priority: 'critical'
    },
    {
      id: 'input-validation',
      category: 'security',
      name: 'Validação de Entrada',
      description: 'Todos os inputs do usuário são validados e sanitizados',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'https-ssl',
      category: 'security',
      name: 'HTTPS/SSL Configurado',
      description: 'Certificados SSL válidos e configuração HTTPS',
      status: 'pending',
      priority: 'critical'
    },

    // Performance Checks
    {
      id: 'api-response-time',
      category: 'performance',
      name: 'Tempo de Resposta da API',
      description: 'APIs respondem em menos de 2 segundos',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'database-indexes',
      category: 'performance',
      name: 'Índices do Banco de Dados',
      description: 'Consultas frequentes têm índices apropriados',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 'caching-strategy',
      category: 'performance',
      name: 'Estratégia de Cache',
      description: 'Cache implementado para dados frequentemente acessados',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 'image-optimization',
      category: 'performance',
      name: 'Otimização de Imagens',
      description: 'Imagens são comprimidas e otimizadas',
      status: 'pending',
      priority: 'low'
    },

    // Infrastructure Checks
    {
      id: 'backup-strategy',
      category: 'infrastructure',
      name: 'Estratégia de Backup',
      description: 'Backups automáticos configurados e testados',
      status: 'pending',
      priority: 'critical'
    },
    {
      id: 'monitoring-alerts',
      category: 'infrastructure',
      name: 'Monitoramento e Alertas',
      description: 'Sistema de monitoramento e alertas funcionando',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'error-handling',
      category: 'infrastructure',
      name: 'Tratamento de Erros',
      description: 'Erros são tratados graciosamente',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'load-testing',
      category: 'infrastructure',
      name: 'Teste de Carga',
      description: 'Sistema testado sob carga esperada',
      status: 'pending',
      priority: 'medium'
    },

    // Documentation Checks
    {
      id: 'api-documentation',
      category: 'documentation',
      name: 'Documentação da API',
      description: 'APIs documentadas com exemplos',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 'deployment-guide',
      category: 'documentation',
      name: 'Guia de Implantação',
      description: 'Processo de deploy documentado',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'user-manual',
      category: 'documentation',
      name: 'Manual do Usuário',
      description: 'Documentação para usuários finais',
      status: 'pending',
      priority: 'low'
    },
    {
      id: 'troubleshooting',
      category: 'documentation',
      name: 'Guia de Troubleshooting',
      description: 'Problemas comuns e soluções documentadas',
      status: 'pending',
      priority: 'medium'
    }
  ];

  useEffect(() => {
    setChecks(productionChecks);
  }, []);

  const runProductionChecks = async () => {
    setIsRunning(true);
    
    // Simulate running checks
    for (let i = 0; i < checks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setChecks(prev => prev.map((check, index) => {
        if (index === i) {
          // Simulate check results
          const results = ['pass', 'fail', 'warning'];
          const randomResult = results[Math.floor(Math.random() * results.length)] as any;
          
          return {
            ...check,
            status: randomResult,
            details: randomResult === 'fail' ? 'Necessita correção' : 'Verificação concluída'
          };
        }
        return check;
      }));
    }
    
    setIsRunning(false);
  };

  const calculateScore = () => {
    const totalChecks = checks.length;
    if (totalChecks === 0) return 0;

    const passedChecks = checks.filter(c => c.status === 'pass').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;
    
    return Math.round(((passedChecks + warningChecks * 0.5) / totalChecks) * 100);
  };

  useEffect(() => {
    setOverallScore(calculateScore());
  }, [checks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-5 w-5" />;
      case 'performance': return <Monitor className="h-5 w-5" />;
      case 'infrastructure': return <Server className="h-5 w-5" />;
      case 'documentation': return <FileText className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const groupedChecks = checks.reduce((acc, check) => {
    if (!acc[check.category]) {
      acc[check.category] = [];
    }
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, ProductionCheck[]>);

  const criticalIssues = checks.filter(c => c.status === 'fail' && c.priority === 'critical').length;
  const readyForProduction = criticalIssues === 0 && overallScore >= 85;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Preparação para Produção</h2>
          <p className="text-muted-foreground">
            Verificação completa antes do lançamento
          </p>
        </div>
        <Button 
          onClick={runProductionChecks} 
          disabled={isRunning}
          size="lg"
        >
          <Rocket className="h-4 w-4 mr-2" />
          {isRunning ? 'Verificando...' : 'Executar Verificação'}
        </Button>
      </div>

      {/* Overall Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontuação Geral</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallScore}%</div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problemas Críticos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalIssues}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {readyForProduction ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${readyForProduction ? 'text-green-600' : 'text-yellow-600'}`}>
              {readyForProduction ? 'Pronto' : 'Pendente'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{criticalIssues} problema(s) crítico(s)</strong> devem ser resolvidos antes da produção.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="infrastructure">Infraestrutura</TabsTrigger>
          <TabsTrigger value="documentation">Documentação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(groupedChecks).map(([category, categoryChecks]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {getCategoryIcon(category)}
                    <span className="ml-2 capitalize">{category}</span>
                    <Badge variant="outline" className="ml-2">
                      {categoryChecks.filter(c => c.status === 'pass').length}/{categoryChecks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryChecks.map((check) => (
                      <div key={check.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(check.status)}
                          <div>
                            <p className="font-medium">{check.name}</p>
                            <p className="text-sm text-muted-foreground">{check.description}</p>
                            {check.details && (
                              <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={getPriorityColor(check.priority) as any}>
                          {check.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {(['security', 'performance', 'infrastructure', 'documentation'] as const).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center">
                {getCategoryIcon(category)}
                <span className="ml-2 capitalize">{category}</span>
              </h3>
            </div>

            <div className="space-y-4">
              {groupedChecks[category]?.map((check) => (
                <Card key={check.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        {getStatusIcon(check.status)}
                        <span className="ml-2">{check.name}</span>
                      </CardTitle>
                      <Badge variant={getPriorityColor(check.priority) as any}>
                        {check.priority}
                      </Badge>
                    </div>
                    <CardDescription>{check.description}</CardDescription>
                  </CardHeader>
                  {(check.details || check.fix) && (
                    <CardContent>
                      {check.details && (
                        <p className="text-sm mb-2">{check.details}</p>
                      )}
                      {check.fix && check.status === 'fail' && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Correção necessária:</strong> {check.fix}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Production Deployment Guide */}
      {readyForProduction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Sistema Pronto para Produção
            </CardTitle>
            <CardDescription>
              Todas as verificações críticas foram aprovadas. Você pode prosseguir com o deployment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h4 className="font-medium">Próximos Passos:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Fazer backup final do banco de dados</li>
                <li>Configurar domínio de produção</li>
                <li>Ativar monitoramento em produção</li>
                <li>Realizar testes finais no ambiente de produção</li>
                <li>Comunicar equipe sobre o lançamento</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductionReadiness;