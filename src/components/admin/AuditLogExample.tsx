import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useToast } from "@/hooks/use-toast";

export const AuditLogExample = () => {
  const { logAction } = useAuditLog();
  const { toast } = useToast();

  const testAuditLog = async () => {
    try {
      await logAction({
        action: 'test_action',
        entityType: 'system',
        entityId: 'test-' + Date.now(),
        details: {
          message: 'Teste de log de auditoria',
          timestamp: new Date().toISOString(),
          browser: navigator.userAgent.substring(0, 50)
        }
      });

      toast({
        title: "Log de teste criado",
        description: "Verifique na seção de auditoria",
      });
    } catch (error) {
      console.error('Erro ao criar log de teste:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar log de teste",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teste de Auditoria</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testAuditLog}>
          Criar Log de Teste
        </Button>
      </CardContent>
    </Card>
  );
};