-- =============================================================================
-- MIGRACIÓN CONSOLIDADA: Esquema Completo v1
-- PROYECTO: FinTrack 2026
-- DESCRIPCIÓN: Unificación de todas las tablas, tipos, funciones, triggers y
--              políticas de seguridad (RLS) en un único archivo de referencia.
-- =============================================================================

BEGIN;

-- =========================================================
-- 1. Extensiones y Tipos ENUM
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE public.rol_usuario AS ENUM ('cliente', 'asesor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.estado_usuario AS ENUM ('activo', 'inactivo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.origen_gasto AS ENUM ('manual', 'ticket'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.estado_ocr AS ENUM ('pendiente', 'procesado', 'fallido'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.estado_ticket AS ENUM ('subido', 'procesando', 'procesado', 'error'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.origen_recomendacion AS ENUM ('sistema', 'asesor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_recomendacion AS ENUM ('sugerencia', 'alerta', 'observacion'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.prioridad_recomendacion AS ENUM ('baja', 'media', 'alta'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.estado_recomendacion AS ENUM ('pendiente', 'completada', 'descartada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_mensaje_asesor AS ENUM ('mensaje', 'ticket'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 2. Funciones Core y Helpers
-- =========================================================

CREATE OR REPLACE FUNCTION public.es_service_role()
RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

CREATE OR REPLACE FUNCTION public.set_actualizado_en()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.es_asesor_asignado_a_cliente(p_cliente_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.asignaciones_de_clientes ac
        WHERE ac.cliente_id = p_cliente_id AND ac.asesor_id = auth.uid() AND ac.activo = true
    );
$$;

CREATE OR REPLACE FUNCTION public.analisis_ocr_cliente_referencia(p_ticket_id uuid, p_gasto_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT coalesce(
        (SELECT t.cliente_id FROM public.tickets t WHERE t.id = p_ticket_id),
        (SELECT g.cliente_id FROM public.gastos g WHERE g.id = p_gasto_id)
    );
$$;

-- =========================================================
-- 3. Tablas Principales
-- =========================================================

CREATE TABLE IF NOT EXISTS public.usuarios (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rol public.rol_usuario NOT NULL,
    nombre_completo text NOT NULL,
    email text NULL,
    foto_perfil_url text NULL,
    biografia text NULL,
    estado public.estado_usuario NOT NULL DEFAULT 'activo',
    ultimo_acceso timestamptz NULL,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perfiles_usuarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    ocupacion text NULL,
    ingreso_estimado numeric(12,2) NULL,
    objetivo_financiero text NULL,
    moneda_preferida char(3) NULL,
    telefono text NULL,
    ciudad text NULL,
    ahorro_objetivo numeric(12,2) NULL,
    umbral_alerta numeric(5,2) NULL,
    tema text NULL DEFAULT 'dark',
    notificar_email boolean NOT NULL DEFAULT true,
    notificar_push boolean NOT NULL DEFAULT false,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perfiles_asesores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    matricula text NULL UNIQUE,
    especialidad text NULL,
    descripcion text NULL,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asignaciones_de_clientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asesor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    cliente_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    activo boolean NOT NULL DEFAULT true,
    asignado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_asignaciones_de_clientes UNIQUE (asesor_id, cliente_id)
);

CREATE TABLE IF NOT EXISTS public.categorias_de_gasto (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL UNIQUE,
    descripcion text NULL,
    icono text NULL,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    url_archivo text NOT NULL,
    nombre_archivo text NULL,
    tipo_mime text NULL,
    tamano_bytes bigint NULL,
    estado_procesamiento public.estado_ticket NOT NULL DEFAULT 'subido',
    subido_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gastos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    categoria_id uuid NOT NULL REFERENCES public.categorias_de_gasto(id) ON DELETE RESTRICT,
    comercio text NOT NULL,
    fecha_gasto date NOT NULL,
    monto numeric(12,2) NOT NULL,
    descripcion text NULL,
    origen public.origen_gasto NOT NULL,
    moneda char(3) NOT NULL DEFAULT 'ARS',
    ticket_principal_id uuid NULL REFERENCES public.tickets(id) ON DELETE SET NULL,
    ocr_estado public.estado_ocr NOT NULL DEFAULT 'pendiente',
    ocr_confianza numeric(5,2) NULL,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_gastos_monto_positivo CHECK (monto > 0),
    CONSTRAINT chk_gastos_ocr_confianza CHECK (ocr_confianza IS NULL OR (ocr_confianza >= 0 AND ocr_confianza <= 100))
);

CREATE TABLE IF NOT EXISTS public.analisis_ocr (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    gasto_id uuid NULL REFERENCES public.gastos(id) ON DELETE SET NULL,
    texto_extraido text NULL,
    comercio_detectado text NULL,
    fecha_detectada date NULL,
    monto_detectado numeric(12,2) NULL,
    categoria_sugerida_id uuid NULL REFERENCES public.categorias_de_gasto(id) ON DELETE SET NULL,
    confianza_general numeric(5,2) NULL,
    respuesta_modelo jsonb NULL,
    creado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_analisis_ocr_confianza CHECK (confianza_general IS NULL OR (confianza_general >= 0 AND confianza_general <= 100)),
    CONSTRAINT chk_analisis_ocr_monto CHECK (monto_detectado IS NULL OR monto_detectado > 0)
);

CREATE TABLE IF NOT EXISTS public.recomendaciones_financieras (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    asesor_id uuid NULL REFERENCES public.usuarios(id) ON DELETE SET NULL,
    origen public.origen_recomendacion NOT NULL,
    tipo public.tipo_recomendacion NOT NULL,
    titulo text NOT NULL,
    mensaje text NOT NULL,
    prioridad public.prioridad_recomendacion NOT NULL DEFAULT 'media',
    leida boolean NOT NULL DEFAULT false,
    leida_en timestamptz NULL,
    icono text NULL,
    problema text NULL,
    solucion text NULL,
    ahorro_potencial numeric(12,2) NULL,
    pasos_implementacion text[] NULL,
    estado public.estado_recomendacion NOT NULL DEFAULT 'pendiente',
    creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perfiles_de_gasto (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL UNIQUE,
    descripcion text NULL,
    criterio_regla jsonb NULL,
    activo boolean NOT NULL DEFAULT true,
    creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clasificacion_de_perfil (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    perfil_id uuid NOT NULL REFERENCES public.perfiles_de_gasto(id) ON DELETE RESTRICT,
    asesor_id uuid NULL REFERENCES public.usuarios(id) ON DELETE SET NULL,
    puntaje numeric(5,2) NULL,
    motivo text NULL,
    vigente_desde timestamptz NOT NULL DEFAULT now(),
    vigente_hasta timestamptz NULL,
    creado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_clasificacion_puntaje CHECK (puntaje IS NULL OR (puntaje >= 0 AND puntaje <= 100))
);

CREATE TABLE IF NOT EXISTS public.analisis_de_consumo (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    periodo_inicio date NOT NULL,
    periodo_fin date NOT NULL,
    gasto_total numeric(12,2) NOT NULL,
    gasto_promedio numeric(12,2) NULL,
    categoria_dominante_id uuid NULL REFERENCES public.categorias_de_gasto(id) ON DELETE SET NULL,
    comercio_mas_frecuente text NULL,
    dia_mayor_gasto smallint NULL,
    cantidad_gastos int NOT NULL,
    gastos_inusuales_detectados int NOT NULL DEFAULT 0,
    creado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_analisis_consumo_dia CHECK (dia_mayor_gasto IS NULL OR (dia_mayor_gasto BETWEEN 1 AND 7)),
    CONSTRAINT uq_analisis_consumo UNIQUE (cliente_id, periodo_inicio, periodo_fin)
);

CREATE TABLE IF NOT EXISTS public.mensajes_asesor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asesor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    cliente_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    remitente_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    destinatario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo public.tipo_mensaje_asesor NOT NULL DEFAULT 'mensaje',
    asunto text NULL,
    contenido text NOT NULL,
    leido boolean NOT NULL DEFAULT false,
    leido_en timestamptz NULL,
    creado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_mensajes_asesor_partes CHECK (
        (remitente_id = asesor_id AND destinatario_id = cliente_id)
        OR (remitente_id = cliente_id AND destinatario_id = asesor_id)
    )
);

-- =========================================================
-- 4. Funciones de Validación (Validadores)
-- =========================================================

CREATE OR REPLACE FUNCTION public.validar_usuarios()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF tg_op = 'UPDATE' THEN
        IF NEW.rol IS DISTINCT FROM OLD.rol AND NOT public.es_service_role() THEN
            RAISE EXCEPTION 'No se permite modificar el rol fuera de service_role';
        END IF;
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validar_perfiles_usuarios()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_rol public.rol_usuario;
BEGIN
    SELECT u.rol INTO v_rol FROM public.usuarios u WHERE u.id = NEW.usuario_id;
    IF v_rol IS DISTINCT FROM 'cliente' THEN
        RAISE EXCEPTION 'perfiles_usuarios solo puede referenciar usuarios con rol cliente';
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validar_perfiles_asesores()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_rol public.rol_usuario;
BEGIN
    SELECT u.rol INTO v_rol FROM public.usuarios u WHERE u.id = NEW.usuario_id;
    IF v_rol IS DISTINCT FROM 'asesor' THEN
        RAISE EXCEPTION 'perfiles_asesores solo puede referenciar usuarios con rol asesor';
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validar_asignaciones_de_clientes()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_rol_asesor public.rol_usuario;
    v_rol_cliente public.rol_usuario;
BEGIN
    IF NEW.asesor_id = NEW.cliente_id THEN RAISE EXCEPTION 'asesor_id y cliente_id no pueden ser iguales'; END IF;
    SELECT u.rol INTO v_rol_asesor FROM public.usuarios u WHERE u.id = NEW.asesor_id;
    SELECT u.rol INTO v_rol_cliente FROM public.usuarios u WHERE u.id = NEW.cliente_id;
    IF v_rol_asesor IS DISTINCT FROM 'asesor' THEN RAISE EXCEPTION 'asesor_id debe referenciar un usuario con rol asesor'; END IF;
    IF v_rol_cliente IS DISTINCT FROM 'cliente' THEN RAISE EXCEPTION 'cliente_id debe referenciar un usuario con rol cliente'; END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validar_gastos()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_rol public.rol_usuario;
BEGIN
    SELECT u.rol INTO v_rol FROM public.usuarios u WHERE u.id = NEW.cliente_id;
    IF v_rol IS DISTINCT FROM 'cliente' THEN RAISE EXCEPTION 'gastos.cliente_id debe referenciar un usuario con rol cliente'; END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validar_tickets()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_rol public.rol_usuario;
BEGIN
    SELECT u.rol INTO v_rol FROM public.usuarios u WHERE u.id = NEW.cliente_id;
    IF v_rol IS DISTINCT FROM 'cliente' THEN RAISE EXCEPTION 'tickets.cliente_id debe referenciar un usuario con rol cliente'; END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validar_recomendaciones_financieras()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_rol_cliente public.rol_usuario;
    v_rol_asesor public.rol_usuario;
BEGIN
    SELECT u.rol INTO v_rol_cliente FROM public.usuarios u WHERE u.id = NEW.cliente_id;
    IF v_rol_cliente IS DISTINCT FROM 'cliente' THEN RAISE EXCEPTION 'recomendaciones_financieras.cliente_id debe referenciar un usuario con rol cliente'; END IF;
    IF NEW.asesor_id IS NOT NULL THEN
        SELECT u.rol INTO v_rol_asesor FROM public.usuarios u WHERE u.id = NEW.asesor_id;
        IF v_rol_asesor IS DISTINCT FROM 'asesor' THEN RAISE EXCEPTION 'recomendaciones_financieras.asesor_id debe referenciar un usuario con rol asesor'; END IF;
    END IF;
    IF tg_op = 'INSERT' THEN
        IF NOT public.es_service_role() THEN
            IF NEW.origen <> 'asesor' THEN RAISE EXCEPTION 'Solo service_role puede crear recomendaciones de origen sistema'; END IF;
            IF NEW.asesor_id IS NULL OR NEW.asesor_id <> auth.uid() THEN RAISE EXCEPTION 'El asesor_id debe coincidir con auth.uid() al crear recomendaciones manuales'; END IF;
            IF NOT public.es_asesor_asignado_a_cliente(NEW.cliente_id) THEN RAISE EXCEPTION 'El asesor no tiene asignacion activa para este cliente'; END IF;
        END IF;
    END IF;
    IF tg_op = 'UPDATE' THEN
        IF public.es_service_role() THEN RETURN NEW; END IF;
        IF auth.uid() = OLD.cliente_id THEN
            IF NEW.titulo IS DISTINCT FROM OLD.titulo OR NEW.mensaje IS DISTINCT FROM OLD.mensaje OR NEW.prioridad IS DISTINCT FROM OLD.prioridad OR NEW.origen IS DISTINCT FROM OLD.origen OR NEW.tipo IS DISTINCT FROM OLD.tipo OR NEW.asesor_id IS DISTINCT FROM OLD.asesor_id OR NEW.cliente_id IS DISTINCT FROM OLD.cliente_id OR NEW.icono IS DISTINCT FROM OLD.icono OR NEW.problema IS DISTINCT FROM OLD.problema OR NEW.solucion IS DISTINCT FROM OLD.solucion OR NEW.ahorro_potencial IS DISTINCT FROM OLD.ahorro_potencial OR NEW.pasos_implementacion IS DISTINCT FROM OLD.pasos_implementacion THEN
                RAISE EXCEPTION 'El cliente solo puede modificar leida, leida_en y estado';
            END IF;
        ELSIF auth.uid() = OLD.asesor_id THEN NULL;
        ELSE RAISE EXCEPTION 'No tiene permisos para actualizar esta recomendacion'; END IF;
        IF NEW.leida = true AND OLD.leida IS DISTINCT FROM true THEN NEW.leida_en := coalesce(NEW.leida_en, now());
        ELSIF NEW.leida = false THEN NEW.leida_en := NULL; END IF;
        IF NEW.estado IS DISTINCT FROM OLD.estado AND NEW.estado IN ('completada', 'descartada') THEN
            NEW.leida := true; NEW.leida_en := coalesce(NEW.leida_en, now());
        END IF;
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validar_clasificacion_de_perfil()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_rol_cliente public.rol_usuario; v_rol_asesor public.rol_usuario;
BEGIN
    SELECT u.rol INTO v_rol_cliente FROM public.usuarios u WHERE u.id = NEW.cliente_id;
    IF v_rol_cliente IS DISTINCT FROM 'cliente' THEN RAISE EXCEPTION 'clasificacion_de_perfil.cliente_id debe referenciar un usuario con rol cliente'; END IF;
    IF NEW.asesor_id IS NOT NULL THEN
        SELECT u.rol INTO v_rol_asesor FROM public.usuarios u WHERE u.id = NEW.asesor_id;
        IF v_rol_asesor IS DISTINCT FROM 'asesor' THEN RAISE EXCEPTION 'clasificacion_de_perfil.asesor_id debe referenciar un usuario con rol asesor'; END IF;
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validar_analisis_de_consumo()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_rol_cliente public.rol_usuario;
BEGIN
    SELECT u.rol INTO v_rol_cliente FROM public.usuarios u WHERE u.id = NEW.cliente_id;
    IF v_rol_cliente IS DISTINCT FROM 'cliente' THEN RAISE EXCEPTION 'analisis_de_consumo.cliente_id debe referenciar un usuario con rol cliente'; END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validar_mensajes_asesor()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_rol_cliente public.rol_usuario; v_rol_asesor public.rol_usuario; v_asignado boolean;
BEGIN
    SELECT u.rol INTO v_rol_cliente FROM public.usuarios u WHERE u.id = NEW.cliente_id;
    IF v_rol_cliente IS DISTINCT FROM 'cliente' THEN RAISE EXCEPTION 'mensajes_asesor.cliente_id debe referenciar un usuario con rol cliente'; END IF;
    SELECT u.rol INTO v_rol_asesor FROM public.usuarios u WHERE u.id = NEW.asesor_id;
    IF v_rol_asesor IS DISTINCT FROM 'asesor' THEN RAISE EXCEPTION 'mensajes_asesor.asesor_id debe referenciar un usuario con rol asesor'; END IF;
    IF tg_op = 'INSERT' THEN
        SELECT EXISTS (SELECT 1 FROM public.asignaciones_de_clientes ac WHERE ac.cliente_id = NEW.cliente_id AND ac.asesor_id = NEW.asesor_id AND ac.activo = true) INTO v_asignado;
        IF NOT v_asignado THEN RAISE EXCEPTION 'El asesor no tiene asignacion activa para este cliente'; END IF;
        IF NOT public.es_service_role() THEN
            IF auth.uid() IS NULL OR auth.uid() <> NEW.remitente_id THEN RAISE EXCEPTION 'El remitente debe coincidir con auth.uid()'; END IF;
            IF auth.uid() = NEW.asesor_id THEN
                IF NEW.remitente_id <> NEW.asesor_id OR NEW.destinatario_id <> NEW.cliente_id THEN RAISE EXCEPTION 'El asesor debe enviar mensajes al cliente asignado'; END IF;
            ELSIF auth.uid() = NEW.cliente_id THEN
                IF NEW.remitente_id <> NEW.cliente_id OR NEW.destinatario_id <> NEW.asesor_id THEN RAISE EXCEPTION 'El cliente debe enviar mensajes a su asesor asignado'; END IF;
            ELSE RAISE EXCEPTION 'No tiene permisos para enviar mensajes en esta conversacion'; END IF;
        END IF;
    END IF;
    IF tg_op = 'UPDATE' THEN
        IF public.es_service_role() THEN RETURN NEW; END IF;
        IF auth.uid() = OLD.destinatario_id THEN
            IF NEW.asunto IS DISTINCT FROM OLD.asunto OR NEW.contenido IS DISTINCT FROM OLD.contenido OR NEW.tipo IS DISTINCT FROM OLD.tipo OR NEW.asesor_id IS DISTINCT FROM OLD.asesor_id OR NEW.cliente_id IS DISTINCT FROM OLD.cliente_id OR NEW.remitente_id IS DISTINCT FROM OLD.remitente_id OR NEW.destinatario_id IS DISTINCT FROM OLD.destinatario_id OR NEW.creado_en IS DISTINCT FROM OLD.creado_en THEN
                RAISE EXCEPTION 'Solo puede actualizar el estado de lectura';
            END IF;
            IF NEW.leido = true AND OLD.leido IS DISTINCT FROM true THEN NEW.leida_en := coalesce(NEW.leida_en, now());
            ELSIF NEW.leido = false THEN NEW.leida_en := NULL; END IF;
        ELSE RAISE EXCEPTION 'No tiene permisos para actualizar este mensaje'; END IF;
    END IF;
    RETURN NEW;
END; $$;

-- =========================================================
-- 5. Triggers
-- =========================================================

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_usuarios_actualizado_en ON public.usuarios;
CREATE TRIGGER trg_usuarios_actualizado_en BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

DROP TRIGGER IF EXISTS trg_perfiles_usuarios_actualizado_en ON public.perfiles_usuarios;
CREATE TRIGGER trg_perfiles_usuarios_actualizado_en BEFORE UPDATE ON public.perfiles_usuarios FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

DROP TRIGGER IF EXISTS trg_perfiles_asesores_actualizado_en ON public.perfiles_asesores;
CREATE TRIGGER trg_perfiles_asesores_actualizado_en BEFORE UPDATE ON public.perfiles_asesores FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

DROP TRIGGER IF EXISTS trg_asignaciones_de_clientes_actualizado_en ON public.asignaciones_de_clientes;
CREATE TRIGGER trg_asignaciones_de_clientes_actualizado_en BEFORE UPDATE ON public.asignaciones_de_clientes FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

DROP TRIGGER IF EXISTS trg_gastos_actualizado_en ON public.gastos;
CREATE TRIGGER trg_gastos_actualizado_en BEFORE UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

-- validación triggers
DROP TRIGGER IF EXISTS trg_validar_usuarios ON public.usuarios;
CREATE TRIGGER trg_validar_usuarios BEFORE INSERT OR UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.validar_usuarios();

DROP TRIGGER IF EXISTS trg_validar_perfiles_usuarios ON public.perfiles_usuarios;
CREATE TRIGGER trg_validar_perfiles_usuarios BEFORE INSERT OR UPDATE ON public.perfiles_usuarios FOR EACH ROW EXECUTE FUNCTION public.validar_perfiles_usuarios();

DROP TRIGGER IF EXISTS trg_validar_perfiles_asesores ON public.perfiles_asesores;
CREATE TRIGGER trg_validar_perfiles_asesores BEFORE INSERT OR UPDATE ON public.perfiles_asesores FOR EACH ROW EXECUTE FUNCTION public.validar_perfiles_asesores();

DROP TRIGGER IF EXISTS trg_validar_asignaciones_de_clientes ON public.asignaciones_de_clientes;
CREATE TRIGGER trg_validar_asignaciones_de_clientes BEFORE INSERT OR UPDATE ON public.asignaciones_de_clientes FOR EACH ROW EXECUTE FUNCTION public.validar_asignaciones_de_clientes();

DROP TRIGGER IF EXISTS trg_validar_gastos ON public.gastos;
CREATE TRIGGER trg_validar_gastos BEFORE INSERT OR UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION public.validar_gastos();

DROP TRIGGER IF EXISTS trg_validar_tickets ON public.tickets;
CREATE TRIGGER trg_validar_tickets BEFORE INSERT OR UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.validar_tickets();

DROP TRIGGER IF EXISTS trg_validar_recomendaciones_financieras ON public.recomendaciones_financieras;
CREATE TRIGGER trg_validar_recomendaciones_financieras BEFORE INSERT OR UPDATE ON public.recomendaciones_financieras FOR EACH ROW EXECUTE FUNCTION public.validar_recomendaciones_financieras();

DROP TRIGGER IF EXISTS trg_validar_clasificacion_de_perfil ON public.clasificacion_de_perfil;
CREATE TRIGGER trg_validar_clasificacion_de_perfil BEFORE INSERT OR UPDATE ON public.clasificacion_de_perfil FOR EACH ROW EXECUTE FUNCTION public.validar_clasificacion_de_perfil();

DROP TRIGGER IF EXISTS trg_validar_analisis_de_consumo ON public.analisis_de_consumo;
CREATE TRIGGER trg_validar_analisis_de_consumo BEFORE INSERT OR UPDATE ON public.analisis_de_consumo FOR EACH ROW EXECUTE FUNCTION public.validar_analisis_de_consumo();

DROP TRIGGER IF EXISTS trg_validar_mensajes_asesor ON public.mensajes_asesor;
CREATE TRIGGER trg_validar_mensajes_asesor BEFORE INSERT OR UPDATE ON public.mensajes_asesor FOR EACH ROW EXECUTE FUNCTION public.validar_mensajes_asesor();

-- =========================================================
-- 6. Row Level Security (RLS)
-- =========================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_asesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones_de_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_de_gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_ocr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recomendaciones_financieras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_de_gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clasificacion_de_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_de_consumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_asesor ENABLE ROW LEVEL SECURITY;

-- usuarios
DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT USING (auth.uid() = id OR (rol = 'cliente' AND public.es_asesor_asignado_a_cliente(id)));

DROP POLICY IF EXISTS "usuarios_insert" ON public.usuarios;
CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- perfiles_usuarios
DROP POLICY IF EXISTS "perfiles_usuarios_select" ON public.perfiles_usuarios;
CREATE POLICY "perfiles_usuarios_select" ON public.perfiles_usuarios FOR SELECT USING (usuario_id = auth.uid() OR public.es_asesor_asignado_a_cliente(usuario_id));

DROP POLICY IF EXISTS "perfiles_usuarios_insert" ON public.perfiles_usuarios;
CREATE POLICY "perfiles_usuarios_insert" ON public.perfiles_usuarios FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "perfiles_usuarios_update" ON public.perfiles_usuarios;
CREATE POLICY "perfiles_usuarios_update" ON public.perfiles_usuarios FOR UPDATE USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

-- perfiles_asesores
DROP POLICY IF EXISTS "perfiles_asesores_select" ON public.perfiles_asesores;
CREATE POLICY "perfiles_asesores_select" ON public.perfiles_asesores FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "perfiles_asesores_insert" ON public.perfiles_asesores;
CREATE POLICY "perfiles_asesores_insert" ON public.perfiles_asesores FOR INSERT WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "perfiles_asesores_update" ON public.perfiles_asesores;
CREATE POLICY "perfiles_asesores_update" ON public.perfiles_asesores FOR UPDATE USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

-- asignaciones_de_clientes
DROP POLICY IF EXISTS "asignaciones_select" ON public.asignaciones_de_clientes;
CREATE POLICY "asignaciones_select" ON public.asignaciones_de_clientes FOR SELECT USING (asesor_id = auth.uid() OR cliente_id = auth.uid());

DROP POLICY IF EXISTS "asignaciones_insert" ON public.asignaciones_de_clientes;
CREATE POLICY "asignaciones_insert" ON public.asignaciones_de_clientes FOR INSERT WITH CHECK (asesor_id = auth.uid());

DROP POLICY IF EXISTS "asignaciones_update" ON public.asignaciones_de_clientes;
CREATE POLICY "asignaciones_update" ON public.asignaciones_de_clientes FOR UPDATE USING (asesor_id = auth.uid()) WITH CHECK (asesor_id = auth.uid());

-- categorias_de_gasto (PÚBLICA)
DROP POLICY IF EXISTS "categorias_select" ON public.categorias_de_gasto;
CREATE POLICY "categorias_select" ON public.categorias_de_gasto FOR SELECT USING (true);

-- gastos
DROP POLICY IF EXISTS "gastos_select" ON public.gastos;
CREATE POLICY "gastos_select" ON public.gastos FOR SELECT USING (cliente_id = auth.uid() OR public.es_asesor_asignado_a_cliente(cliente_id));

DROP POLICY IF EXISTS "gastos_insert" ON public.gastos;
CREATE POLICY "gastos_insert" ON public.gastos FOR INSERT WITH CHECK (cliente_id = auth.uid());

DROP POLICY IF EXISTS "gastos_update" ON public.gastos;
CREATE POLICY "gastos_update" ON public.gastos FOR UPDATE USING (cliente_id = auth.uid()) WITH CHECK (cliente_id = auth.uid());

DROP POLICY IF EXISTS "gastos_delete" ON public.gastos;
CREATE POLICY "gastos_delete" ON public.gastos FOR DELETE USING (cliente_id = auth.uid());

-- tickets
DROP POLICY IF EXISTS "tickets_select" ON public.tickets;
CREATE POLICY "tickets_select" ON public.tickets FOR SELECT USING (cliente_id = auth.uid() OR public.es_asesor_asignado_a_cliente(cliente_id));

DROP POLICY IF EXISTS "tickets_insert" ON public.tickets;
CREATE POLICY "tickets_insert" ON public.tickets FOR INSERT WITH CHECK (cliente_id = auth.uid());

DROP POLICY IF EXISTS "tickets_delete" ON public.tickets;
CREATE POLICY "tickets_delete" ON public.tickets FOR DELETE USING (cliente_id = auth.uid() AND estado_procesamiento IN ('subido', 'error'));

-- analisis_ocr
DROP POLICY IF EXISTS "analisis_ocr_select" ON public.analisis_ocr;
CREATE POLICY "analisis_ocr_select" ON public.analisis_ocr FOR SELECT USING (auth.uid() = public.analisis_ocr_cliente_referencia(ticket_id, gasto_id) OR public.es_asesor_asignado_a_cliente(public.analisis_ocr_cliente_referencia(ticket_id, gasto_id)));

-- recomendaciones_financieras
DROP POLICY IF EXISTS "recomendaciones_select" ON public.recomendaciones_financieras;
CREATE POLICY "recomendaciones_select" ON public.recomendaciones_financieras FOR SELECT USING (cliente_id = auth.uid() OR asesor_id = auth.uid() OR public.es_asesor_asignado_a_cliente(cliente_id));

DROP POLICY IF EXISTS "recomendaciones_insert" ON public.recomendaciones_financieras;
CREATE POLICY "recomendaciones_insert" ON public.recomendaciones_financieras FOR INSERT WITH CHECK (public.es_service_role() OR (origen = 'asesor' AND asesor_id = auth.uid() AND public.es_asesor_asignado_a_cliente(cliente_id)));

DROP POLICY IF EXISTS "recomendaciones_update_cliente" ON public.recomendaciones_financieras;
CREATE POLICY "recomendaciones_update_cliente" ON public.recomendaciones_financieras FOR UPDATE USING (cliente_id = auth.uid()) WITH CHECK (cliente_id = auth.uid());

DROP POLICY IF EXISTS "recomendaciones_update_asesor" ON public.recomendaciones_financieras;
CREATE POLICY "recomendaciones_update_asesor" ON public.recomendaciones_financieras FOR UPDATE USING (asesor_id = auth.uid()) WITH CHECK (asesor_id = auth.uid());

-- perfiles_de_gasto
DROP POLICY IF EXISTS "perfiles_de_gasto_select" ON public.perfiles_de_gasto;
CREATE POLICY "perfiles_de_gasto_select" ON public.perfiles_de_gasto FOR SELECT USING (auth.uid() IS NOT NULL);

-- clasificacion_de_perfil
DROP POLICY IF EXISTS "clasificacion_select" ON public.clasificacion_de_perfil;
CREATE POLICY "clasificacion_select" ON public.clasificacion_de_perfil FOR SELECT USING (cliente_id = auth.uid() OR public.es_asesor_asignado_a_cliente(cliente_id));

DROP POLICY IF EXISTS "clasificacion_insert" ON public.clasificacion_de_perfil;
CREATE POLICY "clasificacion_insert" ON public.clasificacion_de_perfil FOR INSERT WITH CHECK (public.es_service_role() OR (asesor_id = auth.uid() AND public.es_asesor_asignado_a_cliente(cliente_id)));

DROP POLICY IF EXISTS "clasificacion_update" ON public.clasificacion_de_perfil;
CREATE POLICY "clasificacion_update" ON public.clasificacion_de_perfil FOR UPDATE USING (public.es_service_role() OR (asesor_id = auth.uid() AND public.es_asesor_asignado_a_cliente(cliente_id))) WITH CHECK (public.es_service_role() OR (asesor_id = auth.uid() AND public.es_asesor_asignado_a_cliente(cliente_id)));

-- analisis_de_consumo
DROP POLICY IF EXISTS "analisis_consumo_select" ON public.analisis_de_consumo;
CREATE POLICY "analisis_consumo_select" ON public.analisis_de_consumo FOR SELECT USING (cliente_id = auth.uid() OR public.es_asesor_asignado_a_cliente(cliente_id));

-- mensajes_asesor
DROP POLICY IF EXISTS "mensajes_asesor_select" ON public.mensajes_asesor;
CREATE POLICY "mensajes_asesor_select" ON public.mensajes_asesor FOR SELECT USING (asesor_id = auth.uid() OR cliente_id = auth.uid());

DROP POLICY IF EXISTS "mensajes_asesor_insert" ON public.mensajes_asesor;
CREATE POLICY "mensajes_asesor_insert" ON public.mensajes_asesor FOR INSERT WITH CHECK (public.es_service_role() OR (remitente_id = auth.uid() AND ((asesor_id = auth.uid() AND EXISTS (SELECT 1 FROM public.asignaciones_de_clientes ac WHERE ac.cliente_id = mensajes_asesor.cliente_id AND ac.asesor_id = mensajes_asesor.asesor_id AND ac.activo = true)) OR (cliente_id = auth.uid() AND EXISTS (SELECT 1 FROM public.asignaciones_de_clientes ac WHERE ac.cliente_id = mensajes_asesor.cliente_id AND ac.asesor_id = mensajes_asesor.asesor_id AND ac.activo = true)))));

DROP POLICY IF EXISTS "mensajes_asesor_update" ON public.mensajes_asesor;
CREATE POLICY "mensajes_asesor_update" ON public.mensajes_asesor FOR UPDATE USING (destinatario_id = auth.uid()) WITH CHECK (destinatario_id = auth.uid());

-- =========================================================
-- 7. Semilla de Datos (Seeding)
-- =========================================================

INSERT INTO public.categorias_de_gasto (nombre, icono)
VALUES
    ('Alimentación', '🍔'),
    ('Transporte', '🚗'),
    ('Entretenimiento', '🎬'),
    ('Salud', '⚕️'),
    ('Educación', '📚'),
    ('Hogar', '🏠'),
    ('Servicios', '⚙️'),
    ('Suscripciones', '🎬'),
    ('Otros', '📦')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
