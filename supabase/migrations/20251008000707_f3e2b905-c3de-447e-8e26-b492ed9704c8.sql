-- Corrigir constraint para permitir status 'refunded' nos pedidos
-- Isso permite processar estornos do Compre no Zet

-- Remover constraint antigo
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- Adicionar constraint com 'refunded' incluído
ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'expired', 'refunded'));