-- ENSURE RLS IS ENABLED ON ALL SENSITIVE TABLES
-- Some tables may not have RLS enabled which allows public access

-- Check and enable RLS on all sensitive tables
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.daily_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnstiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

-- Ensure no anon access - drop any policies that might allow anon access
DO $$ 
DECLARE 
    tbl TEXT;
    pol RECORD;
BEGIN
    -- List of sensitive tables to secure
    FOR tbl IN VALUES ('payment_settings'), ('user_audit_logs'), ('user_permissions'), ('user_roles'), ('branding_config')
    LOOP
        -- Drop any policies that allow anon access
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public' AND roles::text LIKE '%anon%'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.' || tbl;
        END LOOP;
    END LOOP;
END $$;