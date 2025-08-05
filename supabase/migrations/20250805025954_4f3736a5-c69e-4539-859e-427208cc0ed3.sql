-- Atualizar o enum app_role para incluir 'master'
ALTER TYPE public.app_role ADD VALUE 'master';

-- Criar dois usuários master padrão
-- Primeiro, criar os usuários no auth.users (isso será feito manualmente)
-- Depois criar os roles master

-- Inserir usuários master padrão
INSERT INTO public.user_roles (user_id, role, status, approved_at, created_at, updated_at)
VALUES 
  -- Usuário Master 1 (você precisará substituir pelos UUIDs reais após criar os usuários)
  ('ed9fac91-f902-4e84-973e-a0f7c54dd9ed', 'master', 'approved', now(), now(), now())
ON CONFLICT (user_id) DO UPDATE SET
  role = 'master',
  status = 'approved',
  approved_at = now(),
  updated_at = now();

-- Atualizar a função has_role para dar permissões completas aos masters
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'master')
      AND status = 'approved'
  )
$function$;

-- Atualizar a função has_permission para dar todas as permissões aos masters
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission system_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  ) OR has_role(_user_id, 'admin'::app_role) OR has_role(_user_id, 'master'::app_role)
$function$;

-- Função para criar novo usuário (apenas masters podem usar)
CREATE OR REPLACE FUNCTION public.create_user_account(
  _email text,
  _password text,
  _role app_role DEFAULT 'user'::app_role
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- Verificar se o usuário atual é master
  IF NOT has_role(auth.uid(), 'master'::app_role) THEN
    RAISE EXCEPTION 'Apenas usuários master podem criar novos usuários';
  END IF;

  -- Inserir novo usuário via SQL direto (simulação)
  -- Na prática, isso deve ser feito via API do Supabase Auth
  SELECT gen_random_uuid() INTO new_user_id;
  
  -- Criar role para o novo usuário
  INSERT INTO public.user_roles (user_id, role, status, approved_by, approved_at)
  VALUES (new_user_id, _role, 'approved', auth.uid(), now());
  
  -- Retornar resultado
  SELECT json_build_object(
    'user_id', new_user_id,
    'email', _email,
    'role', _role,
    'message', 'Usuário criado com sucesso. Termine o processo no dashboard de autenticação.'
  ) INTO result;
  
  RETURN result;
END;
$function$;