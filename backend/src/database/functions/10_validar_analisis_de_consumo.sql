-- =========================================================
-- VALIDADOR: analisis_de_consumo
-- =========================================================

create or replace function public.validar_analisis_de_consumo()
returns trigger
language plpgsql
as $$
declare
    v_rol_cliente public.rol_usuario;
begin
    select u.rol into v_rol_cliente
    from public.usuarios u
    where u.id = new.cliente_id;

    if v_rol_cliente is distinct from 'cliente' then
        raise exception 'analisis_de_consumo.cliente_id debe referenciar un usuario con rol cliente';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validar_analisis_de_consumo on public.analisis_de_consumo;
create trigger trg_validar_analisis_de_consumo
before insert or update on public.analisis_de_consumo
for each row execute function public.validar_analisis_de_consumo();
