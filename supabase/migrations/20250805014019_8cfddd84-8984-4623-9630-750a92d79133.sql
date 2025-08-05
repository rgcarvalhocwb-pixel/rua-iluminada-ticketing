-- Adicionar campos para controle de visibilidade e ordenação dos tipos de ingresso
ALTER TABLE public.ticket_types 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;