-- Inserir usuário master padrão
INSERT INTO public.user_roles (user_id, role, status, approved_at, created_at, updated_at)
VALUES 
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