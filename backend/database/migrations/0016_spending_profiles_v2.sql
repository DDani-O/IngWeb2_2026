-- =============================================================================
-- Migración 0016: catálogo de perfiles de gasto v2 y limpieza de vistas sin uso
-- Fase I3 de especificaciones/PlanIntegracionBackend.md · spec §10.6 y §10.8
--
-- 1. El catálogo pasa a tener exactamente 3 perfiles, asignados automáticamente por
--    el sistema según la participación del gasto discrecional (Entretenimiento,
--    Suscripciones y Otros) en el mes en curso y los dos anteriores:
--      Drácula Nocturno      < 10 %
--      Equilibrista Cósmico  < 30 %
--      Espíritu Libre        el resto
--    `criterio_regla` guarda solo la regla ({ "discrecional_max": n }); los textos,
--    emojis y la comparativa viven en el front (frontend/content/spendingProfiles.js).
-- 2. Se borran los 7 perfiles del seed anterior y sus clasificaciones (eran manuales
--    del asesor; el backend recalcula la clasificación de cada cliente en la próxima
--    consulta de su análisis).
-- 3. Se eliminan las vistas de las migraciones 0008/0009: ningún servicio las usa y
--    client_anomaly_view implementaba la regla de z-score, descartada en la fase I1.
--
-- Idempotente: se puede ejecutar más de una vez.
-- =============================================================================

BEGIN;

-- 2. Perfiles que no son del catálogo v2 (perfil_id es ON DELETE RESTRICT).
DELETE FROM public.clasificacion_de_perfil
WHERE perfil_id IN (
    SELECT id FROM public.perfiles_de_gasto
    WHERE nombre NOT IN ('Drácula Nocturno', 'Equilibrista Cósmico', 'Espíritu Libre')
);

DELETE FROM public.perfiles_de_gasto
WHERE nombre NOT IN ('Drácula Nocturno', 'Equilibrista Cósmico', 'Espíritu Libre');

-- 1. Catálogo v2.
INSERT INTO public.perfiles_de_gasto (nombre, descripcion, criterio_regla, activo)
VALUES
    ('Drácula Nocturno', 'Gastos muy controlados y alto ahorro.', '{"discrecional_max": 0.10}'::jsonb, true),
    ('Equilibrista Cósmico', 'Balance entre gasto y ahorro.', '{"discrecional_max": 0.30}'::jsonb, true),
    ('Espíritu Libre', 'Gasto discrecional alto y poco control.', '{"discrecional_max": 1.00}'::jsonb, true)
ON CONFLICT (nombre) DO UPDATE SET
    descripcion = EXCLUDED.descripcion,
    criterio_regla = EXCLUDED.criterio_regla,
    activo = EXCLUDED.activo;

-- 3. Vistas sin uso.
DROP VIEW IF EXISTS public.client_anomaly_view;
DROP VIEW IF EXISTS public.advisor_dashboard_view;
DROP VIEW IF EXISTS public.monthly_evolution_view;
DROP VIEW IF EXISTS public.category_distribution_view;
DROP VIEW IF EXISTS public.consumption_stats_view;

COMMIT;
