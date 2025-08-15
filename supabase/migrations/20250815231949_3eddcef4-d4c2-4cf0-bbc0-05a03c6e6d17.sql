-- Add created_by field to track which user created the order
ALTER TABLE public.orders ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Secure view orders policy" ON public.orders;
DROP POLICY IF EXISTS "Secure create orders policy" ON public.orders;
DROP POLICY IF EXISTS "Secure update orders policy" ON public.orders;
DROP POLICY IF EXISTS "Secure delete orders policy" ON public.orders;

-- Create granular RLS policies for orders table
-- Customers can view their own orders
CREATE POLICY "Customers can view their own orders" 
ON public.orders 
FOR SELECT 
USING (
  customer_email = (auth.jwt() ->> 'email')::text
);

-- Terminal users can view orders they created
CREATE POLICY "Terminal users can view their created orders" 
ON public.orders 
FOR SELECT 
USING (
  is_terminal_user(auth.uid()) AND created_by = auth.uid()
);

-- Admins and masters can view all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role)
);

-- Terminal users can create orders (created_by will be set automatically)
CREATE POLICY "Terminal users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  is_terminal_user(auth.uid()) AND created_by = auth.uid()
);

-- Admins and masters can create orders
CREATE POLICY "Admins can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role)
);

-- Terminal users can update orders they created
CREATE POLICY "Terminal users can update their orders" 
ON public.orders 
FOR UPDATE 
USING (
  is_terminal_user(auth.uid()) AND created_by = auth.uid()
)
WITH CHECK (
  is_terminal_user(auth.uid()) AND created_by = auth.uid()
);

-- Admins and masters can update all orders
CREATE POLICY "Admins can update all orders" 
ON public.orders 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role)
);

-- Only admins and masters can delete orders
CREATE POLICY "Only admins can delete orders" 
ON public.orders 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role)
);

-- Create function to automatically set created_by on insert
CREATE OR REPLACE FUNCTION public.set_order_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set created_by
CREATE TRIGGER set_order_created_by_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_created_by();