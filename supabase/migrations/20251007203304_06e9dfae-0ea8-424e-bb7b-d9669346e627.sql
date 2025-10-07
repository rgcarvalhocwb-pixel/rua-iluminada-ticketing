-- Criar tabela para centralizar todas as configurações de integração
CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('payment', 'analytics', 'webhook', 'email', 'sms', 'other')),
  key TEXT NOT NULL,
  value TEXT,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category, key)
);

-- Habilitar RLS
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Apenas admins e masters podem gerenciar integrações
CREATE POLICY "Admins can manage integration_settings"
ON integration_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_integration_settings_updated_at
BEFORE UPDATE ON integration_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações padrão
INSERT INTO integration_settings (category, key, display_name, description, is_encrypted) VALUES
-- Pagamentos
('payment', 'pagseguro_email', 'Email PagSeguro', 'Email da conta PagSeguro para processar pagamentos', false),
('payment', 'pagseguro_token', 'Token PagSeguro', 'Token de API do PagSeguro', true),
('payment', 'pagseguro_environment', 'Ambiente PagSeguro', 'Sandbox ou Produção (sandbox/production)', false),

-- Analytics
('analytics', 'google_analytics_id', 'Google Analytics ID', 'ID de rastreamento do Google Analytics (GA4)', false),
('analytics', 'google_tag_manager_id', 'Google Tag Manager ID', 'ID do Google Tag Manager', false),
('analytics', 'facebook_pixel_id', 'Facebook Pixel ID', 'ID do Facebook Pixel para rastreamento', false),
('analytics', 'hotjar_id', 'Hotjar ID', 'ID do Hotjar para análise de comportamento', false),

-- Webhooks e Integrações
('webhook', 'webhook_secret', 'Secret do Webhook', 'Secret para validar chamadas de webhook de sites externos', true),
('webhook', 'webhook_enabled', 'Webhook Ativo', 'Ativar ou desativar recebimento de webhooks', false),

-- Email (futuro)
('email', 'smtp_host', 'Servidor SMTP', 'Endereço do servidor SMTP para envio de emails', false),
('email', 'smtp_port', 'Porta SMTP', 'Porta do servidor SMTP', false),
('email', 'smtp_user', 'Usuário SMTP', 'Usuário para autenticação SMTP', false),
('email', 'smtp_password', 'Senha SMTP', 'Senha para autenticação SMTP', true),

-- SMS (futuro)
('sms', 'twilio_account_sid', 'Twilio Account SID', 'Account SID do Twilio para envio de SMS', false),
('sms', 'twilio_auth_token', 'Twilio Auth Token', 'Token de autenticação do Twilio', true),
('sms', 'twilio_phone_number', 'Número Twilio', 'Número de telefone do Twilio', false)
ON CONFLICT (category, key) DO NOTHING;

-- Comentários
COMMENT ON TABLE integration_settings IS 'Centralizador de todas as configurações de integração do sistema';
COMMENT ON COLUMN integration_settings.category IS 'Categoria da integração: payment, analytics, webhook, email, sms';
COMMENT ON COLUMN integration_settings.key IS 'Chave única de identificação da configuração';
COMMENT ON COLUMN integration_settings.value IS 'Valor da configuração (pode ser encriptado)';
COMMENT ON COLUMN integration_settings.is_encrypted IS 'Indica se o valor está encriptado (para senhas, tokens, etc)';