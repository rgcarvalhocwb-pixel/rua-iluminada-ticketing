-- COMPLETE SECURITY OVERHAUL: Drop ALL existing policies and create secure ones
-- Clear everything and start fresh with proper authentication

-- =============================================================================
-- ORDERS TABLE - Complete policy reset
-- =============================================================================
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.orders';
    END LOOP;
END $$;

-- Create new secure orders policies
CREATE POLICY "SecureOrders_AdminView_v1" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "SecureOrders_AdminInsert_v1" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "SecureOrders_AdminUpdate_v1" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "SecureOrders_AdminDelete_v1" 
ON public.orders 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "SecureOrders_TerminalInsert_v1" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (is_terminal_user(auth.uid()) AND (created_by = auth.uid()));

CREATE POLICY "SecureOrders_TerminalUpdate_v1" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (is_terminal_user(auth.uid()) AND (created_by = auth.uid()))
WITH CHECK (is_terminal_user(auth.uid()) AND (created_by = auth.uid()));

CREATE POLICY "SecureOrders_TerminalView_v1" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (is_terminal_user(auth.uid()) AND (created_by = auth.uid()));

CREATE POLICY "SecureOrders_CustomerView_v1" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (customer_email = (auth.jwt() ->> 'email'::text));

-- =============================================================================
-- PROFILES TABLE - Complete policy reset
-- =============================================================================
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Create new secure profiles policies
CREATE POLICY "SecureProfiles_AdminManage_v1" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "SecureProfiles_UserView_v1" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "SecureProfiles_UserInsert_v1" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "SecureProfiles_UserUpdate_v1" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);