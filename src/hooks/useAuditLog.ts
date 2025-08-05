import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuditLogData {
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
}

export const useAuditLog = () => {
  const { toast } = useToast();

  const logAction = async ({ action, entityType, entityId, details }: AuditLogData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Registrar a ação no banco de auditoria
      const { error } = await supabase.rpc('log_user_action', {
        p_user_id: user.id,
        p_user_email: user.email,
        p_action: action,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_details: details ? JSON.stringify(details) : null,
        p_session_id: null
      });

      if (error) {
        console.error('Erro ao registrar auditoria:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  };

  return { logAction };
};