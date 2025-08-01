-- =====================================
-- SISTEMA DE INGRESSOS RUA ILUMINADA
-- Estrutura completa do banco de dados
-- =====================================

-- 1. Tabela de eventos (configuração geral)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de horários de shows
CREATE TABLE public.show_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  time_slot TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de tipos de ingresso
CREATE TABLE public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de sessões (combinação de data + horário)
CREATE TABLE public.event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  show_time_id UUID NOT NULL REFERENCES public.show_times(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  capacity INTEGER NOT NULL,
  available_tickets INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'sold_out')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, show_time_id, session_date)
);

-- 5. Tabela de pedidos/vendas
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded')),
  payment_method TEXT DEFAULT 'pagseguro',
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabela de itens do pedido (ingressos individuais)
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Tabela de ingressos (cada ingresso individual com QR Code)
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'expired')),
  used_at TIMESTAMPTZ,
  validated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Tabela de catracas (dispositivos de validação)
CREATE TABLE public.turnstiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ip_address INET,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Tabela de validações (log de entradas)
CREATE TABLE public.validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  turnstile_id UUID REFERENCES public.turnstiles(id),
  validation_method TEXT NOT NULL CHECK (validation_method IN ('turnstile', 'app', 'manual')),
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  validator_user TEXT,
  notes TEXT
);

-- =====================================
-- TRIGGERS PARA TIMESTAMPS AUTOMÁTICOS
-- =====================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_sessions_updated_at
  BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_turnstiles_updated_at
  BEFORE UPDATE ON public.turnstiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================

-- Ativar RLS em todas as tabelas
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnstiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura pública (dados do evento)
CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public can view show_times" ON public.show_times FOR SELECT USING (true);
CREATE POLICY "Public can view ticket_types" ON public.ticket_types FOR SELECT USING (true);
CREATE POLICY "Public can view event_sessions" ON public.event_sessions FOR SELECT USING (true);

-- Políticas para pedidos (clientes podem ver seus próprios pedidos)
CREATE POLICY "Customers can view own orders" ON public.orders 
  FOR SELECT USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Customers can create orders" ON public.orders 
  FOR INSERT WITH CHECK (true);

-- Políticas para itens do pedido
CREATE POLICY "Customers can view own order_items" ON public.order_items 
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "System can insert order_items" ON public.order_items 
  FOR INSERT WITH CHECK (true);

-- Políticas para ingressos
CREATE POLICY "Customers can view own tickets" ON public.tickets 
  FOR SELECT USING (
    order_item_id IN (
      SELECT oi.id FROM public.order_items oi
      JOIN public.orders o ON oi.order_id = o.id
      WHERE o.customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "System can manage tickets" ON public.tickets 
  FOR ALL USING (true);

-- Políticas para validações (staff pode validar)
CREATE POLICY "Staff can manage validations" ON public.validations 
  FOR ALL USING (true);

-- Políticas para catracas (apenas administração)
CREATE POLICY "Admin can manage turnstiles" ON public.turnstiles 
  FOR ALL USING (true);

-- =====================================
-- FUNÇÕES AUXILIARES
-- =====================================

-- Função para gerar número do ingresso
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RI2024' || LPAD(floor(random() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Função para gerar QR Code único
CREATE OR REPLACE FUNCTION public.generate_qr_code()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar ticket_number e qr_code automaticamente
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_ticket_data_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_ticket_data();

-- =====================================
-- DADOS INICIAIS (SEED DATA)
-- =====================================

-- Inserir o evento Rua Iluminada 2024
INSERT INTO public.events (name, description, start_date, end_date) VALUES 
('Rua Iluminada 2024', 'Espetáculo natalino da Família Moletta com mais de 1 milhão de luzes', '2024-11-14', '2024-12-31');

-- Inserir horários dos shows
INSERT INTO public.show_times (event_id, time_slot, capacity) 
SELECT e.id, t.time_slot, 100
FROM public.events e
CROSS JOIN (VALUES 
  ('19:00'::time),
  ('20:00'::time),
  ('21:00'::time),
  ('22:00'::time),
  ('23:00'::time),
  ('23:30'::time)
) AS t(time_slot)
WHERE e.name = 'Rua Iluminada 2024';

-- Inserir tipos de ingresso
INSERT INTO public.ticket_types (event_id, name, description, price)
SELECT e.id, t.name, t.description, t.price
FROM public.events e
CROSS JOIN (VALUES 
  ('Inteira', 'Ingresso padrão para o evento', 85.00),
  ('Meia-entrada', 'Para estudantes, idosos e pessoas com deficiência', 42.50),
  ('Gratuito', 'Ingresso promocional ou cortesia', 0.00)
) AS t(name, description, price)
WHERE e.name = 'Rua Iluminada 2024';