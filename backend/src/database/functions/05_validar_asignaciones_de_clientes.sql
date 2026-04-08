-- =========================================================
-- VALIDADOR: asignaciones_de_clientes
-- =========================================================

create or replace function public.validar_asignaciones_de_clientes()
returns trigger
language plpgsql
as $$
declare
    v_rol_asesor public.rol_usuario;
    v_rol_cliente public.rol_usuario;
begin
    if new.asesor_id = new.cliente_id then
        raise exception 'asesor_id y cliente_id no pueden ser iguales';
    end if;

    select u.rol into v_rol_asesor
    from public.usuarios u
    where u.id = new.asesor_id;

    select u.rol into v_rol_cliente
    from public.usuarios u
    where u.id = new.cliente_id;

    if v_rol_asesor is distinct from 'asesor' then
        raise exception 'asesor_id debe referenciar un usuario con rol asesor';
    end if;

    if v_rol_cliente is distinct from 'cliente' then
        raise exception 'cliente_id debe referenciar un usuario con rol cliente';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validar_asignaciones_de_clientes on public.asignaciones_de_clientes;
create trigger trg_validar_asignaciones_de_clientes
before insert or update on public.asignaciones_de_clientes
for each row execute function public.validar_asignaciones_de_clientes();
