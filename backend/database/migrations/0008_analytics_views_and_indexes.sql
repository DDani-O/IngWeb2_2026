-- =============================================================================
-- MIGRACIÓN 0008: Analytics Views & Indexes para Consumption Analysis
-- PROYECTO: FinTrack 2026
-- =============================================================================

BEGIN;

-- ==========================================================
-- 1. VIEWS
-- ==========================================================

-- ----------------------------------------------------------
-- consumption_stats_view
-- ----------------------------------------------------------

CREATE OR REPLACE VIEW public.consumption_stats_view AS
SELECT
    g.cliente_id,

    DATE_TRUNC('month', g.fecha_gasto)::date AS periodo_inicio,

    (
        DATE_TRUNC('month', g.fecha_gasto)
        + INTERVAL '1 month'
        - INTERVAL '1 day'
    )::date AS periodo_fin,

    SUM(g.monto) AS gasto_total,

    ROUND(AVG(g.monto)::numeric, 2) AS gasto_promedio,

    COUNT(*) AS cantidad_gastos,

    COUNT(DISTINCT g.categoria_id) AS categorias_unicas,

    COUNT(DISTINCT g.comercio) AS comercios_unicos,

    MAX(g.monto) AS monto_maximo,

    MIN(g.monto) AS monto_minimo,

    COALESCE(STDDEV(g.monto), 0) AS desviacion_estandar

FROM public.gastos g

WHERE g.cliente_id IS NOT NULL

GROUP BY
    g.cliente_id,
    DATE_TRUNC('month', g.fecha_gasto);

-- ----------------------------------------------------------
-- category_distribution_view
-- ----------------------------------------------------------

CREATE OR REPLACE VIEW public.category_distribution_view AS
SELECT
    g.cliente_id,

    g.categoria_id,

    cg.nombre AS categoria_nombre,

    COUNT(*) AS cantidad,

    SUM(g.monto) AS total,

    ROUND(
        (
            100.0 * SUM(g.monto)
        )::numeric
        /
        NULLIF(
            SUM(SUM(g.monto)) OVER (
                PARTITION BY g.cliente_id
            ),
            0
        ),
        2
    ) AS porcentaje,

    ROUND(AVG(g.monto)::numeric, 2) AS promedio,

    MAX(g.monto) AS maximo,

    MIN(g.monto) AS minimo,

    ROW_NUMBER() OVER (
        PARTITION BY g.cliente_id
        ORDER BY SUM(g.monto) DESC
    ) AS ranking

FROM public.gastos g

JOIN public.categorias_de_gasto cg
    ON g.categoria_id = cg.id

WHERE g.cliente_id IS NOT NULL

GROUP BY
    g.cliente_id,
    g.categoria_id,
    cg.nombre;

-- ----------------------------------------------------------
-- monthly_evolution_view
-- ----------------------------------------------------------

CREATE OR REPLACE VIEW public.monthly_evolution_view AS
WITH monthly_data AS (
    SELECT
        g.cliente_id,

        DATE_TRUNC('month', g.fecha_gasto)::date AS mes,

        SUM(g.monto) AS gasto_mes,

        COUNT(*) AS cantidad_transacciones,

        ROUND(
            (
                SUM(g.monto)
                /
                NULLIF(COUNT(*), 0)
            )::numeric,
            2
        ) AS promedio_transaccion

    FROM public.gastos g

    WHERE g.cliente_id IS NOT NULL

    GROUP BY
        g.cliente_id,
        DATE_TRUNC('month', g.fecha_gasto)
)

SELECT
    md.*,

    LAG(md.gasto_mes) OVER (
        PARTITION BY md.cliente_id
        ORDER BY md.mes
    ) AS gasto_mes_anterior,

    ROUND(
        (
            100.0 * (
                md.gasto_mes
                - LAG(md.gasto_mes) OVER (
                    PARTITION BY md.cliente_id
                    ORDER BY md.mes
                )
            )
        )::numeric
        /
        NULLIF(
            LAG(md.gasto_mes) OVER (
                PARTITION BY md.cliente_id
                ORDER BY md.mes
            ),
            0
        ),
        2
    ) AS variacion_porcentual

FROM monthly_data md;

-- ----------------------------------------------------------
-- advisor_dashboard_view
-- ----------------------------------------------------------

CREATE OR REPLACE VIEW public.advisor_dashboard_view AS
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
            WHERE g.creado_en >= NOW() - INTERVAL '30 days'
        ) AS gastos_30d,

        SUM(g.monto) FILTER (
            WHERE g.creado_en >= NOW() - INTERVAL '30 days'
        ) AS gasto_total_30d,

        ROUND(
            AVG(g.monto) FILTER (
                WHERE g.creado_en >= NOW() - INTERVAL '30 days'
            )::numeric,
            2
        ) AS gasto_promedio_30d,

        MAX(g.creado_en) AS ultima_transaccion,

        COUNT(*) FILTER (
            WHERE g.creado_en >= NOW() - INTERVAL '7 days'
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
-- client_anomaly_view
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
        g.creado_en >= NOW() - INTERVAL '90 days'
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

-- ==========================================================
-- 2. ÍNDICES
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_gastos_cliente_fecha
ON public.gastos (
    cliente_id,
    fecha_gasto DESC
)
WHERE cliente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gastos_cliente_categoria
ON public.gastos (
    cliente_id,
    categoria_id
)
WHERE cliente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gastos_cliente_creado
ON public.gastos (
    cliente_id,
    creado_en DESC
)
WHERE cliente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asignaciones_asesor_activo
ON public.asignaciones_de_clientes (
    asesor_id,
    activo
);

-- IMPORTANTE:
-- Se eliminó el índice con DATE_TRUNC porque puede romper
-- dependiendo del tipo/tz de fecha_gasto y la inmutabilidad.

CREATE INDEX IF NOT EXISTS idx_gastos_cliente_monto
ON public.gastos (
    cliente_id,
    monto
)
WHERE cliente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recomendaciones_cliente_estado
ON public.recomendaciones_financieras (
    cliente_id,
    estado
)
WHERE estado = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_mensajes_asesor_cliente
ON public.mensajes_asesor (
    asesor_id,
    cliente_id,
    creado_en DESC
);

-- ==========================================================
-- 3. FUNCIONES
-- ==========================================================

CREATE OR REPLACE FUNCTION public.calcular_zscore(
    p_value numeric,
    p_mean numeric,
    p_stddev numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN p_stddev = 0 THEN 0
        ELSE ROUND(
            ((p_value - p_mean) / p_stddev)::numeric,
            2
        )
    END;
$$;

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
            AND g.creado_en >= NOW()
                - (p_dias || ' days')::interval

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
        AND g.creado_en >= NOW()
            - (p_dias || ' days')::interval

    ORDER BY g.fecha_gasto DESC;
$$;

-- ==========================================================
-- 4. RLS
-- ==========================================================

ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gastos_select_cliente
ON public.gastos;

CREATE POLICY gastos_select_cliente
ON public.gastos
FOR SELECT
USING (
    cliente_id = auth.uid()
    OR public.es_asesor_asignado_a_cliente(cliente_id)
);

DROP POLICY IF EXISTS gastos_insert_cliente
ON public.gastos;

CREATE POLICY gastos_insert_cliente
ON public.gastos
FOR INSERT
WITH CHECK (
    cliente_id = auth.uid()
);

DROP POLICY IF EXISTS gastos_update_cliente
ON public.gastos;

CREATE POLICY gastos_update_cliente
ON public.gastos
FOR UPDATE
USING (
    cliente_id = auth.uid()
)
WITH CHECK (
    cliente_id = auth.uid()
);

DROP POLICY IF EXISTS gastos_delete_cliente
ON public.gastos;

CREATE POLICY gastos_delete_cliente
ON public.gastos
FOR DELETE
USING (
    cliente_id = auth.uid()
);

-- ==========================================================
-- 5. COMMENTS
-- ==========================================================

COMMENT ON VIEW public.consumption_stats_view IS
'Estadísticas mensuales de consumo por cliente.';

COMMENT ON VIEW public.category_distribution_view IS
'Distribución porcentual de gastos por categoría.';

COMMENT ON VIEW public.monthly_evolution_view IS
'Evolución mensual y variación porcentual de gastos.';

COMMENT ON VIEW public.advisor_dashboard_view IS
'Dashboard agregado de asesores financieros.';

COMMENT ON VIEW public.client_anomaly_view IS
'View helper para anomaly detection y análisis estadístico.';

COMMENT ON FUNCTION public.calcular_zscore IS
'Calcula z-score estadístico.';

COMMENT ON FUNCTION public.obtener_gastos_inusuales IS
'Obtiene gastos potencialmente anómalos por cliente.';

COMMIT;

-- ==========================================================
-- ANALYZE
-- ==========================================================

ANALYZE public.gastos;
ANALYZE public.asignaciones_de_clientes;