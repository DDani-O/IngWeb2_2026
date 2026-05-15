-- =========================================================
-- Migration: Add profile fields and recommendation details
-- =========================================================

do $$
begin
    create type public.estado_recomendacion as enum ('pendiente', 'completada', 'descartada');
exception
    when duplicate_object then null;
end $$;

alter table public.usuarios
    add column if not exists ultimo_acceso timestamptz null;

alter table public.perfiles_usuarios
    add column if not exists telefono text null,
    add column if not exists ciudad text null,
    add column if not exists ahorro_objetivo numeric(12,2) null,
    add column if not exists umbral_alerta numeric(5,2) null,
    add column if not exists tema text null default 'dark',
    add column if not exists notificar_email boolean not null default true,
    add column if not exists notificar_push boolean not null default false;

alter table public.recomendaciones_financieras
    add column if not exists icono text null,
    add column if not exists problema text null,
    add column if not exists solucion text null,
    add column if not exists ahorro_potencial numeric(12,2) null,
    add column if not exists pasos_implementacion text[] null,
    add column if not exists estado public.estado_recomendacion not null default 'pendiente';
