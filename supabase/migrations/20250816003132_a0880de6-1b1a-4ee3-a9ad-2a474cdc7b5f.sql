-- FINAL SECURITY FIXES - Fix remaining database vulnerabilities

-- =============================================================================
-- FIX BRANDING_CONFIG TABLE - Needs proper policies
-- =============================================================================
-- Check if branding_config already has secure policies, if not create them
DO $$ 
DECLARE 
    pol_count INTEGER;
BEGIN
    -- Count existing policies for branding_config
    SELECT COUNT(*) INTO pol_count 
    FROM pg_policies 
    WHERE tablename = 'branding_config' 
    AND schemaname = 'public'
    AND roles = '{authenticated}';
    
    -- If no secure policies exist, drop all and create secure ones
    IF pol_count = 0 THEN
        -- Drop any existing policies
        DELETE FROM pg_policy WHERE polrelid = (SELECT oid FROM pg_class WHERE relname = 'branding_config');
        
        -- Create secure branding config policies
        EXECUTE 'CREATE POLICY "SecureBranding_AdminManage_v1" 
                ON public.branding_config 
                FOR ALL 
                TO authenticated
                USING (has_role(auth.uid(), ''admin''::app_role) OR has_role(auth.uid(), ''master''::app_role))
                WITH CHECK (has_role(auth.uid(), ''admin''::app_role) OR has_role(auth.uid(), ''master''::app_role))';
                
        EXECUTE 'CREATE POLICY "SecureBranding_PublicView_v1" 
                ON public.branding_config 
                FOR SELECT 
                TO authenticated
                USING (true)';
    END IF;
END $$;

-- =============================================================================
-- VERIFY PAYMENT_SETTINGS TABLE - Ensure complete security
-- =============================================================================
-- Double-check payment_settings has only admin access
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    -- Drop any policies that are not admin-only
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'payment_settings' 
        AND schemaname = 'public'
        AND (roles::text != '{authenticated}' OR 
             (qual IS NULL OR qual NOT LIKE '%has_role%admin%'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.payment_settings';
    END LOOP;
    
    -- Ensure the secure admin policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_settings' 
        AND policyname = 'Admins can manage payment_settings'
    ) THEN
        EXECUTE 'CREATE POLICY "Admins can manage payment_settings" 
                ON public.payment_settings 
                FOR ALL 
                TO authenticated
                USING (has_role(auth.uid(), ''admin''::app_role) OR has_role(auth.uid(), ''master''::app_role))
                WITH CHECK (has_role(auth.uid(), ''admin''::app_role) OR has_role(auth.uid(), ''master''::app_role))';
    END IF;
END $$;

-- =============================================================================
-- ADDITIONAL SECURITY HARDENING
-- =============================================================================
-- Ensure no public schema access by default for sensitive operations
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant only necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- Log this security hardening action
INSERT INTO public.user_audit_logs (
    user_id, 
    user_email, 
    action, 
    entity_type, 
    details
) VALUES (
    NULL,
    'system',
    'SECURITY_HARDENING',
    'DATABASE_SCHEMA',
    '{"action": "revoked_anon_access", "tables": "all_public_tables", "timestamp": "' || now() || '"}'
);