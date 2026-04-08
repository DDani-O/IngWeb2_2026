-- =========================================================
-- FUNCIONES AUXILIARES CORE
-- =========================================================
-- Funciones básicas para el sistema

create or replace function public.es_service_role()
returns boolean
language sql
stable
as $$
    select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
    new.actualizado_en := now();
    return new;
end;
$$;
