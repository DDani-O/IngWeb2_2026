-- =========================================================
-- VALIDADOR: perfiles_usuarios
-- =========================================================

create or replace function public.validar_perfiles_usuarios()
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

    if v_rol is distinct from 'cliente' then
        raise exception 'perfiles_usuarios solo puede referenciar usuarios con rol cliente';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validar_perfiles_usuarios on public.perfiles_usuarios;
create trigger trg_validar_perfiles_usuarios
before insert or update on public.perfiles_usuarios
for each row execute function public.validar_perfiles_usuarios();
