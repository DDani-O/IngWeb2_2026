-- =========================================================
-- VALIDADOR: clasificacion_de_perfil
-- =========================================================

create or replace function public.validar_clasificacion_de_perfil()
returns trigger
language plpgsql
as $$
declare
    v_rol_cliente public.rol_usuario;
    v_rol_asesor public.rol_usuario;
begin
    select u.rol into v_rol_cliente
    from public.usuarios u
    where u.id = new.cliente_id;

    if v_rol_cliente is distinct from 'cliente' then
        raise exception 'clasificacion_de_perfil.cliente_id debe referenciar un usuario con rol cliente';
    end if;

    if new.asesor_id is not null then
        select u.rol into v_rol_asesor
        from public.usuarios u
        where u.id = new.asesor_id;

        if v_rol_asesor is distinct from 'asesor' then
            raise exception 'clasificacion_de_perfil.asesor_id debe referenciar un usuario con rol asesor';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validar_clasificacion_de_perfil on public.clasificacion_de_perfil;
create trigger trg_validar_clasificacion_de_perfil
before insert or update on public.clasificacion_de_perfil
for each row execute function public.validar_clasificacion_de_perfil();
