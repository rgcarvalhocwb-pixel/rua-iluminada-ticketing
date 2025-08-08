-- 1) Add columns to online_transfers
ALTER TABLE public.online_transfers
  ADD COLUMN IF NOT EXISTS event_id uuid,
  ADD COLUMN IF NOT EXISTS received_date date;

-- 2) Add foreign key to events (nullable to preserve existing data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'online_transfers_event_id_fkey'
  ) THEN
    ALTER TABLE public.online_transfers
      ADD CONSTRAINT online_transfers_event_id_fkey
      FOREIGN KEY (event_id) REFERENCES public.events (id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_online_transfers_received_date ON public.online_transfers (received_date);
CREATE INDEX IF NOT EXISTS idx_online_transfers_event_id ON public.online_transfers (event_id);

-- 4) Keep updated_at fresh on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_online_transfers_updated_at'
  ) THEN
    CREATE TRIGGER update_online_transfers_updated_at
    BEFORE UPDATE ON public.online_transfers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 5) Backfill received_date for already received transfers
UPDATE public.online_transfers
SET received_date = transfer_date
WHERE status = 'received' AND received_amount IS NOT NULL AND received_date IS NULL;