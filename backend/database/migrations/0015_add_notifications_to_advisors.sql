-- Migration: Agregar columnas de notificaciones a perfiles_asesores
-- Para mantener consistencia con perfiles_usuarios

alter table public.perfiles_asesores
    add column if not exists notificar_email boolean not null default true,
    add column if not exists notificar_push boolean not null default false;
