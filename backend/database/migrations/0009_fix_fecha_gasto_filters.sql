-- =============================================================================
-- MIGRACIÓN 0009: Corrección de filtros temporales en views y funciones
-- PROYECTO: FinTrack 2026
--
-- BUG CORREGIDO:
--   Las views advisor_dashboard_view, client_anomaly_view y la función
--   obtener_gastos_inusuales filtraban por creado_en (timestamp de inserción
--   del registro) en lugar de fecha_gasto (date del gasto real).
--
--   Esto causaba:
--   1. Gastos con fecha_gasto histórica (ej: 2019) ingresados hoy pasaban el
--      filtro de "últimos 30 días" porque creado_en era reciente.
--   2. Los gastos aparecían en el mes correcto según fecha_gasto (2019-03)
--      pero dentro del rango "reciente", distorsionando analytics.
--
--   La columna fecha_gasto es tipo DATE (fecha real del gasto, user-defined).
--   La columna creado_en es tipo TIMESTAMPTZ (cuándo se insertó en la BD).
--   Para análisis temporales siempre debe usarse fecha_gasto.
-- =============================================================================

BEGIN;

-- ----------------------------------------------------------
-- 1. Corregir advisor_dashboard_view
--    Cambia filtros de creado_en >= NOW() - INTERVAL '...'
--    por     fecha_gasto >= CURRENT_DATE - INTERVAL '...'
--    Requiere DROP previo porque cambia el tipo de ultima_transaccion
--    de timestamptz (MAX creado_en) a date (MAX fecha_gasto).
-- ----------------------------------------------------------

DROP VIEW IF EXISTS public.advisor_dashboard_view;

CREATE VIEW public.advisor_dashboard_view AS
WITH clientes AS (
    SELECT
        ac.asesor_id,
        ac.cliente_id,
        ac.activo
    FROM public.asignaciones_de_clientes ac
),

gastos_stats AS (
    SELECT
        g.cliente_id,

        COUNT(*) FILTER (
            WHERE g.fecha_gasto >= CURRENT_DATE - INTERVAL '30 days'
        ) AS gastos_30d,

        SUM(g.monto) FILTER (
            WHERE g.fecha_gasto >= CURRENT_DATE - INTERVAL '30 days'
        ) AS gasto_total_30d,

        ROUND(
            AVG(g.monto) FILTER (
                WHERE g.fecha_gasto >= CURRENT_DATE - INTERVAL '30 days'
            )::numeric,
            2
        ) AS gasto_promedio_30d,

        MAX(g.fecha_gasto) AS ultima_transaccion,

        COUNT(*) FILTER (
            WHERE g.fecha_gasto >= CURRENT_DATE - INTERVAL '7 days'
        ) AS transacciones_7d

    FROM public.gastos g

    GROUP BY g.cliente_id
),

recomendaciones_stats AS (
    SELECT
        rf.cliente_id,
        rf.asesor_id,

        COUNT(*) FILTER (
            WHERE rf.estado = 'pendiente'
        ) AS recomendaciones_pendientes

    FROM public.recomendaciones_financieras rf

    GROUP BY
        rf.cliente_id,
        rf.asesor_id
)

SELECT
    c.asesor_id,

    COUNT(DISTINCT c.cliente_id) AS total_clientes,

    COUNT(DISTINCT CASE
        WHEN c.activo = true
        THEN c.cliente_id
    END) AS clientes_activos,

    COUNT(DISTINCT CASE
        WHEN gs.gastos_30d > 0
        THEN c.cliente_id
    END) AS clientes_con_transacciones_ultimos_30,

    COALESCE(SUM(gs.gasto_total_30d), 0) AS gasto_ultimos_30_dias,

    ROUND(
        AVG(gs.gasto_promedio_30d),
        2
    ) AS gasto_promedio_ultimos_30,

    COUNT(DISTINCT CASE
        WHEN gs.transacciones_7d > 0
        THEN c.cliente_id
    END) AS clientes_transacciones_ultima_semana,

    MAX(gs.ultima_transaccion) AS ultima_transaccion,

    COALESCE(
        SUM(rs.recomendaciones_pendientes),
        0
    ) AS recomendaciones_pendientes

FROM clientes c

LEFT JOIN gastos_stats gs
    ON c.cliente_id = gs.cliente_id

LEFT JOIN recomendaciones_stats rs
    ON c.cliente_id = rs.cliente_id
    AND c.asesor_id = rs.asesor_id

GROUP BY c.asesor_id;

-- ----------------------------------------------------------
-- 2. Corregir client_anomaly_view
--    Cambia creado_en >= NOW() - INTERVAL '90 days'
--    por     fecha_gasto >= CURRENT_DATE - INTERVAL '90 days'
-- ----------------------------------------------------------

CREATE OR REPLACE VIEW public.client_anomaly_view AS
WITH category_stats AS (
    SELECT
        g.cliente_id,

        g.categoria_id,

        AVG(g.monto) AS avg_monto,

        COALESCE(STDDEV(g.monto), 0) AS stddev_monto,

        PERCENTILE_CONT(0.95)
        WITHIN GROUP (
            ORDER BY g.monto
        ) AS percentil_95

    FROM public.gastos g

    WHERE
        g.fecha_gasto >= CURRENT_DATE - INTERVAL '90 days'
        AND g.cliente_id IS NOT NULL

    GROUP BY
        g.cliente_id,
        g.categoria_id
)

SELECT
    g.id,

    g.cliente_id,

    g.categoria_id,

    cg.nombre AS categoria_nombre,

    g.comercio,

    g.monto,

    g.fecha_gasto,

    COALESCE(cs.avg_monto, 0) AS avg_90_dias,

    COALESCE(cs.stddev_monto, 0) AS stddev_90_dias,

    COALESCE(cs.percentil_95, g.monto) AS percentil_95

FROM public.gastos g

JOIN public.categorias_de_gasto cg
    ON g.categoria_id = cg.id

LEFT JOIN category_stats cs
    ON g.cliente_id = cs.cliente_id
    AND g.categoria_id = cs.categoria_id

WHERE g.cliente_id IS NOT NULL;

-- ----------------------------------------------------------
-- 3. Corregir obtener_gastos_inusuales
--    Cambia creado_en >= NOW() - (p_dias || ' days')::interval
--    por     fecha_gasto >= CURRENT_DATE - (p_dias || ' days')::interval
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.obtener_gastos_inusuales(
    p_cliente_id uuid,
    p_dias integer DEFAULT 30
)
RETURNS TABLE (
    gasto_id uuid,
    monto numeric,
    comercio text,
    categoria_id uuid,
    fecha_gasto date,
    zscore numeric,
    percentil_95 numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    WITH category_stats AS (
        SELECT
            g.categoria_id,

            AVG(g.monto) AS avg_monto,

            COALESCE(STDDEV(g.monto), 0) AS stddev_monto,

            PERCENTILE_CONT(0.95)
            WITHIN GROUP (
                ORDER BY g.monto
            ) AS percentil_95

        FROM public.gastos g

        WHERE
            g.cliente_id = p_cliente_id
            AND g.fecha_gasto >= CURRENT_DATE - (p_dias || ' days')::interval

        GROUP BY g.categoria_id
    )

    SELECT
        g.id,
        g.monto,
        g.comercio,
        g.categoria_id,
        g.fecha_gasto,

        public.calcular_zscore(
            g.monto,
            COALESCE(cs.avg_monto, 0),
            COALESCE(cs.stddev_monto, 0)
        ) AS zscore,

        COALESCE(cs.percentil_95, g.monto) AS percentil_95

    FROM public.gastos g

    LEFT JOIN category_stats cs
        ON g.categoria_id = cs.categoria_id

    WHERE
        g.cliente_id = p_cliente_id
        AND g.fecha_gasto >= CURRENT_DATE - (p_dias || ' days')::interval

    ORDER BY g.fecha_gasto DESC;
$$;

-- ----------------------------------------------------------
-- 4. Actualizar comentarios
-- ----------------------------------------------------------

COMMENT ON VIEW public.advisor_dashboard_view IS
'Dashboard agregado de asesores financieros. Filtra por fecha_gasto (fecha real del gasto).';

COMMENT ON VIEW public.client_anomaly_view IS
'View helper para anomaly detection. Filtra por fecha_gasto (fecha real del gasto).';

COMMENT ON FUNCTION public.obtener_gastos_inusuales IS
'Obtiene gastos potencialmente anómalos por cliente. Filtra por fecha_gasto.';

COMMIT;

ANALYZE public.gastos;
