-- Fix search path for trigger_backup_now function
CREATE OR REPLACE FUNCTION public.trigger_backup_now()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_resp jsonb;
begin
  -- Invoke the Edge Function responsible for exporting backups
  select net.http_post(
    url := 'https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/backup-export',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := '{}'::jsonb
  ) into v_resp;
end;
$$;