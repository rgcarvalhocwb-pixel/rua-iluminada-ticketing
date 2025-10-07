-- Atualizar evento "Rua Iluminada 2025" para integração com Compre no Zet
-- Mapear external_id e external_slug para aceitar webhooks independente da data

UPDATE events
SET 
  external_id = '1',
  external_slug = 'rua-iluminada-2024',
  updated_at = now()
WHERE id = '74a37605-e065-492f-ae66-9e805cb277ce';

-- Verificar atualização
SELECT id, name, external_id, external_slug, start_date, end_date 
FROM events 
WHERE id = '74a37605-e065-492f-ae66-9e805cb277ce';