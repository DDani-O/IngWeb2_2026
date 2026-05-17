-- =========================================================
-- Migration: Advisor messaging inbox and User Email Sync
-- =========================================================

-- 1. Agregar columna email a public.usuarios si no existe
do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuarios' and column_name = 'email') then
        alter table public.usuarios add column email text;
    end if;
end $$;

-- 2. Función para sincronizar email desde auth.users
create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
as $$
begin
    if (tg_op = 'INSERT') then
        update public.usuarios
        set email = (select email from auth.users where id = new.id)
        where id = new.id;
    elsif (tg_op = 'UPDATE') then
        if (new.email is distinct from old.email) then
            -- Si cambia en public.usuarios (raro), se ignora o se sincroniza.
            -- Lo ideal es que auth sea el trigger.
            null;
        end if;
    end if;
    return new;
end;
$$;

-- 3. Trigger en auth.users para actualizar public.usuarios
-- Nota: Esto requiere permisos que usualmente se manejan en Supabase SQL editor.
-- Aquí definimos la función que debe activarse cuando cambia el email en auth.users.
create or replace function public.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.usuarios
    set email = new.email
    where id = new.id;
    return new;
end;
$$;

-- 4. Tipos y tablas de mensajes
do $$
begin
    create type public.tipo_mensaje_asesor as enum ('mensaje', 'ticket');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.mensajes_asesor (
    id uuid primary key default gen_random_uuid(),
    asesor_id uuid not null references public.usuarios(id) on delete cascade,
    cliente_id uuid not null references public.usuarios(id) on delete cascade,
    remitente_id uuid not null references public.usuarios(id) on delete cascade,
    destinatario_id uuid not null references public.usuarios(id) on delete cascade,
    tipo public.tipo_mensaje_asesor not null default 'mensaje',
    asunto text null,
    contenido text not null,
    leido boolean not null default false,
    leido_en timestamptz null,
    creado_en timestamptz not null default now(),
    constraint chk_mensajes_asesor_partes check (
        (remitente_id = asesor_id and destinatario_id = cliente_id)
        or (remitente_id = cliente_id and destinatario_id = asesor_id)
    )
);

create index if not exists idx_mensajes_asesor_asesor_cliente
    on public.mensajes_asesor (asesor_id, cliente_id);

create index if not exists idx_mensajes_asesor_asesor_creado
    on public.mensajes_asesor (asesor_id, creado_en desc);

create index if not exists idx_mensajes_asesor_cliente_creado
    on public.mensajes_asesor (cliente_id, creado_en desc);

create index if not exists idx_mensajes_asesor_destinatario_leido
    on public.mensajes_asesor (destinatario_id, leido);

-- =========================================================
-- Validator: mensajes_asesor
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

-- =========================================================
-- Row level security: mensajes_asesor
-- =========================================================

alter table public.mensajes_asesor enable row level security;

drop policy if exists "mensajes_asesor_select" on public.mensajes_asesor;
create policy "mensajes_asesor_select"
on public.mensajes_asesor
for select
using (
    asesor_id = auth.uid()
    or cliente_id = auth.uid()
);

drop policy if exists "mensajes_asesor_insert" on public.mensajes_asesor;
create policy "mensajes_asesor_insert"
on public.mensajes_asesor
for insert
with check (
    public.es_service_role()
    or (
        remitente_id = auth.uid()
        and (
            (asesor_id = auth.uid()
             and exists (
                 select 1
                 from public.asignaciones_de_clientes ac
                 where ac.cliente_id = mensajes_asesor.cliente_id
                   and ac.asesor_id = mensajes_asesor.asesor_id
                   and ac.activo = true
             ))
            or
            (cliente_id = auth.uid()
             and exists (
                 select 1
                 from public.asignaciones_de_clientes ac
                 where ac.cliente_id = mensajes_asesor.cliente_id
                   and ac.asesor_id = mensajes_asesor.asesor_id
                   and ac.activo = true
             ))
        )
    )
);

drop policy if exists "mensajes_asesor_update" on public.mensajes_asesor;
create policy "mensajes_asesor_update"
on public.mensajes_asesor
for update
using (destinatario_id = auth.uid())
with check (destinatario_id = auth.uid());
