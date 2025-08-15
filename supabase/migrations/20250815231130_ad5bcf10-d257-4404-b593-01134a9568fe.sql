-- CRITICAL SECURITY FIX: Remove dangerous public access to imported_sales table
-- This table contains sensitive financial data that must be protected

-- Drop the dangerous policies that allow public access to financial data
DROP POLICY IF EXISTS "Users can view imported sales" ON public.imported_sales;
DROP POLICY IF EXISTS "Users can insert imported sales" ON public.imported_sales;

-- Create secure policies for imported_sales table
-- Only authenticated users with appropriate roles should access financial data

-- Allow only authenticated admin/master users to view financial data
CREATE POLICY "Secure view imported_sales policy"
ON public.imported_sales
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);

-- Allow only authenticated admin/master users to insert financial data
-- This is typically done by edge functions or admin operations
CREATE POLICY "Secure insert imported_sales policy"
ON public.imported_sales
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);

-- Allow only admins and masters to update financial data
CREATE POLICY "Secure update imported_sales policy"
ON public.imported_sales
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);

-- Allow only admins and masters to delete financial data
CREATE POLICY "Secure delete imported_sales policy"
ON public.imported_sales
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);