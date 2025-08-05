-- Corrigir search_path das funções existentes para segurança
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND status = 'approved'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND status = 'approved'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission system_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  ) OR has_role(_user_id, 'admin'::app_role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, status)
  VALUES (NEW.id, 'user', 'pending');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_qr_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'RI2024' || LPAD(floor(random() * 1000000)::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_ticket_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number = public.generate_ticket_number();
  END IF;
  
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code = public.generate_qr_code();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função para promover o primeiro usuário a admin automaticamente
CREATE OR REPLACE FUNCTION public.promote_first_user_to_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_user_id uuid;
  admin_count integer;
BEGIN
  -- Verificar se já existe algum admin
  SELECT COUNT(*) INTO admin_count 
  FROM public.user_roles 
  WHERE role = 'admin';
  
  -- Se não há admins, promover o primeiro usuário
  IF admin_count = 0 THEN
    -- Buscar o primeiro usuário por data de criação
    SELECT user_id INTO first_user_id
    FROM public.user_roles
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Se encontrou um usuário, promover a admin
    IF first_user_id IS NOT NULL THEN
      UPDATE public.user_roles 
      SET role = 'admin', status = 'approved' 
      WHERE user_id = first_user_id;
      
      -- Conceder todas as permissões
      INSERT INTO public.user_permissions (user_id, permission)
      VALUES 
        (first_user_id, 'events_manage'),
        (first_user_id, 'tickets_manage'),
        (first_user_id, 'cash_daily'),
        (first_user_id, 'cash_general'),
        (first_user_id, 'stores_manage'),
        (first_user_id, 'online_sales'),
        (first_user_id, 'orders_view'),
        (first_user_id, 'payments_config'),
        (first_user_id, 'users_manage'),
        (first_user_id, 'dashboard_view')
      ON CONFLICT (user_id, permission) DO NOTHING;
    END IF;
  END IF;
END;
$$;

-- Executar a função para promover o primeiro usuário
SELECT public.promote_first_user_to_admin();