-- Create branding configuration table
CREATE TABLE IF NOT EXISTS public.branding_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#9333ea',
  secondary_color TEXT NOT NULL DEFAULT '#7c3aed', 
  company_name TEXT NOT NULL DEFAULT 'Rua Iluminada',
  company_description TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_whatsapp TEXT,
  email_footer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.branding_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage branding config" 
ON public.branding_config 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Brand assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'brand-assets');

CREATE POLICY "Admins can upload brand assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update brand assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for timestamps
CREATE TRIGGER update_branding_config_updated_at
BEFORE UPDATE ON public.branding_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();