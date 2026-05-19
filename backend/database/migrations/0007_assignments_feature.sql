-- ============================================================================
-- FILE: 0007_assignments_feature.sql
-- DESCRIPCIÓN: Agregar capacidad máxima, teléfono, país a perfiles_asesores
--              y crear funciones para asignación automática balanceada
-- ============================================================================

BEGIN;

-- =========================================================
-- 1. Agregar Columnas a perfiles_asesores
-- =========================================================

ALTER TABLE public.perfiles_asesores
ADD COLUMN capacidad_maxima SMALLINT NOT NULL DEFAULT 5
  CONSTRAINT chk_capacidad_maxima_positiva CHECK (capacidad_maxima > 0);

ALTER TABLE public.perfiles_asesores
ADD COLUMN telefono TEXT NULL;

ALTER TABLE public.perfiles_asesores
ADD COLUMN pais TEXT NULL;

-- =========================================================
-- 2. Commentarios Documentativos
-- =========================================================

COMMENT ON COLUMN public.perfiles_asesores.capacidad_maxima IS
  'Capacidad máxima de clientes que este asesor puede tener. Editable por el asesor.';

COMMENT ON COLUMN public.perfiles_asesores.telefono IS
  'Teléfono de contacto del asesor. Utilizado para comunicación con clientes.';

COMMENT ON COLUMN public.perfiles_asesores.pais IS
  'País o región donde el asesor opera. Filtro potencial para asignaciones locales.';

-- =========================================================
-- 3. Índices para Asignación Automática
-- =========================================================

-- Índice para obtener asignaciones activas de un asesor
CREATE INDEX IF NOT EXISTS idx_asignaciones_asesor_activo
ON public.asignaciones_de_clientes(asesor_id, activo DESC)
WHERE activo = true;

-- Índice para contar clientes activos de un asesor (CRITICAL para asignación)
CREATE INDEX IF NOT EXISTS idx_asignaciones_count_activos
ON public.asignaciones_de_clientes(asesor_id)
WHERE activo = true;

-- Índice para búsqueda rápida de asignación existente (evite duplicados)
CREATE INDEX IF NOT EXISTS idx_asignaciones_unique_lookup
ON public.asignaciones_de_clientes(cliente_id, asesor_id)
WHERE activo = true;

-- =========================================================
-- 4. Función para Contar Clientes Activos (Uso en queries)
-- =========================================================

CREATE OR REPLACE FUNCTION public.contar_clientes_activos(p_asesor_id uuid)
RETURNS INTEGER LANGUAGE sql STABLE AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.asignaciones_de_clientes
    WHERE asesor_id = p_asesor_id AND activo = true;
$$;

COMMENT ON FUNCTION public.contar_clientes_activos(uuid) IS
  'Calcula dinámicamente cantidad de clientes activos asignados a un asesor.';

-- =========================================================
-- 5. Función para Obtener Asesor Disponible (Asignación automática)
-- =========================================================

CREATE OR REPLACE FUNCTION public.obtener_asesor_disponible()
RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT u.id
    FROM public.usuarios u
    INNER JOIN public.perfiles_asesores pa ON u.id = pa.usuario_id
    WHERE u.rol = 'asesor' 
      AND u.estado = 'activo'
      AND pa.capacidad_maxima > 0
      AND (
        SELECT COUNT(ac.cliente_id)
        FROM public.asignaciones_de_clientes ac
        WHERE ac.asesor_id = u.id AND ac.activo = true
      ) < pa.capacidad_maxima
    ORDER BY (
      SELECT COUNT(ac.cliente_id)
      FROM public.asignaciones_de_clientes ac
      WHERE ac.asesor_id = u.id AND ac.activo = true
    ) ASC
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.obtener_asesor_disponible() IS
  'Obtiene el asesor activo con menos clientes que tenga capacidad disponible. Usado para asignación automática balanceada.';

-- =========================================================
-- 6. Trigger para Validar Capacidad en Inserciones
-- =========================================================

CREATE OR REPLACE FUNCTION public.validar_capacidad_asesor_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_capacidad SMALLINT;
  v_clientes_actuales INTEGER;
BEGIN
  -- Obtener capacidad del asesor
  SELECT capacidad_maxima INTO v_capacidad
  FROM public.perfiles_asesores
  WHERE usuario_id = NEW.asesor_id;
  
  IF v_capacidad IS NULL THEN
    RAISE EXCEPTION 'El asesor no existe o no tiene perfil';
  END IF;
  
  -- Contar clientes activos actuales
  SELECT COUNT(*)::INTEGER INTO v_clientes_actuales
  FROM public.asignaciones_de_clientes
  WHERE asesor_id = NEW.asesor_id AND activo = true;
  
  -- Validar que no exceda capacidad
  IF v_clientes_actuales >= v_capacidad THEN
    RAISE EXCEPTION 'El asesor ha alcanzado su capacidad máxima de % clientes', v_capacidad;
  END IF;
  
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validar_capacidad_asesor ON public.asignaciones_de_clientes;
CREATE TRIGGER trg_validar_capacidad_asesor
BEFORE INSERT ON public.asignaciones_de_clientes
FOR EACH ROW
WHEN (NEW.activo = true)
EXECUTE FUNCTION public.validar_capacidad_asesor_insert();

COMMENT ON TRIGGER trg_validar_capacidad_asesor ON public.asignaciones_de_clientes IS
  'Valida que no se exceda la capacidad máxima del asesor al insertar asignaciones activas.';

-- =========================================================
-- 7. Trigger para set actualizado_en en perfiles_asesores
-- =========================================================

DROP TRIGGER IF EXISTS trg_perfiles_asesores_actualizado_en ON public.perfiles_asesores;
CREATE TRIGGER trg_perfiles_asesores_actualizado_en 
BEFORE UPDATE ON public.perfiles_asesores 
FOR EACH ROW 
EXECUTE FUNCTION public.set_actualizado_en();

-- =========================================================
-- 8. Actualizar Política de RLS para perfiles_asesores
-- =========================================================

-- Los asesores pueden ver su propio perfil
DROP POLICY IF EXISTS "perfiles_asesores_select" ON public.perfiles_asesores;
CREATE POLICY "perfiles_asesores_select" ON public.perfiles_asesores
  FOR SELECT
  USING (usuario_id = auth.uid());

-- Los asesores pueden actualizar su propio perfil
DROP POLICY IF EXISTS "perfiles_asesores_update" ON public.perfiles_asesores;
CREATE POLICY "perfiles_asesores_update" ON public.perfiles_asesores
  FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- =========================================================
-- 9. Actualizar Política de RLS para asignaciones_de_clientes
-- =========================================================

ALTER TABLE public.asignaciones_de_clientes ENABLE ROW LEVEL SECURITY;

-- Asesores pueden ver sus propias asignaciones
DROP POLICY IF EXISTS "asignaciones_select_asesor" ON public.asignaciones_de_clientes;
CREATE POLICY "asignaciones_select_asesor" ON public.asignaciones_de_clientes
  FOR SELECT
  USING (asesor_id = auth.uid() OR cliente_id = auth.uid());

-- Service role puede insertar asignaciones (desde auth.service)
DROP POLICY IF EXISTS "asignaciones_insert" ON public.asignaciones_de_clientes;
CREATE POLICY "asignaciones_insert" ON public.asignaciones_de_clientes
  FOR INSERT
  WITH CHECK (true);

-- Asesores pueden actualizar estado activo
DROP POLICY IF EXISTS "asignaciones_update" ON public.asignaciones_de_clientes;
CREATE POLICY "asignaciones_update" ON public.asignaciones_de_clientes
  FOR UPDATE
  USING (asesor_id = auth.uid())
  WITH CHECK (asesor_id = auth.uid());

COMMENT ON TABLE public.asignaciones_de_clientes IS
  'Relación entre asesores y clientes. clientes_activos se calcula dinámicamente con COUNT(*) WHERE activo=true, no se persiste.';

COMMIT;
