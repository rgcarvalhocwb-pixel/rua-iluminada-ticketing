-- Create a function to check if user has terminal role
CREATE OR REPLACE FUNCTION public.is_terminal_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'terminal'
      AND status = 'approved'
      AND account_status = 'active'
  )
$$;

-- Update RLS policies to allow terminal users to access necessary data

-- Allow terminal users to create and manage event sessions
CREATE POLICY "Terminal users can manage event_sessions" 
ON public.event_sessions 
FOR ALL 
USING (is_terminal_user(auth.uid()) OR auth.role() = 'authenticated'::text)
WITH CHECK (is_terminal_user(auth.uid()) OR auth.role() = 'authenticated'::text);

-- Allow terminal users to create orders
CREATE POLICY "Terminal users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (is_terminal_user(auth.uid()) OR true);

-- Allow terminal users to view orders
CREATE POLICY "Terminal users can view orders" 
ON public.orders 
FOR SELECT 
USING (is_terminal_user(auth.uid()) OR true);

-- Allow terminal users to update orders
CREATE POLICY "Terminal users can update orders" 
ON public.orders 
FOR UPDATE 
USING (is_terminal_user(auth.uid()) OR auth.role() = 'authenticated'::text);

-- Allow terminal users to create order items
CREATE POLICY "Terminal users can create order_items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (is_terminal_user(auth.uid()) OR true);

-- Allow terminal users to create tickets
CREATE POLICY "Terminal users can create tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (is_terminal_user(auth.uid()) OR true);

-- Allow terminal users to view tickets
CREATE POLICY "Terminal users can view tickets" 
ON public.tickets 
FOR SELECT 
USING (is_terminal_user(auth.uid()) OR true);

-- Allow terminal users to update tickets
CREATE POLICY "Terminal users can update tickets" 
ON public.tickets 
FOR UPDATE 
USING (is_terminal_user(auth.uid()) OR true);