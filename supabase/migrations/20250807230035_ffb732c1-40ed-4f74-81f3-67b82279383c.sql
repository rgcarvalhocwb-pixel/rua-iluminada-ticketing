-- 1) Permitir status 'expired' na tabela orders
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_schema = 'public' AND table_name = 'orders' AND constraint_name = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_payment_status_check;
  END IF;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending','paid','cancelled','expired'));

-- 2) Excluir todos os pedidos pendentes atuais e dados relacionados
-- Apagar tickets ligados aos itens de pedidos pendentes (se existirem)
DELETE FROM public.tickets t
USING public.order_items oi, public.orders o
WHERE t.order_item_id = oi.id
  AND oi.order_id = o.id
  AND o.payment_status = 'pending';

-- Apagar itens de pedidos pendentes
DELETE FROM public.order_items oi
USING public.orders o
WHERE oi.order_id = o.id
  AND o.payment_status = 'pending';

-- Apagar os pedidos pendentes
DELETE FROM public.orders
WHERE payment_status = 'pending';

-- 3) Função auxiliar (opcional) para expirar pendentes com mais de 30 min
CREATE OR REPLACE FUNCTION public.expire_old_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.orders
  SET payment_status = 'expired', updated_at = now()
  WHERE payment_status = 'pending'
    AND created_at < (now() - interval '30 minutes');
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$;

-- 4) Habilitar extensões necessárias para agendamento
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 5) Agendar execução da Edge Function a cada 5 minutos
-- Remove job anterior com o mesmo nome, se existir (ignora erros)
DO $$ BEGIN
  PERFORM cron.unschedule('expire-pending-orders-every-5-min');
EXCEPTION WHEN OTHERS THEN
  -- ignora se não existir
  NULL;
END $$;

SELECT cron.schedule(
  'expire-pending-orders-every-5-min',
  '*/5 * * * *',
  $$
  select
    net.http_post(
      url:='https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/expire-pending-orders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cXJpb2h5ZmF6ZnRmdWx3Y3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNjcwNDAsImV4cCI6MjA2OTY0MzA0MH0.Zj8e5s0rZCHxJEkqpxMzHDEO-doBkiwzi7ErLHl9F28"}'::jsonb,
      body:='{}'::jsonb
    );
  $$
);
