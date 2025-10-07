-- FASE 5: Adicionar coluna is_test_data em tabelas relevantes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE imported_sales ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE turnstiles ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE show_times ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;

-- Criar índices para performance com is_test_data
CREATE INDEX IF NOT EXISTS idx_orders_is_test_data ON orders(is_test_data) WHERE is_test_data = true;
CREATE INDEX IF NOT EXISTS idx_tickets_is_test_data ON tickets(is_test_data) WHERE is_test_data = true;

-- Marcar dados obviamente de teste
UPDATE orders SET is_test_data = true 
WHERE customer_name ILIKE '%teste%' 
   OR customer_email ILIKE '%teste%'
   OR customer_email ILIKE '%exemplo%'
   OR customer_email ILIKE '%ficticio%'
   OR customer_cpf = '12345678900';

UPDATE events SET is_test_data = true
WHERE name ILIKE '%teste%' 
   OR description ILIKE '%fictício%'
   OR description ILIKE '%exemplo%';

UPDATE stores SET is_test_data = true
WHERE name ILIKE '%teste%' 
   OR responsible ILIKE '%teste%';

UPDATE turnstiles SET is_test_data = true
WHERE name ILIKE '%teste%' 
   OR location ILIKE '%teste%';

UPDATE imported_sales SET is_test_data = true
WHERE reference LIKE 'REF%';

-- FASE 6.1: Índices de Performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_date_status ON orders(created_at, payment_status);

CREATE INDEX IF NOT EXISTS idx_validations_validated_at ON validations(validated_at);
CREATE INDEX IF NOT EXISTS idx_validations_ticket_id ON validations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_validations_turnstile_id ON validations(turnstile_id);

CREATE INDEX IF NOT EXISTS idx_daily_closures_closure_date ON daily_closures(closure_date);

CREATE INDEX IF NOT EXISTS idx_terminal_heartbeats_terminal ON terminal_heartbeats(terminal_id);
CREATE INDEX IF NOT EXISTS idx_terminal_heartbeats_created ON terminal_heartbeats(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

CREATE INDEX IF NOT EXISTS idx_orders_event_date ON orders(session_id, created_at);

-- FASE 6.2: Tabela para Rate Limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  count INTEGER DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

-- Função para limpar rate limits expirados
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE reset_at < now();
END;
$$ LANGUAGE plpgsql;

-- Comentários explicativos
COMMENT ON COLUMN orders.is_test_data IS 'Flag para identificar dados de teste que podem ser removidos';
COMMENT ON COLUMN events.is_test_data IS 'Flag para identificar dados de teste que podem ser removidos';
COMMENT ON TABLE rate_limits IS 'Tabela para controle de rate limiting em edge functions';