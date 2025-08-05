-- Corrigir o security warning da função log_user_action
DROP FUNCTION IF EXISTS log_user_action;

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
SET search_path = 'public'
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