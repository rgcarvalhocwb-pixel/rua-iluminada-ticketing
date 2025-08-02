-- Create complete database structure for Rua Iluminada ticket system

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Show times table
CREATE TABLE IF NOT EXISTS public.show_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  time_slot TIME NOT NULL,
  capacity INTEGER DEFAULT 100 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Event sessions table (specific date + time combinations)
CREATE TABLE IF NOT EXISTS public.event_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  show_time_id UUID REFERENCES public.show_times(id) NOT NULL,
  session_date DATE NOT NULL,
  capacity INTEGER NOT NULL,
  available_tickets INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Ticket types table
CREATE TABLE IF NOT EXISTS public.ticket_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.event_sessions(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'pagseguro',
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  ticket_type_id UUID REFERENCES public.ticket_types(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID REFERENCES public.order_items(id) NOT NULL,
  ticket_number TEXT NOT NULL,
  qr_code TEXT NOT NULL,
  status TEXT DEFAULT 'valid',
  used_at TIMESTAMP WITH TIME ZONE,
  validated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Validations table
CREATE TABLE IF NOT EXISTS public.validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) NOT NULL,
  validator_user TEXT,
  validation_method TEXT NOT NULL,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  turnstile_id UUID,
  notes TEXT
);

-- Turnstiles table
CREATE TABLE IF NOT EXISTS public.turnstiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  ip_address INET,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnstiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public can view show_times" ON public.show_times FOR SELECT USING (true);
CREATE POLICY "Public can view event_sessions" ON public.event_sessions FOR SELECT USING (true);
CREATE POLICY "Public can view ticket_types" ON public.ticket_types FOR SELECT USING (true);

-- Customer access policies
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT USING (
  customer_email = current_setting('request.jwt.claims', true)::json->>'email'
);

CREATE POLICY "System can insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can view own order_items" ON public.order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE customer_email = current_setting('request.jwt.claims', true)::json->>'email'
  )
);

CREATE POLICY "System can manage tickets" ON public.tickets FOR ALL USING (true);
CREATE POLICY "Customers can view own tickets" ON public.tickets FOR SELECT USING (
  order_item_id IN (
    SELECT oi.id FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE o.customer_email = current_setting('request.jwt.claims', true)::json->>'email'
  )
);

-- Staff access policies
CREATE POLICY "Staff can manage validations" ON public.validations FOR ALL USING (true);
CREATE POLICY "Admin can manage turnstiles" ON public.turnstiles FOR ALL USING (true);

-- Create functions for automatic data generation
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

-- Create triggers
CREATE TRIGGER auto_generate_ticket_data_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_ticket_data();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_sessions_updated_at BEFORE UPDATE ON public.event_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_turnstiles_updated_at BEFORE UPDATE ON public.turnstiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data for Rua Iluminada 2025
INSERT INTO public.events (name, description, start_date, end_date) VALUES
('Rua Iluminada - Família Moletta 2025', 'Espetáculo natalino com 48 dias de magia, luzes e shows especiais para toda a família.', '2025-11-14', '2025-12-31')
ON CONFLICT DO NOTHING;

-- Get the event ID
DO $$
DECLARE
    event_uuid UUID;
BEGIN
    SELECT id INTO event_uuid FROM public.events WHERE name = 'Rua Iluminada - Família Moletta 2025' LIMIT 1;
    
    -- Insert show times
    INSERT INTO public.show_times (event_id, time_slot, capacity) VALUES
    (event_uuid, '19:00:00', 100),
    (event_uuid, '20:00:00', 100),
    (event_uuid, '21:00:00', 100),
    (event_uuid, '22:00:00', 100),
    (event_uuid, '23:00:00', 100),
    (event_uuid, '23:30:00', 100)
    ON CONFLICT DO NOTHING;
    
    -- Insert ticket types with correct prices
    INSERT INTO public.ticket_types (event_id, name, description, price) VALUES
    (event_uuid, 'Inteira', 'Ingresso padrão para o evento', 30.00),
    (event_uuid, 'Meia-entrada', 'Para estudantes, idosos e pessoas com deficiência', 15.00)
    ON CONFLICT DO NOTHING;
END $$;