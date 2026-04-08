-- =========================================================
-- VALIDADOR: recomendaciones_financieras
-- =========================================================

create or replace function public.validar_recomendaciones_financieras()
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
        raise exception 'recomendaciones_financieras.cliente_id debe referenciar un usuario con rol cliente';
    end if;

    if new.asesor_id is not null then
        select u.rol into v_rol_asesor
        from public.usuarios u
        where u.id = new.asesor_id;

        if v_rol_asesor is distinct from 'asesor' then
            raise exception 'recomendaciones_financieras.asesor_id debe referenciar un usuario con rol asesor';
        end if;
    end if;

    if tg_op = 'INSERT' then
        if not public.es_service_role() then
            if new.origen <> 'asesor' then
                raise exception 'Solo service_role puede crear recomendaciones de origen sistema';
            end if;

            if new.asesor_id is null or new.asesor_id <> auth.uid() then
                raise exception 'El asesor_id debe coincidir con auth.uid() al crear recomendaciones manuales';
            end if;

            if not public.es_asesor_asignado_a_cliente(new.cliente_id) then
                raise exception 'El asesor no tiene asignacion activa para este cliente';
            end if;
        end if;
    end if;

    if tg_op = 'UPDATE' then
        if public.es_service_role() then
            return new;
        end if;

        if auth.uid() = old.cliente_id then
            if new.titulo is distinct from old.titulo
               or new.mensaje is distinct from old.mensaje
               or new.prioridad is distinct from old.prioridad
               or new.origen is distinct from old.origen
               or new.tipo is distinct from old.tipo
               or new.asesor_id is distinct from old.asesor_id
               or new.cliente_id is distinct from old.cliente_id then
                raise exception 'El cliente solo puede modificar leida y leida_en';
            end if;
        elsif auth.uid() = old.asesor_id then
            null;
        else
            raise exception 'No tiene permisos para actualizar esta recomendacion';
        end if;

        if new.leida = true and old.leida is distinct from true then
            new.leida_en := coalesce(new.leida_en, now());
        elsif new.leida = false then
            new.leida_en := null;
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validar_recomendaciones_financieras on public.recomendaciones_financieras;
create trigger trg_validar_recomendaciones_financieras
before insert or update on public.recomendaciones_financieras
for each row execute function public.validar_recomendaciones_financieras();
