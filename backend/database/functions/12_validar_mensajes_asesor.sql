-- =========================================================
-- VALIDADOR: mensajes_asesor
-- =========================================================

create or replace function public.validar_mensajes_asesor()
returns trigger
language plpgsql
as $$
declare
    v_rol_cliente public.rol_usuario;
    v_rol_asesor public.rol_usuario;
    v_asignado boolean;
begin
    select u.rol into v_rol_cliente
    from public.usuarios u
    where u.id = new.cliente_id;

    if v_rol_cliente is distinct from 'cliente' then
        raise exception 'mensajes_asesor.cliente_id debe referenciar un usuario con rol cliente';
    end if;

    select u.rol into v_rol_asesor
    from public.usuarios u
    where u.id = new.asesor_id;

    if v_rol_asesor is distinct from 'asesor' then
        raise exception 'mensajes_asesor.asesor_id debe referenciar un usuario con rol asesor';
    end if;

    if tg_op = 'INSERT' then
        select exists (
            select 1
            from public.asignaciones_de_clientes ac
            where ac.cliente_id = new.cliente_id
              and ac.asesor_id = new.asesor_id
              and ac.activo = true
        ) into v_asignado;

        if not v_asignado then
            raise exception 'El asesor no tiene asignacion activa para este cliente';
        end if;

        if not public.es_service_role() then
            if auth.uid() is null or auth.uid() <> new.remitente_id then
                raise exception 'El remitente debe coincidir con auth.uid()';
            end if;

            if auth.uid() = new.asesor_id then
                if new.remitente_id <> new.asesor_id or new.destinatario_id <> new.cliente_id then
                    raise exception 'El asesor debe enviar mensajes al cliente asignado';
                end if;
            elsif auth.uid() = new.cliente_id then
                if new.remitente_id <> new.cliente_id or new.destinatario_id <> new.asesor_id then
                    raise exception 'El cliente debe enviar mensajes a su asesor asignado';
                end if;
            else
                raise exception 'No tiene permisos para enviar mensajes en esta conversacion';
            end if;
        end if;
    end if;

    if tg_op = 'UPDATE' then
        if public.es_service_role() then
            return new;
        end if;

        if auth.uid() = old.destinatario_id then
            if new.asunto is distinct from old.asunto
               or new.contenido is distinct from old.contenido
               or new.tipo is distinct from old.tipo
               or new.asesor_id is distinct from old.asesor_id
               or new.cliente_id is distinct from old.cliente_id
               or new.remitente_id is distinct from old.remitente_id
               or new.destinatario_id is distinct from old.destinatario_id
               or new.creado_en is distinct from old.creado_en then
                raise exception 'Solo puede actualizar el estado de lectura';
            end if;

            if new.leido = true and old.leido is distinct from true then
                new.leido_en := coalesce(new.leido_en, now());
            elsif new.leido = false then
                new.leido_en := null;
            end if;
        else
            raise exception 'No tiene permisos para actualizar este mensaje';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validar_mensajes_asesor on public.mensajes_asesor;
create trigger trg_validar_mensajes_asesor
before insert or update on public.mensajes_asesor
for each row execute function public.validar_mensajes_asesor();
