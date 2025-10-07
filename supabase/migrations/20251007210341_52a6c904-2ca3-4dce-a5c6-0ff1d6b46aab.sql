-- Add external mapping columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS external_id varchar(255),
ADD COLUMN IF NOT EXISTS external_slug varchar(255);

-- Add ticket holder information columns to tickets table
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS external_voucher varchar(255),
ADD COLUMN IF NOT EXISTS ticket_holder_name text,
ADD COLUMN IF NOT EXISTS ticket_holder_email text,
ADD COLUMN IF NOT EXISTS ticket_holder_cpf varchar(14);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_external_id ON public.events(external_id);
CREATE INDEX IF NOT EXISTS idx_events_external_slug ON public.events(external_slug);
CREATE INDEX IF NOT EXISTS idx_tickets_external_voucher ON public.tickets(external_voucher);
CREATE INDEX IF NOT EXISTS idx_imported_sales_reference ON public.imported_sales(reference);

-- Add comment to document the purpose
COMMENT ON COLUMN public.events.external_id IS 'External ID from third-party platforms like Compre no Zet';
COMMENT ON COLUMN public.events.external_slug IS 'External slug from third-party platforms like Compre no Zet';
COMMENT ON COLUMN public.tickets.external_voucher IS 'External voucher/ticket code from third-party platforms';
COMMENT ON COLUMN public.tickets.ticket_holder_name IS 'Name of the ticket holder (may differ from order customer)';
COMMENT ON COLUMN public.tickets.ticket_holder_email IS 'Email of the ticket holder';
COMMENT ON COLUMN public.tickets.ticket_holder_cpf IS 'CPF of the ticket holder';