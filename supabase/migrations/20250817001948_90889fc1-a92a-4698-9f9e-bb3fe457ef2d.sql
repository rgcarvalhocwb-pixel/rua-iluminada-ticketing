-- Criar dados de teste básicos para o validador
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
  
  -- Verificar se já existem show_times
  SELECT id INTO show_time_id_var FROM show_times WHERE event_id = event_id_var LIMIT 1;
  
  -- Se não existe, criar show_times
  IF show_time_id_var IS NULL THEN
    INSERT INTO show_times (event_id, time_slot, capacity)
    VALUES (event_id_var, '19:00:00', 100)
    RETURNING id INTO show_time_id_var;
  END IF;
  
  -- Verificar se já existem event_sessions
  SELECT id INTO session_id_var FROM event_sessions WHERE event_id = event_id_var LIMIT 1;
  
  -- Se não existe, criar event_sessions
  IF session_id_var IS NULL THEN
    INSERT INTO event_sessions (event_id, show_time_id, session_date, capacity, available_tickets)
    VALUES (event_id_var, show_time_id_var, CURRENT_DATE, 100, 80)
    RETURNING id INTO session_id_var;
  END IF;
  
  -- Pegar um tipo de ingresso
  SELECT id INTO ticket_type_id_var FROM ticket_types WHERE event_id = event_id_var LIMIT 1;
  
  -- Criar apenas pedidos e ingressos de teste (sem validações por enquanto)
  FOR i IN 1..3 LOOP
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
      '12345678900',
      session_id_var,
      50.00,
      'paid',
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
    
    -- Criar ingressos
    INSERT INTO tickets (
      order_item_id,
      ticket_number,
      qr_code,
      status
    ) VALUES (
      order_item_id_var,
      'RI2024' || LPAD(i::text, 6, '0'),
      'QR_TEST_' || i || '_' || encode(gen_random_bytes(8), 'hex'),
      CASE 
        WHEN i = 1 THEN 'used'    
        ELSE 'valid'              
      END
    );
  END LOOP;
  
  RAISE NOTICE 'Dados de teste básicos criados com sucesso!';
END $$;