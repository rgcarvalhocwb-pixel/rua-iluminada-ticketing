-- Create webhook_logs table for complete audit trail
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'comprenozet',
  action TEXT NOT NULL,
  reference TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_webhook_logs_reference ON public.webhook_logs(reference);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_processed ON public.webhook_logs(processed);
CREATE INDEX idx_webhook_logs_order_id ON public.webhook_logs(order_id);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all webhook logs
CREATE POLICY "Admins can view webhook_logs"
ON public.webhook_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- System can insert webhook logs (used by edge function)
CREATE POLICY "System can insert webhook_logs"
ON public.webhook_logs
FOR INSERT
WITH CHECK (true);

-- System can update webhook logs
CREATE POLICY "System can update webhook_logs"
ON public.webhook_logs
FOR UPDATE
USING (true);

-- Admins can delete old logs
CREATE POLICY "Admins can delete webhook_logs"
ON public.webhook_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));