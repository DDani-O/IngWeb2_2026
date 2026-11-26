-- Seed: catálogo de perfiles de gasto (v2, migración 0016).
-- Los perfiles los asigna el sistema automáticamente según la participación del gasto
-- discrecional (spec §10.6); ni el cliente ni el asesor los eligen.
-- criterio_regla guarda solo la regla; los textos de cada perfil viven en el front
-- (frontend/content/spendingProfiles.js).

insert into public.perfiles_de_gasto (nombre, descripcion, criterio_regla, activo)
values
  ('Drácula Nocturno', 'Gastos muy controlados y alto ahorro.', '{"discrecional_max": 0.10}'::jsonb, true),
  ('Equilibrista Cósmico', 'Balance entre gasto y ahorro.', '{"discrecional_max": 0.30}'::jsonb, true),
  ('Espíritu Libre', 'Gasto discrecional alto y poco control.', '{"discrecional_max": 1.00}'::jsonb, true)
on conflict (nombre) do update set
  descripcion = excluded.descripcion,
  criterio_regla = excluded.criterio_regla,
  activo = excluded.activo;
