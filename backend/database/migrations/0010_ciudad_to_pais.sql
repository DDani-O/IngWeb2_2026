-- Migration: renombrar ciudad → pais en perfiles_usuarios
-- También aplicar en perfiles_asesores si tuviera ciudad (no aplica)

alter table public.perfiles_usuarios
  rename column ciudad to pais;
