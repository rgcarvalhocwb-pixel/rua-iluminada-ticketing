-- Adicionar campos de personalização de email à tabela branding_config
ALTER TABLE public.branding_config 
ADD COLUMN IF NOT EXISTS purchase_email_subject TEXT DEFAULT 'Confirmação da sua compra - Rua Iluminada',
ADD COLUMN IF NOT EXISTS purchase_email_template TEXT DEFAULT 'Olá {customer_name},

Obrigado pela sua compra! Seus ingressos estão prontos.

Detalhes da compra:
- Evento: {event_name}
- Data: {event_date}
- Horário: {event_time}
- Quantidade: {ticket_quantity}
- Total: {total_amount}

Seus ingressos estão em anexo com QR codes para entrada.

Atenciosamente,
Equipe Rua Iluminada',
ADD COLUMN IF NOT EXISTS welcome_email_subject TEXT DEFAULT 'Bem-vindo à Rua Iluminada!',
ADD COLUMN IF NOT EXISTS welcome_email_template TEXT DEFAULT 'Olá {customer_name},

Bem-vindo à Rua Iluminada!

Sua conta foi criada com sucesso. Agora você pode:
- Comprar ingressos online
- Acompanhar seus pedidos
- Receber promoções exclusivas

Para qualquer dúvida, entre em contato conosco.

Atenciosamente,
Equipe Rua Iluminada';

-- Inserir configuração padrão se não existir
INSERT INTO public.branding_config (id, company_name, primary_color, secondary_color)
SELECT gen_random_uuid(), 'Rua Iluminada', '#DC2626', '#EAB308'
WHERE NOT EXISTS (SELECT 1 FROM public.branding_config);