-- =============================================================================
-- MIGRACIÓN: Refactor a Categorías Globales Únicamente (v3)
-- PROYECTO: FinTrack 2026
-- DESCRIPCIÓN: Elimina categorías personalizadas, consolida duplicados y
--              reasigna gastos a las categorías globales correspondientes.
-- =============================================================================

BEGIN;

-- 1. REASIGNAR GASTOS DE CATEGORÍAS PERSONALES A GLOBALES
-- Para cada categoría personal, si existe una global con el mismo nombre,
-- se mueven todos los gastos a la categoría global.
UPDATE public.gastos g
SET categoria_id = (
    SELECT id FROM public.categorias_de_gasto cg_global
    WHERE cg_global.nombre = (
        SELECT nombre FROM public.categorias_de_gasto cg_personal
        WHERE cg_personal.id = g.categoria_id
    ) AND cg_global.cliente_id IS NULL
    LIMIT 1
)
WHERE g.categoria_id IN (
    SELECT id FROM public.categorias_de_gasto
    WHERE cliente_id IS NOT NULL
)
AND EXISTS (
    SELECT 1 FROM public.categorias_de_gasto cg_global
    WHERE cg_global.nombre = (
        SELECT nombre FROM public.categorias_de_gasto cg_personal
        WHERE cg_personal.id = g.categoria_id
    ) AND cg_global.cliente_id IS NULL
);

-- 2. LIMPIEZA DE GASTOS HUÉRFANOS
-- Elimina gastos que todavía apuntan a categorías personales (porque no había una global con el mismo nombre).
DELETE FROM public.gastos
WHERE categoria_id IN (
  SELECT id FROM public.categorias_de_gasto
  WHERE cliente_id IS NOT NULL
);

-- 3. ELIMINAR POLÍTICAS DE SEGURIDAD (RLS)
-- Es necesario hacerlo antes de modificar las columnas de las que dependen.
DROP POLICY IF EXISTS "categories_select" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categories_insert" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categories_update" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categories_delete" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categorias_select" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categorias_insert" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categorias_update" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categorias_delete" ON public.categorias_de_gasto;

-- 4. ELIMINAR CATEGORÍAS PERSONALES
-- Ahora es seguro, ya que ningún gasto depende de ellas.
DELETE FROM public.categorias_de_gasto
WHERE cliente_id IS NOT NULL;

-- 5. CONSOLIDAR CATEGORÍAS GLOBALES DUPLICADAS
-- Si aún quedan categorías globales con el mismo nombre, se reasignan los gastos
-- a la más antigua y se eliminan las demás.
WITH categoria_a_mantener AS (
  SELECT
    nombre,
    (array_agg(id ORDER BY creado_en ASC))[1] AS id_a_mantener
  FROM public.categorias_de_gasto
  GROUP BY nombre
  HAVING COUNT(*) > 1
),
categorias_a_eliminar AS (
  SELECT id FROM public.categorias_de_gasto c
  JOIN categoria_a_mantener m ON c.nombre = m.nombre AND c.id != m.id_a_mantener
)
UPDATE public.gastos g
SET categoria_id = m.id_a_mantener
FROM categoria_a_mantener m
WHERE g.categoria_id IN (SELECT id FROM categorias_a_eliminar WHERE nombre = m.nombre);

-- Ahora se eliminan las categorías globales duplicadas.
DELETE FROM public.categorias_de_gasto
WHERE id IN (
  SELECT c.id FROM public.categorias_de_gasto c
  JOIN (
    SELECT nombre, (array_agg(id ORDER BY creado_en ASC))[1] AS id_a_mantener
    FROM public.categorias_de_gasto
    GROUP BY nombre
    HAVING COUNT(*) > 1
  ) AS sub ON c.nombre = sub.nombre AND c.id != sub.id_a_mantener
);


-- 6. MODIFICAR LA ESTRUCTURA DE LA TABLA
ALTER TABLE public.categorias_de_gasto
  DROP CONSTRAINT IF EXISTS uq_categories_name_user,
  DROP CONSTRAINT IF EXISTS categories_user_id_fkey,
  DROP COLUMN IF EXISTS cliente_id,
  DROP COLUMN IF EXISTS categoria_sistema;

-- 7. AÑADIR CONSTRAINT DE UNICIDAD FINAL
ALTER TABLE public.categorias_de_gasto
  ADD CONSTRAINT uq_categories_name UNIQUE (nombre);

-- 8. ACTUALIZAR ÍNDICES
DROP INDEX IF EXISTS idx_categorias_cliente_id;
DROP INDEX IF EXISTS idx_categorias_globales;
CREATE INDEX IF NOT EXISTS idx_categorias_nombre ON public.categorias_de_gasto (nombre);

-- 9. RECREAR POLÍTICAS DE SEGURIDAD (RLS)
CREATE POLICY "Permitir lectura a todos" ON public.categorias_de_gasto
    FOR SELECT USING (true);


COMMIT;