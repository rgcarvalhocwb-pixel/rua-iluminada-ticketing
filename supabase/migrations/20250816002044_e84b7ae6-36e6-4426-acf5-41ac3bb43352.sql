-- CRITICAL SECURITY FIX: Remove public access to sensitive tables
-- The issue is policies are using "public" role instead of "authenticated"

-- =============================================================================
-- FIX ORDERS TABLE - Remove public access
-- =============================================================================
DROP POLICY IF EXISTS "Admins can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Terminal users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Terminal users can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Terminal users can view their created orders" ON public.orders;

-- Create secure orders policies (authenticated only)
CREATE POLICY "Secure admin view orders policy" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Secure admin insert orders policy" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Secure admin update orders policy" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Secure admin delete orders policy" 
ON public.orders 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Secure terminal insert orders policy" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (is_terminal_user(auth.uid()) AND (created_by = auth.uid()));

CREATE POLICY "Secure terminal update orders policy" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (is_terminal_user(auth.uid()) AND (created_by = auth.uid()))
WITH CHECK (is_terminal_user(auth.uid()) AND (created_by = auth.uid()));

CREATE POLICY "Secure terminal view orders policy" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (is_terminal_user(auth.uid()) AND (created_by = auth.uid()));

CREATE POLICY "Secure customer view orders policy" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (customer_email = (auth.jwt() ->> 'email'::text));

-- =============================================================================
-- FIX PROFILES TABLE - Remove public access
-- =============================================================================
DROP POLICY IF EXISTS "Admins and masters can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and masters can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create secure profiles policies (authenticated only)
CREATE POLICY "Secure admin manage profiles policy" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Secure user view own profile policy" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Secure user insert own profile policy" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Secure user update own profile policy" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);