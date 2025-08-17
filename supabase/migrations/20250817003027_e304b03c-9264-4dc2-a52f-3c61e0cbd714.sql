-- Adicionar mais dados de teste para o validador offline
DO $$
DECLARE
  event_id_var uuid;
  show_time_id_var uuid;
  session_id_var uuid;
  ticket_type_id_var uuid;
  order_id_var uuid;
  order_item_id_var uuid;
  i integer;
  customer_names text[] := ARRAY[
    'Maria Silva Santos', 'João Pedro Oliveira', 'Ana Carolina Ferreira', 
    'Carlos Eduardo Lima', 'Fernanda Costa Alves', 'Roberto Mendes Souza',
    'Patricia Rodrigues', 'Lucas Gabriel Martins', 'Camila Barbosa',
    'Eduardo Santos Pereira', 'Juliana Almeida', 'Rafael Henrique Costa'
  ];
  customer_emails text[] := ARRAY[
    'maria.silva@email.com', 'joao.pedro@email.com', 'ana.carolina@email.com',
    'carlos.eduardo@email.com', 'fernanda.costa@email.com', 'roberto.mendes@email.com',
    'patricia.rodrigues@email.com', 'lucas.gabriel@email.com', 'camila.barbosa@email.com',
    'eduardo.santos@email.com', 'juliana.almeida@email.com', 'rafael.henrique@email.com'
  ];
  ticket_prices numeric[] := ARRAY[50.00, 75.00, 100.00];
BEGIN
  -- Pegar o primeiro evento
  SELECT id INTO event_id_var FROM events LIMIT 1;
  
  -- Pegar um show_time
  SELECT id INTO show_time_id_var FROM show_times WHERE event_id = event_id_var LIMIT 1;
  
  -- Pegar uma sessão de hoje
  SELECT id INTO session_id_var FROM event_sessions 
  WHERE event_id = event_id_var AND session_date = CURRENT_DATE LIMIT 1;
  
  -- Se não existe sessão de hoje, criar uma
  IF session_id_var IS NULL THEN
    INSERT INTO event_sessions (event_id, show_time_id, session_date, capacity, available_tickets)
    VALUES (event_id_var, show_time_id_var, CURRENT_DATE, 150, 100)
    RETURNING id INTO session_id_var;
  END IF;
  
  -- Pegar tipos de ingresso
  SELECT id INTO ticket_type_id_var FROM ticket_types WHERE event_id = event_id_var LIMIT 1;
  
  -- Criar 12 pedidos com nomes diferentes
  FOR i IN 1..12 LOOP
    INSERT INTO orders (
      customer_name, 
      customer_email, 
      customer_cpf,
      session_id,
      total_amount,
      payment_status,
      payment_method
    ) VALUES (
      customer_names[i],
      customer_emails[i],
      '123.456.789-' || LPAD(i::text, 2, '0'),
      session_id_var,
      ticket_prices[((i-1) % 3) + 1],
      'paid',
      CASE 
        WHEN i % 3 = 1 THEN 'pagseguro'
        WHEN i % 3 = 2 THEN 'pix'
        ELSE 'dinheiro'
      END
    ) RETURNING id INTO order_id_var;
    
    -- Criar item do pedido
    INSERT INTO order_items (
      order_id,
      ticket_type_id,
      quantity,
      unit_price,
      subtotal
    ) VALUES (
      order_id_var,
      ticket_type_id_var,
      1,
      ticket_prices[((i-1) % 3) + 1],
      ticket_prices[((i-1) % 3) + 1]
    ) RETURNING id INTO order_item_id_var;
    
    -- Criar ingressos
    INSERT INTO tickets (
      order_item_id,
      ticket_number,
      qr_code,
      status
    ) VALUES (
      order_item_id_var,
      'RI2024' || LPAD((1000 + i)::text, 6, '0'),
      'QR_' || CURRENT_DATE || '_' || i || '_' || encode(gen_random_bytes(8), 'hex'),
      CASE 
        WHEN i <= 3 THEN 'used'    -- Alguns já usados
        ELSE 'valid'               -- Maioria válidos
      END
    );
    
    -- Marcar alguns como validados (simular uso anterior)
    IF i <= 3 THEN
      UPDATE tickets 
      SET used_at = CURRENT_TIMESTAMP - (i || ' hours')::interval,
          validated_by = 'terminal_' || i
      WHERE order_item_id = order_item_id_var;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Dados de teste expandidos criados - % novos ingressos para hoje!', 12;
END $$;