-- Migration 0011: Indexes for recomendaciones_financieras
-- Improve query performance for the recommendations system
-- Date: 2026-05-19

-- Index: queries por cliente (GET /users/me/recommendations)
create index if not exists idx_recomendaciones_cliente_id
  on public.recomendaciones_financieras (cliente_id);

-- Index: queries por asesor + estado (GET /advisor/recommendations con filtro status)
create index if not exists idx_recomendaciones_asesor_estado
  on public.recomendaciones_financieras (asesor_id, estado);

-- Index: ordenamiento por fecha de creacion (orden por defecto en ambos endpoints)
create index if not exists idx_recomendaciones_creado_en
  on public.recomendaciones_financieras (creado_en desc);

-- Index: recomendaciones no leidas por cliente (dashboard resumen)
create index if not exists idx_recomendaciones_cliente_leida
  on public.recomendaciones_financieras (cliente_id, leida)
  where leida = false;
