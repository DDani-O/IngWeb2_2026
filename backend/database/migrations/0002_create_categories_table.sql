-- =============================================================================
-- MIGRACIÓN: UNIFICACIÓN DE CATEGORÍAS Y RESTABLECIMIENTO DE INTEGRIDAD
-- PROYECTO: FinTrack 2026
-- DESCRIPCIÓN: Consolida 'categories' y 'categorias_de_gasto', traduce campos 
--              y reconecta FKs en gastos y ocr.
-- =============================================================================

BEGIN; -- Inicia una transacción para asegurar que todo se aplique o nada.

-- 1. LIMPIEZA DE TABLAS PREVIAS
-- Eliminamos la tabla antigua y la nueva (si existieran con esos nombres) para evitar conflictos.
DROP TABLE IF EXISTS public.categorias_de_gasto CASCADE;

-- 2. CREACIÓN DE LA TABLA UNIFICADA (Nombres en Español + Soporte Multi-usuario)
CREATE TABLE public.categorias_de_gasto (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    icono text NOT NULL,
    descripcion text NULL,
    cliente_id uuid NULL, -- NULL significa categoría global/del sistema
    categoria_sistema boolean DEFAULT false,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT categorias_de_gasto_pkey PRIMARY KEY (id),
    CONSTRAINT uq_categories_name_user UNIQUE (nombre, cliente_id),
    CONSTRAINT categorias_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- 3. CONFIGURACIÓN DE SEGURIDAD (RLS)
ALTER TABLE public.categorias_de_gasto ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver categorías globales O las suyas propias
CREATE POLICY "categorias_select" ON public.categorias_de_gasto
    FOR SELECT USING (cliente_id IS NULL OR cliente_id = auth.uid());

-- Política: Solo el usuario puede insertar sus propias categorías
CREATE POLICY "categorias_insert" ON public.categorias_de_gasto
    FOR INSERT WITH CHECK (cliente_id = auth.uid());

-- 4. REESTABLECIMIENTO DE LLAVES FORÁNEAS (RECONEXIÓN)
-- Reconectamos la tabla de GASTOS
ALTER TABLE public.gastos 
    DROP CONSTRAINT IF EXISTS gastos_categoria_id_fkey;

ALTER TABLE public.gastos
    ADD CONSTRAINT gastos_categoria_id_fkey 
    FOREIGN KEY (categoria_id) 
    REFERENCES public.categorias_de_gasto(id) 
    ON DELETE RESTRICT;

-- Reconectamos la tabla de ANALISIS_OCR
ALTER TABLE public.analisis_ocr 
    DROP CONSTRAINT IF EXISTS analisis_ocr_categoria_sugerida_id_fkey;

ALTER TABLE public.analisis_ocr
    ADD CONSTRAINT analisis_ocr_categoria_sugerida_id_fkey 
    FOREIGN KEY (categoria_sugerida_id) 
    REFERENCES public.categorias_de_gasto(id) 
    ON DELETE SET NULL;

-- Reconectamos la tabla de ANALISIS_DE_CONSUMO
ALTER TABLE public.analisis_de_consumo 
    DROP CONSTRAINT IF EXISTS analisis_de_consumo_categoria_dominante_id_fkey;

ALTER TABLE public.analisis_de_consumo
    ADD CONSTRAINT analisis_de_consumo_categoria_dominante_id_fkey 
    FOREIGN KEY (categoria_dominante_id) 
    REFERENCES public.categorias_de_gasto(id) 
    ON DELETE SET NULL;

-- 5. SEMILLA DE DATOS (SEEDING)
-- Insertamos las categorías globales iniciales
INSERT INTO public.categorias_de_gasto (nombre, icono, cliente_id, categoria_sistema)
VALUES 
    ('Alimentación', '🍔', null, true),
    ('Transporte', '🚗', null, true),
    ('Entretenimiento', '🎬', null, true),
    ('Salud', '⚕️', null, true),
    ('Educación', '📚', null, true),
    ('Hogar', '🏠', null, true),
    ('Servicios', '⚙️', null, true),
    ('Otros', '📦', null, true)
ON CONFLICT (nombre, cliente_id) DO NOTHING;

COMMIT; -- Finaliza la transacción con éxito.