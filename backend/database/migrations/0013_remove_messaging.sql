-- Migration: Remove Messaging Implementation
-- Description: Drops the mensajes_asesor table and related components as messaging is being disabled.

-- Drop trigger
DROP TRIGGER IF EXISTS trg_validar_mensajes_asesor ON public.mensajes_asesor;

-- Drop function
DROP FUNCTION IF EXISTS public.validar_mensajes_asesor();

-- Drop table
DROP TABLE IF EXISTS public.mensajes_asesor CASCADE;

-- Cleanup metadata/references in indexes and documentation if necessary
-- Note: Indexes are dropped with the table CASCADE.
