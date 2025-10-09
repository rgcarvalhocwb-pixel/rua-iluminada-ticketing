-- Adicionar evento de teste "Teste rua iluminada" para integração Compre no Zet
INSERT INTO public.events (
  name,
  description,
  start_date,
  end_date,
  external_id,
  external_slug,
  is_test_data
) VALUES (
  'Teste rua iluminada',
  'Evento de teste para validar integração com Compre no Zet',
  '2024-12-01',
  '2024-12-31',
  '355',
  'teste-rua-iluminada',
  true
)
ON CONFLICT DO NOTHING;