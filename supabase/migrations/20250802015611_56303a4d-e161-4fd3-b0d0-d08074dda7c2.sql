-- Criar o banco de dados completo para o sistema Rua Iluminada
-- 2025 com preços: Inteira R$ 30, Meia R$ 15

-- Criar tabela de eventos
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de horários dos shows
CREATE TABLE public.show_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  time_slot TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de sessões (combinação de data e horário)
CREATE TABLE public.event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  show_time_id UUID NOT NULL REFERENCES show_times(id),
  session_date DATE NOT NULL,
  capacity INTEGER NOT NULL,
  available_tickets INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de tipos de ingressos
CREATE TABLE public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de pedidos
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES event_sessions(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'pagseguro',
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de itens do pedido
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de ingressos individuais
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  ticket_number TEXT NOT NULL,
  qr_code TEXT NOT NULL,
  status TEXT DEFAULT 'valid',
  used_at TIMESTAMPTZ,
  validated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de catracas (para controle futuro)
CREATE TABLE public.turnstiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  ip_address INET,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de validações
CREATE TABLE public.validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  turnstile_id UUID REFERENCES turnstiles(id),
  validation_method TEXT NOT NULL,
  validator_user TEXT,
  notes TEXT,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ativar RLS em todas as tabelas
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnstiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público para leitura de dados básicos
CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public can view show_times" ON public.show_times FOR SELECT USING (true);
CREATE POLICY "Public can view event_sessions" ON public.event_sessions FOR SELECT USING (true);
CREATE POLICY "Public can view ticket_types" ON public.ticket_types FOR SELECT USING (true);

-- Políticas para pedidos (baseadas no email do cliente)
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT 
USING (customer_email = (current_setting('request.jwt.claims', true)::json->>'email'));

-- Políticas para itens do pedido
CREATE POLICY "System can insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can view own order_items" ON public.order_items FOR SELECT 
USING (order_id IN (
  SELECT id FROM orders 
  WHERE customer_email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Políticas para ingressos
CREATE POLICY "System can manage tickets" ON public.tickets FOR ALL USING (true);
CREATE POLICY "Customers can view own tickets" ON public.tickets FOR SELECT 
USING (order_item_id IN (
  SELECT oi.id FROM order_items oi 
  JOIN orders o ON oi.order_id = o.id 
  WHERE o.customer_email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Políticas para administração (catracas e validações)
CREATE POLICY "Admin can manage turnstiles" ON public.turnstiles FOR ALL USING (true);
CREATE POLICY "Staff can manage validations" ON public.validations FOR ALL USING (true);

-- Funções para automatização
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RI2025' || LPAD(floor(random() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_qr_code()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_generate_ticket_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number = public.generate_ticket_number();
  END IF;
  
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code = public.generate_qr_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar triggers
CREATE TRIGGER auto_generate_ticket_data_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_ticket_data();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_sessions_updated_at
  BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais para o evento Rua Iluminada 2025
INSERT INTO public.events (name, description, start_date, end_date) VALUES (
  'Rua Iluminada - Família Moletta 2025',
  'O maior espetáculo natalino da região! 48 dias de magia, luzes e emoção para toda a família.',
  '2025-11-14',
  '2025-12-31'
);

-- Inserir horários dos shows
INSERT INTO public.show_times (event_id, time_slot, capacity) 
SELECT 
  e.id,
  unnest(ARRAY['19:00'::time, '20:00'::time, '21:00'::time, '22:00'::time, '23:00'::time, '23:30'::time]),
  100
FROM public.events e 
WHERE e.name = 'Rua Iluminada - Família Moletta 2025';

-- Inserir tipos de ingressos com os preços corretos
INSERT INTO public.ticket_types (event_id, name, description, price)
SELECT 
  e.id,
  unnest(ARRAY['Inteira', 'Meia-entrada']),
  unnest(ARRAY[
    'Ingresso padrão para o evento',
    'Para estudantes, idosos (60+), pessoas com deficiência, professores e profissionais da cultura'
  ]),
  unnest(ARRAY[30.00, 15.00])
FROM public.events e 
WHERE e.name = 'Rua Iluminada - Família Moletta 2025';

-- Gerar sessões automaticamente para todos os dias do evento
INSERT INTO public.event_sessions (event_id, show_time_id, session_date, capacity, available_tickets)
SELECT 
  e.id,
  st.id,
  generate_series(e.start_date, e.end_date, '1 day'::interval)::date,
  st.capacity,
  st.capacity
FROM public.events e
CROSS JOIN public.show_times st
WHERE e.name = 'Rua Iluminada - Família Moletta 2025';