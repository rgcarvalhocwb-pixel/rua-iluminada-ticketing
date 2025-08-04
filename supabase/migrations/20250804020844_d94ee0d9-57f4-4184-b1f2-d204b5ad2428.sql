-- Adicionar políticas de admin para permitir CRUD completo de eventos
CREATE POLICY "Authenticated users can manage events" 
ON public.events 
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Adicionar políticas de admin para permitir CRUD completo de tipos de ingresso
CREATE POLICY "Authenticated users can manage ticket_types" 
ON public.ticket_types 
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Adicionar políticas de admin para permitir CRUD completo de horários
CREATE POLICY "Authenticated users can manage show_times" 
ON public.show_times 
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Adicionar políticas de admin para permitir CRUD completo de sessões de evento
CREATE POLICY "Authenticated users can manage event_sessions" 
ON public.event_sessions 
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');