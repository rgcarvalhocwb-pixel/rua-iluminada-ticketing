-- Limpar logs de webhook com erro das transações de teste
DELETE FROM public.webhook_logs
WHERE processed = false 
  AND processing_error IS NOT NULL
  AND source = 'comprenozet'
  AND created_at >= NOW() - INTERVAL '24 hours';