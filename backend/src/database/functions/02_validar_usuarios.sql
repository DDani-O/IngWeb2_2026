-- =========================================================
-- VALIDADOR: usuarios
-- =========================================================

create or replace function public.validar_usuarios()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'UPDATE' then
        if new.rol is distinct from old.rol and not public.es_service_role() then
            raise exception 'No se permite modificar el rol fuera de service_role';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validar_usuarios on public.usuarios;
create trigger trg_validar_usuarios
before insert or update on public.usuarios
for each row execute function public.validar_usuarios();
