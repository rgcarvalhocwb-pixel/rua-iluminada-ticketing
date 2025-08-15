-- CRITICAL SECURITY FIX: Remove overly permissive RLS policies on orders table
-- Current policies allow anyone to read customer personal data (names, emails, CPF)

-- Drop the dangerous policies that allow public access
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Terminal users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Terminal users can view orders" ON public.orders;

-- Create secure policies for orders table
-- Only authenticated users with proper roles can access orders

-- Allow authenticated admin/terminal users to create orders
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR
  is_terminal_user(auth.uid())
);

-- Allow authenticated admin/terminal users to view orders
CREATE POLICY "Authenticated users can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR
  is_terminal_user(auth.uid())
);

-- Allow authenticated admin/terminal users to update orders
CREATE POLICY "Authenticated users can update orders"
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
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);