-- Remover políticas antigas da tabela order_items
DROP POLICY IF EXISTS "Customers can view own order_items" ON public.order_items;
DROP POLICY IF EXISTS "System can insert order_items" ON public.order_items;

-- Criar novas políticas mais permissivas para order_items
CREATE POLICY "Anyone can create order_items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view order_items" 
ON public.order_items 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can update order_items" 
ON public.order_items 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete order_items" 
ON public.order_items 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);