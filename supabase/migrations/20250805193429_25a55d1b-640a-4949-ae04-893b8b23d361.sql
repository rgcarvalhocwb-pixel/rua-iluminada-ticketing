-- Criar tabela de auditoria para registrar todas as ações dos usuários
CREATE TABLE user_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT
);

-- Criar índices para melhorar performance nas consultas
CREATE INDEX idx_user_audit_logs_user_id ON user_audit_logs(user_id);
CREATE INDEX idx_user_audit_logs_timestamp ON user_audit_logs(timestamp DESC);
CREATE INDEX idx_user_audit_logs_action ON user_audit_logs(action);
CREATE INDEX idx_user_audit_logs_entity_type ON user_audit_logs(entity_type);

-- Habilitar RLS
ALTER TABLE user_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para auditoria
CREATE POLICY "Admins can view all audit logs" 
ON user_audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs" 
ON user_audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Função para registrar logs de auditoria automaticamente
CREATE OR REPLACE FUNCTION log_user_action(
  p_user_id UUID,
  p_user_email TEXT,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO user_audit_logs (
    user_id,
    user_email,
    action,
    entity_type,
    entity_id,
    details,
    ip_address,
    user_agent,
    session_id
  ) VALUES (
    p_user_id,
    p_user_email,
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    p_ip_address,
    p_user_agent,
    p_session_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;