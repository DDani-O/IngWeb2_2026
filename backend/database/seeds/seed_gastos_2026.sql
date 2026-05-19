-- =============================================================================
-- SEED: Gastos de prueba 2026 (Enero–Mayo)
-- PROYECTO: FinTrack 2026
--
-- INSTRUCCIONES:
--   1. Ir a Supabase → SQL Editor
--   2. Reemplazar '<TU_USER_ID>' con el UUID real del cliente
--      (lo encontrás en Authentication → Users, o en la tabla public.usuarios)
--   3. Ejecutar el script
-- =============================================================================

DO $$
DECLARE
  v_cliente uuid := '<TU_USER_ID>';  -- ← REEMPLAZÁ ESTO

  -- IDs de categorías (se resuelven por nombre)
  cat_alim    uuid;
  cat_trans   uuid;
  cat_entret  uuid;
  cat_salud   uuid;
  cat_educ    uuid;
  cat_hogar   uuid;
  cat_serv    uuid;
  cat_suscr   uuid;
  cat_otros   uuid;
BEGIN
  SELECT id INTO cat_alim   FROM public.categorias_de_gasto WHERE nombre = 'Alimentación';
  SELECT id INTO cat_trans  FROM public.categorias_de_gasto WHERE nombre = 'Transporte';
  SELECT id INTO cat_entret FROM public.categorias_de_gasto WHERE nombre = 'Entretenimiento';
  SELECT id INTO cat_salud  FROM public.categorias_de_gasto WHERE nombre = 'Salud';
  SELECT id INTO cat_educ   FROM public.categorias_de_gasto WHERE nombre = 'Educación';
  SELECT id INTO cat_hogar  FROM public.categorias_de_gasto WHERE nombre = 'Hogar';
  SELECT id INTO cat_serv   FROM public.categorias_de_gasto WHERE nombre = 'Servicios';
  SELECT id INTO cat_suscr  FROM public.categorias_de_gasto WHERE nombre = 'Suscripciones';
  SELECT id INTO cat_otros  FROM public.categorias_de_gasto WHERE nombre = 'Otros';

  INSERT INTO public.gastos (cliente_id, categoria_id, comercio, fecha_gasto, monto, origen, moneda)
  VALUES
    -- ── ENERO 2026 ──────────────────────────────────────────────────────────
    (v_cliente, cat_alim,   'Carrefour',           '2026-01-03',  12400.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'SUBE',                '2026-01-05',    950.00, 'manual', 'ARS'),
    (v_cliente, cat_suscr,  'Netflix',             '2026-01-06',   7900.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Rappi',               '2026-01-09',   9200.00, 'manual', 'ARS'),
    (v_cliente, cat_hogar,  'Easy',                '2026-01-11',  34500.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'YPF',                 '2026-01-13',  28000.00, 'manual', 'ARS'),
    (v_cliente, cat_salud,  'Farmacity',           '2026-01-15',  11800.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Disco',               '2026-01-17',   7300.00, 'manual', 'ARS'),
    (v_cliente, cat_entret, 'Cine Hoyts',          '2026-01-19',   8500.00, 'manual', 'ARS'),
    (v_cliente, cat_serv,   'Edenor',              '2026-01-22',  19600.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Mercado Libre',       '2026-01-24',  15200.00, 'manual', 'ARS'),
    (v_cliente, cat_suscr,  'Spotify',             '2026-01-26',   4500.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'Cabify',              '2026-01-28',   5800.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'La Anonima',          '2026-01-30',   9100.00, 'manual', 'ARS'),

    -- ── FEBRERO 2026 ─────────────────────────────────────────────────────────
    (v_cliente, cat_serv,   'Metrogas',            '2026-02-02',  22300.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Coto',                '2026-02-04',  10800.00, 'manual', 'ARS'),
    (v_cliente, cat_entret, 'Booking.com',         '2026-02-06',  95000.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'Aerolíneas',          '2026-02-07', 180000.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Rappi',               '2026-02-10',   8700.00, 'manual', 'ARS'),
    (v_cliente, cat_hogar,  'Frávega',             '2026-02-12',  67000.00, 'manual', 'ARS'),
    (v_cliente, cat_salud,  'Swiss Medical',       '2026-02-13',  42000.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Carrefour',           '2026-02-15',  13500.00, 'manual', 'ARS'),
    (v_cliente, cat_suscr,  'Disney+',             '2026-02-17',   6800.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'Shell',               '2026-02-19',  29500.00, 'manual', 'ARS'),
    (v_cliente, cat_educ,   'Coursera',            '2026-02-21',  18000.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'PedidosYa',           '2026-02-24',  11200.00, 'manual', 'ARS'),
    (v_cliente, cat_otros,  'MercadoPago',         '2026-02-26',   5500.00, 'manual', 'ARS'),
    (v_cliente, cat_serv,   'Personal',            '2026-02-28',  14900.00, 'manual', 'ARS'),

    -- ── MARZO 2026 ───────────────────────────────────────────────────────────
    (v_cliente, cat_alim,   'Disco',               '2026-03-02',   9800.00, 'manual', 'ARS'),
    (v_cliente, cat_educ,   'UTN Inscripción',     '2026-03-03',  55000.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'SUBE',                '2026-03-04',   1900.00, 'manual', 'ARS'),
    (v_cliente, cat_suscr,  'HBO Max',             '2026-03-05',   8200.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Jumbo',               '2026-03-07',  16400.00, 'manual', 'ARS'),
    (v_cliente, cat_hogar,  'Sodimac',             '2026-03-10',  41000.00, 'manual', 'ARS'),
    (v_cliente, cat_salud,  'Farmacity',           '2026-03-12',   8700.00, 'manual', 'ARS'),
    (v_cliente, cat_entret, 'Teatro Colón',        '2026-03-14',  22000.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'YPF',                 '2026-03-16',  31200.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Carrefour',           '2026-03-18',  11700.00, 'manual', 'ARS'),
    (v_cliente, cat_serv,   'Edesur',              '2026-03-20',  21800.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Rappi',               '2026-03-22',   7600.00, 'manual', 'ARS'),
    (v_cliente, cat_otros,  'Amazon',              '2026-03-25',  35000.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'La Anonima',          '2026-03-28',   8900.00, 'manual', 'ARS'),
    (v_cliente, cat_salud,  'Clínica privada',     '2026-03-30',  75000.00, 'manual', 'ARS'),

    -- ── ABRIL 2026 ───────────────────────────────────────────────────────────
    (v_cliente, cat_serv,   'Metrogas',            '2026-04-01',  24100.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Coto',                '2026-04-03',  12300.00, 'manual', 'ARS'),
    (v_cliente, cat_suscr,  'Netflix',             '2026-04-06',   8500.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'Cabify',              '2026-04-07',   7200.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'PedidosYa',           '2026-04-08',  10400.00, 'manual', 'ARS'),
    (v_cliente, cat_hogar,  'Easy',                '2026-04-10',  28500.00, 'manual', 'ARS'),
    (v_cliente, cat_educ,   'Udemy',               '2026-04-12',  12000.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Jumbo',               '2026-04-14',  17800.00, 'manual', 'ARS'),
    (v_cliente, cat_entret, 'Cine Hoyts',          '2026-04-16',   9200.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'Shell',               '2026-04-17',  33000.00, 'manual', 'ARS'),
    (v_cliente, cat_salud,  'Swiss Medical',       '2026-04-18',  43500.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Carrefour',           '2026-04-21',  14200.00, 'manual', 'ARS'),
    (v_cliente, cat_serv,   'Personal',            '2026-04-23',  16200.00, 'manual', 'ARS'),
    (v_cliente, cat_otros,  'Mercado Libre',       '2026-04-25',  48000.00, 'manual', 'ARS'),
    (v_cliente, cat_suscr,  'Spotify',             '2026-04-26',   5200.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Rappi',               '2026-04-28',   8900.00, 'manual', 'ARS'),

    -- ── MAYO 2026 ────────────────────────────────────────────────────────────
    (v_cliente, cat_alim,   'Coto',                '2026-05-02',  11600.00, 'manual', 'ARS'),
    (v_cliente, cat_serv,   'Edenor',              '2026-05-03',  23400.00, 'manual', 'ARS'),
    (v_cliente, cat_suscr,  'Netflix',             '2026-05-05',   8500.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'SUBE',                '2026-05-06',   2400.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Jumbo',               '2026-05-07',  19200.00, 'manual', 'ARS'),
    (v_cliente, cat_hogar,  'Frávega',             '2026-05-08',  89000.00, 'manual', 'ARS'),
    (v_cliente, cat_trans,  'YPF',                 '2026-05-09',  34500.00, 'manual', 'ARS'),
    (v_cliente, cat_salud,  'Farmacity',           '2026-05-10',  13700.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Rappi',               '2026-05-12',   9300.00, 'manual', 'ARS'),
    (v_cliente, cat_entret, 'Spotify + concierto', '2026-05-13',  35000.00, 'manual', 'ARS'),
    (v_cliente, cat_educ,   'Coursera',            '2026-05-14',  20000.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'Carrefour',           '2026-05-16',  16800.00, 'manual', 'ARS'),
    (v_cliente, cat_serv,   'Metrogas',            '2026-05-17',  26700.00, 'manual', 'ARS'),
    (v_cliente, cat_otros,  'Amazon',              '2026-05-18',  27500.00, 'manual', 'ARS'),
    (v_cliente, cat_alim,   'PedidosYa',           '2026-05-19',  11100.00, 'manual', 'ARS');

  RAISE NOTICE 'Insertados % gastos para el cliente %',
    72,
    v_cliente;
END;
$$;
