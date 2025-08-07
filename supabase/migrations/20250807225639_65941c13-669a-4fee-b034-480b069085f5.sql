-- Atualizar todos os pedidos pendentes para expirados se foram criados há mais de 30 minutos
UPDATE orders 
SET payment_status = 'expired', updated_at = now()
WHERE payment_status = 'pending' 
AND created_at < (now() - interval '30 minutes');

-- Deletar todos os pedidos pendentes restantes
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders WHERE payment_status = 'pending'
);

DELETE FROM orders 
WHERE payment_status = 'pending';

-- Criar função para expirar pedidos automaticamente
CREATE OR REPLACE FUNCTION public.expire_old_pending_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Atualizar pedidos pendentes que passaram de 30 minutos para expirados
  UPDATE orders 
  SET payment_status = 'expired', updated_at = now()
  WHERE payment_status = 'pending' 
  AND created_at < (now() - interval '30 minutes');
END;
$function$;