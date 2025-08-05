-- Criar tabela para registrar lojas
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  responsible TEXT NOT NULL,
  contact TEXT,
  space_value NUMERIC NOT NULL DEFAULT 0,
  commission_percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para vendas online de terceiros
CREATE TABLE public.online_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  platform_name TEXT NOT NULL,
  ticket_type TEXT NOT NULL,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  quantity_refunded INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL,
  sale_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para repasses de vendas online
CREATE TABLE public.online_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name TEXT NOT NULL,
  transfer_date DATE NOT NULL,
  expected_amount NUMERIC NOT NULL,
  received_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para vendas diárias das lojas
CREATE TABLE public.store_daily_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  event_id UUID NOT NULL,
  sale_date DATE NOT NULL,
  total_sales NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, event_id, sale_date)
);

-- Criar tabela para fechamentos diários do caixa
CREATE TABLE public.daily_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  closure_date DATE NOT NULL,
  total_income NUMERIC NOT NULL,
  total_expense NUMERIC NOT NULL,
  final_balance NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, closure_date)
);

-- Criar tabela para repasses à administração
CREATE TABLE public.admin_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  transfer_amount NUMERIC NOT NULL,
  transfer_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_transfers ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Authenticated users can manage stores" ON public.stores
FOR ALL USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage online_sales" ON public.online_sales
FOR ALL USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage online_transfers" ON public.online_transfers
FOR ALL USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage store_daily_sales" ON public.store_daily_sales
FOR ALL USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage daily_closures" ON public.daily_closures
FOR ALL USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can manage admin_transfers" ON public.admin_transfers
FOR ALL USING (auth.role() = 'authenticated'::text);

-- Criar triggers para updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_online_sales_updated_at
BEFORE UPDATE ON public.online_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_online_transfers_updated_at
BEFORE UPDATE ON public.online_transfers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_daily_sales_updated_at
BEFORE UPDATE ON public.store_daily_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();