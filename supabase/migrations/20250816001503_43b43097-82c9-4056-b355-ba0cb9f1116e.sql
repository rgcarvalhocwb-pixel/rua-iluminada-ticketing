-- Fix payment_settings security vulnerability
-- Drop the policy that allows approved users to view payment settings
DROP POLICY IF EXISTS "Approved users can view payment_settings" ON public.payment_settings;

-- Ensure only the admin policy exists for complete access control
-- This policy already exists but let's make sure it's properly defined
DROP POLICY IF EXISTS "Admins can manage payment_settings" ON public.payment_settings;

CREATE POLICY "Admins can manage payment_settings" 
ON public.payment_settings 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));