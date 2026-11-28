-- =============================================================================
-- SEED DE DEMO: gastos desde el 1/06/2026 hasta HOY para bj@fintrack.com y bi@fintrack.com
-- PROYECTO: FinTrack 2026. Cómo y cuándo correrlo: backend/README.md §6.
--
-- Qué hace:
--   * Borra los gastos que cargó una ejecución anterior de este seed (los marca la
--     descripcion '[seed-demo]') y los vuelve a generar: se puede correr de nuevo el día
--     de la demo para que el mes en curso tenga gastos. No toca ningún otro gasto.
--   * Genera gastos mensuales recurrentes con comercios argentinos, montos con decimales
--     y una variación determinística (dos ejecuciones el mismo día dan lo mismo).
--   * Nunca inserta fechas posteriores a hoy (hoy = fecha en America/Argentina/Buenos_Aires).
--   * Agrega 2 gastos inusuales por cliente en los últimos 30 días (regla del 35 % de
--     backend/README.md §4: superan en más de 35 % el promedio de los otros gastos de su
--     categoría, con al menos 3 para comparar).
--   * Perfiles esperados (gasto discrecional = Entretenimiento + Suscripciones + Otros en los
--     últimos 3 meses): bj ≈ 15 % → Equilibrista Cósmico; bi ≈ 40 % → Espíritu Libre.
--   * Sube la capacidad del asesor de la demo (mj@fintrack.com) a 10 clientes.
--
-- Cómo correrlo: Supabase → SQL Editor → pegar y ejecutar. Es una sola transacción.
-- =============================================================================

begin;

do $$
declare
  v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_desde constant date := date '2026-06-01';
  v_marca constant text := '[seed-demo]';
begin
  if v_hoy < v_desde then
    raise exception 'El seed de demo empieza el %; hoy es %.', v_desde, v_hoy;
  end if;

  delete from public.gastos where descripcion = v_marca;

  -- Plantillas de gastos mensuales: (email, comercio, categoría, monto base, días del mes).
  with plantilla(email, comercio, categoria, base, dias) as (
    values
      -- bj@fintrack.com: perfil equilibrado (≈ 15 % discrecional)
      ('bj@fintrack.com', 'Coto',            'Alimentación',    14000, array[3, 10, 17, 24]),
      ('bj@fintrack.com', 'PedidosYa',       'Alimentación',     9500, array[7, 21]),
      ('bj@fintrack.com', 'YPF',             'Transporte',      28000, array[5, 20]),
      ('bj@fintrack.com', 'Edenor',          'Servicios',       24000, array[9]),
      ('bj@fintrack.com', 'Metrogas',        'Servicios',       18000, array[11]),
      ('bj@fintrack.com', 'Personal',        'Servicios',       15000, array[14]),
      ('bj@fintrack.com', 'Farmacity',       'Salud',           11000, array[19]),
      ('bj@fintrack.com', 'Netflix',         'Suscripciones',    8500, array[1]),
      ('bj@fintrack.com', 'Disney+',         'Suscripciones',    9000, array[1]),
      ('bj@fintrack.com', 'Hoyts',           'Entretenimiento', 18000, array[22]),
      ('bj@fintrack.com', 'Mercado Libre',   'Otros',           25000, array[27]),
      ('bj@fintrack.com', 'UTN Cursos',      'Educación',       20000, array[15]),
      ('bj@fintrack.com', 'Easy',            'Hogar',           30000, array[25]),
      -- bi@fintrack.com: perfil gastador (≈ 40 % discrecional)
      ('bi@fintrack.com', 'Carrefour',       'Alimentación',    18000, array[4, 18]),
      ('bi@fintrack.com', 'Rappi',           'Alimentación',    12000, array[9, 23]),
      ('bi@fintrack.com', 'Uber',            'Transporte',       7000, array[6, 13, 20, 27]),
      ('bi@fintrack.com', 'Edenor',          'Servicios',       26000, array[10]),
      ('bi@fintrack.com', 'Netflix',         'Suscripciones',    8500, array[1]),
      ('bi@fintrack.com', 'Disney+',         'Suscripciones',    9000, array[1]),
      ('bi@fintrack.com', 'HBO Max',         'Suscripciones',    8000, array[1]),
      ('bi@fintrack.com', 'Hoyts',           'Entretenimiento', 22000, array[14]),
      ('bi@fintrack.com', 'Ticketek',        'Entretenimiento', 26000, array[26]),
      ('bi@fintrack.com', 'Mercado Libre',   'Otros',           38000, array[8, 24]),
      ('bi@fintrack.com', 'Zara',            'Ropa',            40000, array[17]),
      ('bi@fintrack.com', 'Farmacity',       'Salud',            9000, array[21])
  ),
  meses as (
    select generate_series(v_desde, date_trunc('month', v_hoy)::date, interval '1 month')::date as mes
  ),
  filas as (
    select
      u.id as cliente_id,
      c.id as categoria_id,
      p.comercio,
      (m.mes + (d - 1))::date as fecha,
      p.base
    from plantilla p
    join public.usuarios u on u.email = p.email
    join public.categorias_de_gasto c on c.nombre = p.categoria
    cross join meses m
    cross join lateral unnest(p.dias) as d
  )
  insert into public.gastos (cliente_id, categoria_id, comercio, fecha_gasto, monto, descripcion, origen)
  select
    cliente_id,
    categoria_id,
    comercio,
    fecha,
    -- base × [0,90 .. 1,10), con centavos, igual en cada ejecución para la misma fecha y comercio.
    -- Variación chica a propósito: solo los gastos de abajo tienen que salir como inusuales.
    round(base * (0.90 + (abs(hashtext(cliente_id::text || fecha::text || comercio)) % 2000) / 10000.0), 2),
    v_marca,
    'manual'
  from filas
  where fecha <= v_hoy;

  -- Gastos inusuales recientes (más de 35 % sobre el promedio de su categoría).
  insert into public.gastos (cliente_id, categoria_id, comercio, fecha_gasto, monto, descripcion, origen)
  select u.id, c.id, x.comercio, v_hoy - x.dias_atras, x.monto, v_marca, 'manual'
  from (values
      ('bj@fintrack.com', 'Jumbo',     'Alimentación', 4,  48350.90),
      ('bj@fintrack.com', 'Farmacity', 'Salud',        11, 38120.50),
      ('bi@fintrack.com', 'YPF',       'Transporte',   6,  52400.00),
      ('bi@fintrack.com', 'Carrefour', 'Alimentación', 15, 61875.25)
    ) as x(email, comercio, categoria, dias_atras, monto)
  join public.usuarios u on u.email = x.email
  join public.categorias_de_gasto c on c.nombre = x.categoria;

  -- Capacidad suficiente para el asesor de la demo.
  update public.perfiles_asesores pa
     set capacidad_maxima = greatest(pa.capacidad_maxima, 10)
    from public.usuarios u
   where u.id = pa.usuario_id and u.email = 'mj@fintrack.com';
end $$;

commit;

-- Verificación:
--   select u.email, date_trunc('month', g.fecha_gasto)::date mes, count(*), sum(g.monto)
--   from gastos g join usuarios u on u.id = g.cliente_id
--   where g.descripcion = '[seed-demo]' group by 1, 2 order by 1, 2;
--   select count(*) from gastos where fecha_gasto > (now() at time zone 'America/Argentina/Buenos_Aires')::date;  -- 0
