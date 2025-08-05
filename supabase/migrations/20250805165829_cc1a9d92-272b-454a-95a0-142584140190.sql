-- Corrigir usuário Diulli sem permissões
UPDATE user_roles 
SET role = 'user', status = 'approved' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'diulliany.mw@hotmail.com');

-- Se não existe registro, criar um
INSERT INTO user_roles (user_id, role, status)
SELECT id, 'user', 'approved'
FROM auth.users 
WHERE email = 'diulliany.mw@hotmail.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.users.id
);

-- Criar tabela para controle de vendas importadas
CREATE TABLE IF NOT EXISTS public.imported_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  import_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'pagseguro',
  amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(reference, source)
);

-- Enable RLS
ALTER TABLE public.imported_sales ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura e escrita para usuários autenticados
CREATE POLICY "Users can view imported sales" ON public.imported_sales
  FOR SELECT USING (true);

CREATE POLICY "Users can insert imported sales" ON public.imported_sales
  FOR INSERT WITH CHECK (true);

-- Conceder permissões básicas para usuários aprovados
INSERT INTO public.user_permissions (user_id, permission)
SELECT ur.user_id, 'dashboard_view'
FROM public.user_roles ur
WHERE ur.status = 'approved' 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_permissions up 
    WHERE up.user_id = ur.user_id AND up.permission = 'dashboard_view'
  );