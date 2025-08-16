-- FINAL SECURITY FIXES - Simple approach to fix remaining vulnerabilities

-- =============================================================================
-- SECURE BRANDING_CONFIG TABLE
-- =============================================================================
-- Drop existing branding_config policies and create secure ones
DROP POLICY IF EXISTS "Admins can manage branding config" ON public.branding_config;

-- Create admin-only management policy for branding_config
CREATE POLICY "SecureBranding_AdminOnly_v1" 
ON public.branding_config 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- Allow authenticated users to view branding config for frontend display
CREATE POLICY "SecureBranding_AuthView_v1" 
ON public.branding_config 
FOR SELECT 
TO authenticated
USING (true);

-- =============================================================================
-- REVOKE ANONYMOUS ACCESS TO PREVENT DATA EXPOSURE  
-- =============================================================================
-- Revoke all anonymous access to prevent any data leaks
-- Note: This is a critical security measure
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Grant necessary public access only to tables that should be publicly accessible
-- (these are typically read-only tables for public website content)
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.show_times TO anon;
GRANT SELECT ON public.ticket_types TO anon;
GRANT SELECT ON public.event_sessions TO anon;

-- Explicitly ensure authenticated users can access what they need
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;