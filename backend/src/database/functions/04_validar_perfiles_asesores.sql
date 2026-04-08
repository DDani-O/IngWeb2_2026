-- =========================================================
-- VALIDADOR: perfiles_asesores
-- =========================================================

create or replace function public.validar_perfiles_asesores()
returns trigger
language plpgsql
as $$
declare
    v_rol public.rol_usuario;
begin
    select u.rol
      into v_rol
      from public.usuarios u
     where u.id = new.usuario_id;

    if v_rol is distinct from 'asesor' then
        raise exception 'perfiles_asesores solo puede referenciar usuarios con rol asesor';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validar_perfiles_asesores on public.perfiles_asesores;
create trigger trg_validar_perfiles_asesores
before insert or update on public.perfiles_asesores
for each row execute function public.validar_perfiles_asesores();
