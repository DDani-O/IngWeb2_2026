-- Seed: catálogo de perfiles de gasto (v2, migración 0016).
-- El sistema sugiere el perfil según la participación del gasto discrecional y el asesor
-- puede asignar otro (backend/README.md §4); el cliente no lo elige.
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
