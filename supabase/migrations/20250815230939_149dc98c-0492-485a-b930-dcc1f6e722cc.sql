-- CRITICAL SECURITY FIX: Fix dangerous RLS policies in order_items and tickets tables
-- These tables contain sensitive order and ticket information that should be protected

-- FIX ORDER_ITEMS TABLE
-- Drop dangerous policies that allow public access
DROP POLICY IF EXISTS "Anyone can create order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can view order_items" ON public.order_items;
DROP POLICY IF EXISTS "Terminal users can create order_items" ON public.order_items;

-- Create secure policies for order_items
CREATE POLICY "Secure create order_items policy"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR
  is_terminal_user(auth.uid())
);

CREATE POLICY "Secure view order_items policy"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR
  is_terminal_user(auth.uid())
);

-- FIX TICKETS TABLE
-- Drop dangerous policies
DROP POLICY IF EXISTS "System can manage tickets" ON public.tickets;
DROP POLICY IF EXISTS "Terminal users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Terminal users can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Terminal users can view tickets" ON public.tickets;

-- Create secure policies for tickets
CREATE POLICY "Secure create tickets policy"
ON public.tickets
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR
  is_terminal_user(auth.uid())
);

CREATE POLICY "Secure view tickets policy"
ON public.tickets
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR
  is_terminal_user(auth.uid())
);

CREATE POLICY "Secure update tickets policy"
ON public.tickets
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR
  is_terminal_user(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR
  is_terminal_user(auth.uid())
);

-- Keep the existing customer policy for viewing their own tickets (this one is secure)
-- "Customers can view own tickets" - already properly restricted by customer email