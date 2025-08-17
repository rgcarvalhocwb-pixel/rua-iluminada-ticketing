-- Criar dados de teste para o validador de ingressos

-- Primeiro, vamos verificar e criar sessões de evento
DO $$
DECLARE
  event_id_var uuid;
  show_time_id_var uuid;
  session_id_var uuid;
  ticket_type_id_var uuid;
  order_id_var uuid;
  order_item_id_var uuid;
  i integer;
BEGIN
  -- Pegar o primeiro evento
  SELECT id INTO event_id_var FROM events LIMIT 1;
  
  -- Criar show_times se não existir
  INSERT INTO show_times (event_id, time_slot, capacity)
  VALUES 
    (event_id_var, '19:00:00', 100),
    (event_id_var, '21:00:00', 100)
  ON CONFLICT DO NOTHING;
  
  -- Pegar um show_time
  SELECT id INTO show_time_id_var FROM show_times WHERE event_id = event_id_var LIMIT 1;
  
  -- Criar event_sessions se não existir
  INSERT INTO event_sessions (event_id, show_time_id, session_date, capacity, available_tickets)
  VALUES 
    (event_id_var, show_time_id_var, CURRENT_DATE, 100, 80),
    (event_id_var, show_time_id_var, CURRENT_DATE + INTERVAL '1 day', 100, 90)
  ON CONFLICT DO NOTHING;
  
  -- Pegar uma sessão
  SELECT id INTO session_id_var FROM event_sessions WHERE event_id = event_id_var LIMIT 1;
  
  -- Pegar um tipo de ingresso
  SELECT id INTO ticket_type_id_var FROM ticket_types WHERE event_id = event_id_var LIMIT 1;
  
  -- Criar pedidos de teste com diferentes status
  FOR i IN 1..5 LOOP
    INSERT INTO orders (
      customer_name, 
      customer_email, 
      customer_cpf,
      session_id,
      total_amount,
      payment_status,
      payment_method
    ) VALUES (
      'Cliente Teste ' || i,
      'cliente' || i || '@teste.com',
      '123.456.789-0' || i,
      session_id_var,
      50.00,
      CASE 
        WHEN i <= 3 THEN 'paid'  -- 3 pedidos pagos
        WHEN i = 4 THEN 'pending'  -- 1 pedido pendente
        ELSE 'expired'  -- 1 pedido expirado
      END,
      'pagseguro'
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
      50.00,
      50.00
    ) RETURNING id INTO order_item_id_var;
    
    -- Criar ingressos apenas para pedidos pagos
    IF i <= 3 THEN
      INSERT INTO tickets (
        order_item_id,
        ticket_number,
        qr_code,
        status
      ) VALUES (
        order_item_id_var,
        'RI2024' || LPAD(i::text, 6, '0'),
        'QR_' || encode(gen_random_bytes(16), 'hex'),
        CASE 
          WHEN i = 1 THEN 'used'    -- 1 ingresso já usado
          ELSE 'valid'              -- 2 ingressos válidos
        END
      );
      
      -- Se o ingresso foi usado, criar registro de validação
      IF i = 1 THEN
        INSERT INTO validations (
          ticket_id,
          validation_method,
          validator_user,
          notes
        ) VALUES (
          (SELECT id FROM tickets WHERE order_item_id = order_item_id_var),
          'manual_entry',
          'admin_teste',
          'Validação de teste - ingresso usado'
        );
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Dados de teste criados com sucesso!';
END $$;