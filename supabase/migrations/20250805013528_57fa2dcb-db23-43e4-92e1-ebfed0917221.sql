-- Remover políticas antigas da tabela event_sessions
DROP POLICY IF EXISTS "Authenticated users can manage event_sessions" ON public.event_sessions;
DROP POLICY IF EXISTS "Public can view event_sessions" ON public.event_sessions;

-- Criar novas políticas mais permissivas
CREATE POLICY "Anyone can view event_sessions" 
ON public.event_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create event_sessions" 
ON public.event_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update event_sessions" 
ON public.event_sessions 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete event_sessions" 
ON public.event_sessions 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);