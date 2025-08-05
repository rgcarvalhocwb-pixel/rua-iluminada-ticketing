-- Adicionar foreign keys que estão faltando
ALTER TABLE store_daily_sales 
ADD CONSTRAINT fk_store_daily_sales_store 
FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

ALTER TABLE store_daily_sales 
ADD CONSTRAINT fk_store_daily_sales_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;