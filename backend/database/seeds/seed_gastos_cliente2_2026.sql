-- =========================================================
-- SEED: Gastos de ejemplo 2026 - Cliente 2 (diferente perfil)
-- Perfil: Cliente con gastos más elevados en tecnología y viajes
-- =========================================================

-- REEMPLAZAR con el ID del segundo cliente:
-- SELECT id FROM auth.users WHERE email = 'cliente2@ejemplo.com';

DO $$
DECLARE
  v_cliente uuid := '072dc81f-343e-4a9a-a9ca-46eeec449699';  -- ← REEMPLAZÁ ESTO

  -- IDs de categorías (solo las que existen en el sistema)
  cat_alim    uuid;
  cat_trans   uuid;
  cat_entret  uuid;
  cat_salud   uuid;
  cat_educ    uuid;
  cat_hogar   uuid;
  cat_serv    uuid;
  cat_otros   uuid;
BEGIN
  -- Limpiar gastos existentes del cliente 2 para poder recargar la seed
  DELETE FROM public.gastos WHERE cliente_id = v_cliente;
  RAISE NOTICE 'Gastos anteriores del cliente 2 eliminados';

  -- Resolver categorías por nombre
  SELECT id INTO cat_alim   FROM public.categorias_de_gasto WHERE nombre = 'Alimentación';
  SELECT id INTO cat_trans  FROM public.categorias_de_gasto WHERE nombre = 'Transporte';
  SELECT id INTO cat_entret FROM public.categorias_de_gasto WHERE nombre = 'Entretenimiento';
  SELECT id INTO cat_salud  FROM public.categorias_de_gasto WHERE nombre = 'Salud';
  SELECT id INTO cat_educ   FROM public.categorias_de_gasto WHERE nombre = 'Educación';
  SELECT id INTO cat_hogar  FROM public.categorias_de_gasto WHERE nombre = 'Hogar';
  SELECT id INTO cat_serv   FROM public.categorias_de_gasto WHERE nombre = 'Servicios';
  SELECT id INTO cat_otros  FROM public.categorias_de_gasto WHERE nombre = 'Otros';

  INSERT INTO public.gastos (cliente_id, categoria_id, comercio, fecha_gasto, monto, origen, moneda, descripcion)
  VALUES
    -- ═══════════════════════════════════════════════════════════════════════
    -- ENERO 2026 - Gastos elevados en tecnología (post navidad)
    -- ═══════════════════════════════════════════════════════════════════════
    (v_cliente, cat_hogar,  'Apple Store',           '2026-01-02',  450000.00, 'manual', 'ARS', 'MacBook Air M3'),
    (v_cliente, cat_hogar,  'Mercado Libre',         '2026-01-04',   89000.00, 'manual', 'ARS', 'AirPods Pro 2'),
    (v_cliente, cat_alim,   'Jumbo',                 '2026-01-06',   45000.00, 'manual', 'ARS', 'Compra semanal'),
    (v_cliente, cat_entret,  'Netflix',               '2026-01-08',    4500.00, 'manual', 'ARS', 'Suscripción mensual'),
    (v_cliente, cat_trans,  'Aerolineas Argentinas', '2026-01-10',  320000.00, 'manual', 'ARS', 'Vuelo a Bariloche'),
    (v_cliente, cat_trans,  'Hotel Llao Llao',       '2026-01-10',  180000.00, 'manual', 'ARS', '3 noches Bariloche'),
    (v_cliente, cat_alim,   'Rapa Nui',              '2026-01-12',   25000.00, 'manual', 'ARS', 'Cena restaurante'),
    (v_cliente, cat_entret, 'Cine Village',          '2026-01-14',   12000.00, 'manual', 'ARS', 'Entradas cine'),
    (v_cliente, cat_hogar,  'Fravega',               '2026-01-16',   65000.00, 'manual', 'ARS', 'Monitor 27 pulgadas'),
    (v_cliente, cat_serv,   'Personal',              '2026-01-18',   12000.00, 'manual', 'ARS', 'Plan móvil'),
    (v_cliente, cat_alim,   'Verdulería Don Juan',   '2026-01-20',   18000.00, 'manual', 'ARS', 'Frutas y verduras'),
    (v_cliente, cat_trans,  'Shell',                 '2026-01-22',   35000.00, 'manual', 'ARS', 'Nafta'),
    (v_cliente, cat_salud,  'Óptica Vision',         '2026-01-24',   85000.00, 'manual', 'ARS', 'Lentes nuevos'),
    (v_cliente, cat_entret,  'Spotify',               '2026-01-26',    2500.00, 'manual', 'ARS', 'Plan familiar'),
    (v_cliente, cat_hogar,  'Easy',                  '2026-01-28',   42000.00, 'manual', 'ARS', 'Organizadores'),
    (v_cliente, cat_alim,   'Disco',                 '2026-01-30',   38000.00, 'manual', 'ARS', 'Compra semanal'),

    -- ═══════════════════════════════════════════════════════════════════════
    -- FEBRERO 2026 - Menos gastos, mes corto
    -- ═══════════════════════════════════════════════════════════════════════
    (v_cliente, cat_alim,   'Carrefour',             '2026-02-02',   52000.00, 'manual', 'ARS', 'Compra semanal'),
    (v_cliente, cat_entret,  'Netflix',               '2026-02-04',    4500.00, 'manual', 'ARS', 'Suscripción'),
    (v_cliente, cat_trans,  'Uber',                  '2026-02-06',    8500.00, 'manual', 'ARS', 'Viaje al aeropuerto'),
    (v_cliente, cat_entret,  'Teatro Colón',          '2026-02-08',   45000.00, 'manual', 'ARS', 'Concierto sinfónico'),
    (v_cliente, cat_alim,   'El Preferido',          '2026-02-10',   18000.00, 'manual', 'ARS', 'Almuerzo'),
    (v_cliente, cat_hogar,  'Musimundo',             '2026-02-12',   28000.00, 'manual', 'ARS', 'Teclado mecánico'),
    (v_cliente, cat_salud,  'Hospital Alemán',       '2026-02-14',   25000.00, 'manual', 'ARS', 'Consulta médica'),
    (v_cliente, cat_serv,   'Edenor',                '2026-02-16',   28000.00, 'manual', 'ARS', 'Factura energía'),
    (v_cliente, cat_alim,   'Rappi',                 '2026-02-18',   15000.00, 'manual', 'ARS', 'Pedido sushi'),
    (v_cliente, cat_trans,  'YPF',                   '2026-02-20',   32000.00, 'manual', 'ARS', 'Nafta'),
    (v_cliente, cat_hogar,  'Casa del Audio',        '2026-02-22',   55000.00, 'manual', 'ARS', 'Soundbar'),
    (v_cliente, cat_alim,   'Jumbo',                 '2026-02-24',   48000.00, 'manual', 'ARS', 'Compra semanal'),
    (v_cliente, cat_entret,  'Disney+',               '2026-02-26',    3500.00, 'manual', 'ARS', 'Suscripción mensual'),
    (v_cliente, cat_entret, 'Bowling',               '2026-02-28',   14000.00, 'manual', 'ARS', 'Salida con amigos'),

    -- ═══════════════════════════════════════════════════════════════════════
    -- MARZO 2026 - Inicio de clases, gastos en educación
    -- ═══════════════════════════════════════════════════════════════════════
    (v_cliente, cat_educ,   'Universidad UB',        '2026-03-01',  150000.00, 'manual', 'ARS', 'Cuota marzo'),
    (v_cliente, cat_alim,   'Carrefour',             '2026-03-03',   55000.00, 'manual', 'ARS', 'Compra semanal'),
    (v_cliente, cat_hogar,  'iStore',                '2026-03-05',   45000.00, 'manual', 'ARS', 'Funda y accesorios'),
    (v_cliente, cat_entret,  'Netflix',               '2026-03-06',    4500.00, 'manual', 'ARS', 'Suscripción'),
    (v_cliente, cat_trans,  'Shell',                 '2026-03-08',   38000.00, 'manual', 'ARS', 'Nafta'),
    (v_cliente, cat_alim,   'Parrilla Don Julio',    '2026-03-10',   65000.00, 'manual', 'ARS', 'Cena especial'),
    (v_cliente, cat_serv,    'Metrogas',              '2026-03-12',   18000.00, 'manual', 'ARS', 'Factura gas'),
    (v_cliente, cat_hogar,  'Ikea',                  '2026-03-14',   95000.00, 'manual', 'ARS', 'Escritorio nuevo'),
    (v_cliente, cat_salud,  'Farmacity',             '2026-03-16',   12000.00, 'manual', 'ARS', 'Medicamentos'),
    (v_cliente, cat_alim,   'Mercado Libre',         '2026-03-18',   28000.00, 'manual', 'ARS', 'Electrodomésticos'),
    (v_cliente, cat_entret, 'Feria del Libro',       '2026-03-20',   22000.00, 'manual', 'ARS', 'Libros'),
    (v_cliente, cat_trans,  'Cabify',                '2026-03-22',    7500.00, 'manual', 'ARS', 'Viajes varios'),
    (v_cliente, cat_alim,   'Disco',                 '2026-03-24',   42000.00, 'manual', 'ARS', 'Compra semanal'),
    (v_cliente, cat_hogar,  'Apple Store',           '2026-03-26',   35000.00, 'manual', 'ARS', 'Magic Mouse'),
    (v_cliente, cat_entret,  'Spotify',               '2026-03-28',    2500.00, 'manual', 'ARS', 'Suscripción'),
    (v_cliente, cat_educ,   'Librería Yenny',        '2026-03-30',   18000.00, 'manual', 'ARS', 'Materiales estudio'),

    -- ═══════════════════════════════════════════════════════════════════════
    -- ABRIL 2026 - Viaje de negocios a Córdoba
    -- ═══════════════════════════════════════════════════════════════════════
    (v_cliente, cat_trans,  'Aerolineas Argentinas', '2026-04-01',   85000.00, 'manual', 'ARS', 'Vuelo Córdoba'),
    (v_cliente, cat_trans,  'Holiday Inn',           '2026-04-01',   45000.00, 'manual', 'ARS', '2 noches Córdoba'),
    (v_cliente, cat_alim,   'Supermercado Día',      '2026-04-03',   12000.00, 'manual', 'ARS', 'Compra rápida'),
    (v_cliente, cat_trans,  'Avis Rent A Car',       '2026-04-04',   35000.00, 'manual', 'ARS', 'Alquiler auto'),
    (v_cliente, cat_entret,  'Netflix',               '2026-04-06',    4500.00, 'manual', 'ARS', 'Suscripción'),
    (v_cliente, cat_alim,   'El Club de la Milanesa','2026-04-07',   15000.00, 'manual', 'ARS', 'Almuerzo Córdoba'),
    (v_cliente, cat_serv,   'Personal',              '2026-04-08',   12000.00, 'manual', 'ARS', 'Plan móvil'),
    (v_cliente, cat_trans,  'Shell',                 '2026-04-10',   25000.00, 'manual', 'ARS', 'Nafta Córdoba'),
    (v_cliente, cat_alim,   'Carrefour',             '2026-04-12',   58000.00, 'manual', 'ARS', 'Compra semanal'),
    (v_cliente, cat_entret, 'Cine Showcase',         '2026-04-14',   14000.00, 'manual', 'ARS', 'Estreno'),
    (v_cliente, cat_hogar,  'Garbarino',             '2026-04-16',   75000.00, 'manual', 'ARS', 'iPad mini'),
    (v_cliente, cat_alim,   'McDonald''s',           '2026-04-18',    8500.00, 'manual', 'ARS', 'Cena rápida'),
    (v_cliente, cat_hogar,  'Carrefour Home',        '2026-04-20',   32000.00, 'manual', 'ARS', 'Ropa de cama'),
    (v_cliente, cat_salud,  'Gimnasio Club V',       '2026-04-22',   28000.00, 'manual', 'ARS', 'Cuota mensual'),
    (v_cliente, cat_alim,   'Jumbo',                 '2026-04-24',   52000.00, 'manual', 'ARS', 'Compra semanal'),
    (v_cliente, cat_entret,  'HBO Max',               '2026-04-26',    4000.00, 'manual', 'ARS', 'Suscripción'),
    (v_cliente, cat_educ,   'Coursera',              '2026-04-28',   12000.00, 'manual', 'ARS', 'Curso online'),
    (v_cliente, cat_trans,  'Aerolineas Argentinas', '2026-04-30',   85000.00, 'manual', 'ARS', 'Vuelo vuelta'),

    -- ═══════════════════════════════════════════════════════════════════════
    -- MAYO 2026 - Gastos moderados
    -- ═══════════════════════════════════════════════════════════════════════
    (v_cliente, cat_alim,   'Carrefour',             '2026-05-02',   62000.00, 'manual', 'ARS', 'Compra semanal'),
    (v_cliente, cat_entret,  'Netflix',               '2026-05-04',    4500.00, 'manual', 'ARS', 'Suscripción'),
    (v_cliente, cat_hogar,  'Steam',                 '2026-05-05',   15000.00, 'manual', 'ARS', 'Videojuegos'),
    (v_cliente, cat_trans,  'Shell',                 '2026-05-07',   36000.00, 'manual', 'ARS', 'Nafta'),
    (v_cliente, cat_entret, 'Escape Room',           '2026-05-09',   20000.00, 'manual', 'ARS', 'Entretenimiento grupo'),
    (v_cliente, cat_alim,   'La Cabrera',            '2026-05-11',   85000.00, 'manual', 'ARS', 'Cena aniversario'),
    (v_cliente, cat_serv,   'Edenor',                '2026-05-13',   32000.00, 'manual', 'ARS', 'Factura energía'),
    (v_cliente, cat_hogar,  'Mercado Libre',         '2026-05-15',   45000.00, 'manual', 'ARS', 'Lámparas LED'),
    (v_cliente, cat_salud,  'Swiss Medical',         '2026-05-17',   45000.00, 'manual', 'ARS', 'Seguro médico'),
    (v_cliente, cat_alim,   'Rappi',                 '2026-05-19',   18000.00, 'manual', 'ARS', 'Pedido sushi'),
    (v_cliente, cat_educ,   'Universidad UB',        '2026-05-21',  150000.00, 'manual', 'ARS', 'Cuota mayo'),
    (v_cliente, cat_trans,  'Uber',                  '2026-05-23',    9200.00, 'manual', 'ARS', 'Viajes varios'),
    (v_cliente, cat_hogar,  'Mercado Libre',         '2026-05-25',   28000.00, 'manual', 'ARS', 'Hub USB-C'),
    (v_cliente, cat_alim,   'Jumbo',                 '2026-05-27',   58000.00, 'manual', 'ARS', 'Compra semanal'),
    (v_cliente, cat_entret,  'YouTube Premium',       '2026-05-29',    5000.00, 'manual', 'ARS', 'Suscripción'),
    (v_cliente, cat_entret, 'Cine Hoyts',            '2026-05-31',   15000.00, 'manual', 'ARS', 'Estreno veraniego');

  RAISE NOTICE 'Gastos del cliente 2 (2026) insertados correctamente - Solo hasta mayo';
END $$;
