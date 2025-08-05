-- Adicionar campo para controlar status de pagamento das comissões
ALTER TABLE store_daily_sales 
ADD COLUMN commission_paid BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar performance nas consultas de comissões pendentes
CREATE INDEX idx_store_daily_sales_commission_paid 
ON store_daily_sales(commission_paid, sale_date);