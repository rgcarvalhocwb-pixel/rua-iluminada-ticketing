-- CRITICAL SECURITY FIXES - Phase 1: Infrastructure Security
-- Handle existing policies more carefully

-- =============================================================================
-- 1. SECURE TURNSTILES TABLE - Drop all existing policies first
-- =============================================================================
DROP POLICY IF EXISTS "Admin can manage turnstiles" ON public.turnstiles;
DROP POLICY IF EXISTS "Admins can view turnstiles" ON public.turnstiles;
DROP POLICY IF EXISTS "Admins can create turnstiles" ON public.turnstiles;
DROP POLICY IF EXISTS "Admins can update turnstiles" ON public.turnstiles;
DROP POLICY IF EXISTS "Admins can delete turnstiles" ON public.turnstiles;

-- Create secure turnstiles policies
CREATE POLICY "Secure turnstiles view policy" 
ON public.turnstiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Secure turnstiles insert policy" 
ON public.turnstiles 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Secure turnstiles update policy" 
ON public.turnstiles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Secure turnstiles delete policy" 
ON public.turnstiles 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));