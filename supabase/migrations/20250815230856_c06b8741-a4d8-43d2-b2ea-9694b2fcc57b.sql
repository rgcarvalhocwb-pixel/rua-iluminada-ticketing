-- CRITICAL SECURITY FIX: Remove ALL existing RLS policies on orders table
-- Current policies allow anyone to read customer personal data (names, emails, CPF)

-- Drop ALL existing policies on orders table
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Terminal users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Terminal users can view orders" ON public.orders;
DROP POLICY IF EXISTS "Terminal users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;

-- Create secure policies for orders table
-- Only authenticated users with proper roles can access orders

-- Allow authenticated admin/terminal users to create orders
CREATE POLICY "Secure create orders policy"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR
  is_terminal_user(auth.uid())
);

-- Allow authenticated admin/terminal users to view orders
CREATE POLICY "Secure view orders policy"
ON public.orders
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR
  is_terminal_user(auth.uid())
);

-- Allow authenticated admin/terminal users to update orders
CREATE POLICY "Secure update orders policy"
ON public.orders
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

-- Allow only admins and masters to delete orders (not terminal users)
CREATE POLICY "Secure delete orders policy"
ON public.orders
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);