-- =============================================================================
-- MIGRACIÓN: Refactor a Categorías Globales Únicamente
-- PROYECTO: FinTrack 2026
-- DESCRIPCIÓN: Elimina capacidad de usuarios crear categorías personalizadas.
--              Solo quedan categorías globales (cliente_id = NULL)
-- =============================================================================

BEGIN;

-- 1. CONSOLIDAR CATEGORÍAS DUPLICADAS
-- Para cada nombre duplicado, mantener la categoría global (cliente_id IS NULL)
-- y reasignar todos los gastos a esa categoría
WITH duplicados AS (
  SELECT nombre, MIN(id) AS categoria_a_mantener
  FROM public.categorias_de_gasto
  WHERE cliente_id IS NULL  -- Solo categorías globales
  GROUP BY nombre
  HAVING COUNT(*) > 1
)
UPDATE public.gastos g
SET categoria_id = d.categoria_a_mantener
FROM duplicados d
WHERE g.categoria_id IN (
  SELECT id FROM public.categorias_de_gasto
  WHERE nombre = d.nombre AND cliente_id IS NULL AND id != d.categoria_a_mantener
);

-- 2. LIMPIEZA: Eliminar gastos huérfanos (asociados a categorías personales)
DELETE FROM public.gastos
WHERE categoria_id IN (
  SELECT id FROM public.categorias_de_gasto 
  WHERE cliente_id IS NOT NULL
);

-- 3. ELIMINAR todas las RLS POLICIES PRIMERO (antes de eliminar columnas que usan)
DROP POLICY IF EXISTS "categories_select" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categories_insert" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categories_update" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categories_delete" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categorias_select" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categorias_insert" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categorias_update" ON public.categorias_de_gasto;
DROP POLICY IF EXISTS "categorias_delete" ON public.categorias_de_gasto;

-- 4. ELIMINAR categorías personales (cliente_id IS NOT NULL)
DELETE FROM public.categorias_de_gasto
WHERE cliente_id IS NOT NULL;

-- 5. ELIMINAR DUPLICADAS: Para cada nombre, mantener solo la más antigua (creado_en ASC)
DELETE FROM public.categorias_de_gasto c1
WHERE EXISTS (
  SELECT 1 FROM public.categorias_de_gasto c2
  WHERE c1.nombre = c2.nombre
  AND c1.id != c2.id
  AND c1.creado_en > c2.creado_en
);

-- 6. MODIFICAR TABLA: Eliminar cliente_id, categoria_sistema, unique constraint
ALTER TABLE public.categorias_de_gasto
  DROP CONSTRAINT IF EXISTS uq_categories_name_user;

ALTER TABLE public.categorias_de_gasto
  DROP CONSTRAINT IF EXISTS categories_user_id_fkey;

ALTER TABLE public.categorias_de_gasto
  DROP COLUMN IF EXISTS cliente_id;

ALTER TABLE public.categorias_de_gasto
  DROP COLUMN IF EXISTS categoria_sistema;

-- 7. Agregar constraint UNIQUE solo sobre nombre (sin cliente_id)
ALTER TABLE public.categorias_de_gasto
  ADD CONSTRAINT uq_categories_name UNIQUE (nombre);

-- 8. ELIMINAR índices relacionados a cliente_id
DROP INDEX IF EXISTS idx_categorias_cliente_id;
DROP INDEX IF EXISTS idx_categorias_globales;

-- 9. CREAR índice de búsqueda por nombre (más eficiente ahora)
CREATE INDEX IF NOT EXISTS idx_categorias_nombre 
  ON public.categorias_de_gasto (nombre) 
  WHERE nombre IS NOT NULL;

-- 10. CREAR NUEVAS RLS POLICIES (solo lectura global, INSERT/UPDATE/DELETE solo admin)
CREATE POLICY "categorias_read_only" ON public.categorias_de_gasto
    FOR SELECT 
    USING (true);  -- Todos pueden leer

CREATE POLICY "categorias_admin_only" ON public.categorias_de_gasto
    FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() AND u.rol = 'admin'
      )
    );

CREATE POLICY "categorias_admin_update" ON public.categorias_de_gasto
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() AND u.rol = 'admin'
      )
    );

CREATE POLICY "categorias_admin_delete" ON public.categorias_de_gasto
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() AND u.rol = 'admin'
      )
    );

COMMIT;
