-- Criar tabela para configurações do terminal
CREATE TABLE public.terminal_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  background_type TEXT NOT NULL DEFAULT 'static' CHECK (background_type IN ('video', 'slideshow', 'static')),
  background_url TEXT,
  welcome_message TEXT NOT NULL DEFAULT 'Bem-vindo ao Terminal de Auto Atendimento',
  instructions TEXT NOT NULL DEFAULT 'Clique em qualquer local da tela para iniciar sua compra',
  idle_timeout INTEGER NOT NULL DEFAULT 60,
  max_tickets_per_purchase INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.terminal_config (
  background_type,
  welcome_message,
  instructions,
  idle_timeout,
  max_tickets_per_purchase
) VALUES (
  'static',
  'Terminal de Auto Atendimento',
  'Clique em qualquer local da tela para iniciar sua compra',
  60,
  10
);

-- Habilitar RLS
ALTER TABLE public.terminal_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas admins podem gerenciar
CREATE POLICY "Admins can manage terminal_config" 
ON public.terminal_config 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- Todos podem visualizar (para o terminal funcionar)
CREATE POLICY "Public can view terminal_config" 
ON public.terminal_config 
FOR SELECT 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_terminal_config_updated_at
BEFORE UPDATE ON public.terminal_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();