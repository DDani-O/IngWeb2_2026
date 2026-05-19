-- Migration: 0013_fix_es_service_role.sql
-- Purpose: Fix es_service_role() to support both request.jwt.claim.role and
-- request.jwt.claims JSON formats so service_role checks work with different
-- Supabase/PostgREST deployments.

-- Nota: Esta migration reemplaza la función existente en los helpers.

BEGIN;

CREATE OR REPLACE FUNCTION public.es_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    -- Compatibilidad con distintas versiones de PostgREST/Supabase:
    -- Algunas instalaciones exponen la claim individual en
    -- current_setting('request.jwt.claim.role') mientras que otras
    -- exponen el JSON completo en current_setting('request.jwt.claims').
    -- Esta función acepta ambos formatos de forma segura.
    select (
        coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
        or (
            coalesce(current_setting('request.jwt.claims', true), '') <> ''
            and (current_setting('request.jwt.claims', true))::jsonb ->> 'role' = 'service_role'
        )
    );
$$;

COMMIT;
