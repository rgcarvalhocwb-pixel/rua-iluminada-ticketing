import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Bug,
  Shield,
  Zap
} from 'lucide-react';
import { useTestSuite } from '@/hooks/useTestSuite';

const TestingSuite = () => {
  const {
    testSuites,
    isRunning,
    runAllTests,
    runPaymentFlowTests,
    runSecurityTests,
    runPerformanceTests
  } = useTestSuite();

  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      case 'running': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
  const passedTests = testSuites.reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'pass').length, 0);
  const failedTests = testSuites.reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'fail').length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suite de Testes</h2>
          <p className="text-muted-foreground">
            Validação automática de funcionalidades críticas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            size="lg"
          >
            {isRunning ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Executando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar Todos
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Test Summary */}
      {testSuites.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Testes</CardTitle>
              <Bug className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falharam</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedTests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {testSuites.map((suite) => (
              <Card key={suite.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{suite.name}</CardTitle>
                      <CardDescription>
                        {suite.tests.length} testes • {suite.tests.filter(t => t.status === 'pass').length} aprovados
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={suite.overall === 'pass' ? "default" : suite.overall === 'fail' ? "destructive" : "secondary"}
                    >
                      {suite.overall}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress 
                      value={(suite.tests.filter(t => t.status === 'pass').length / suite.tests.length) * 100}
                      className="h-2"
                    />
                    <div className="space-y-1">
                      {suite.tests.map((test, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(test.status)}
                            <span className="text-sm">{test.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {test.duration && (
                              <span className="text-xs text-muted-foreground">
                                {test.duration}ms
                              </span>
                            )}
                            {test.message && (
                              <span className="text-xs text-red-600 max-w-xs truncate">
                                {test.message}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {testSuites.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Nenhum teste executado</p>
                  <p className="text-muted-foreground mb-4">Execute a suite de testes para validar o sistema</p>
                  <Button onClick={runAllTests}>
                    <Play className="h-4 w-4 mr-2" />
                    Executar Testes
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Testes de Pagamento</h3>
            <Button onClick={runPaymentFlowTests} disabled={isRunning}>
              <Play className="h-4 w-4 mr-2" />
              Executar
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Fluxo de Pagamento
              </CardTitle>
              <CardDescription>
                Testa integração com PagSeguro, validação de dados e processamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Criação de pagamento PagSeguro</span>
                    <Badge variant="outline">Crítico</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Validação de CPF</span>
                    <Badge variant="outline">Alto</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Processamento de resposta</span>
                    <Badge variant="outline">Alto</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Atualização de status no banco</span>
                    <Badge variant="outline">Médio</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Testes de Segurança</h3>
            <Button onClick={runSecurityTests} disabled={isRunning}>
              <Shield className="h-4 w-4 mr-2" />
              Executar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Validação de Segurança
              </CardTitle>
              <CardDescription>
                Verifica políticas RLS, autenticação e auditoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Políticas RLS ativas</span>
                    <Badge variant="destructive">Crítico</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Logs de auditoria funcionais</span>
                    <Badge variant="outline">Alto</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Validação de entrada</span>
                    <Badge variant="outline">Alto</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Proteção contra ataques</span>
                    <Badge variant="outline">Médio</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Testes de Performance</h3>
            <Button onClick={runPerformanceTests} disabled={isRunning}>
              <Zap className="h-4 w-4 mr-2" />
              Executar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Análise de Performance
              </CardTitle>
              <CardDescription>
                Monitora tempo de resposta, uso de memória e otimizações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Tempo de resposta da API</span>
                    <Badge variant="outline">Alto</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Uso de memória</span>
                    <Badge variant="outline">Médio</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Cache funcionando</span>
                    <Badge variant="outline">Médio</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>✓ Otimizações de consulta</span>
                    <Badge variant="outline">Baixo</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestingSuite;