-- =========================================================
-- VALIDADOR: gastos
-- =========================================================

create or replace function public.validar_gastos()
returns trigger
language plpgsql
as $$
declare
    v_rol public.rol_usuario;
begin
    select u.rol
      into v_rol
      from public.usuarios u
     where u.id = new.cliente_id;

    if v_rol is distinct from 'cliente' then
        raise exception 'gastos.cliente_id debe referenciar un usuario con rol cliente';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validar_gastos on public.gastos;
create trigger trg_validar_gastos
before insert or update on public.gastos
for each row execute function public.validar_gastos();
