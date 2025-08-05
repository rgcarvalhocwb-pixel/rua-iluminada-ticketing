-- Criar enum para as permissões do sistema
CREATE TYPE public.system_permission AS ENUM (
  'events_manage',
  'tickets_manage', 
  'cash_daily',
  'cash_general',
  'stores_manage',
  'online_sales',
  'orders_view',
  'payments_config',
  'users_manage',
  'dashboard_view'
);

-- Criar tabela de permissões de usuário
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  permission system_permission NOT NULL,
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage all permissions" 
ON public.user_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Função para verificar se usuário tem permissão específica
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission system_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  ) OR has_role(_user_id, 'admin'::app_role)
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();