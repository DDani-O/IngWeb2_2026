-- =========================================================
-- Modelo de datos - Plataforma de gestión de gastos
-- Supabase / PostgreSQL
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- Tipos ENUM
-- =========================================================

do $$
begin
    create type public.rol_usuario as enum ('cliente', 'asesor');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.estado_usuario as enum ('activo', 'inactivo');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.origen_gasto as enum ('manual', 'ticket');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.estado_ocr as enum ('pendiente', 'procesado', 'fallido');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.estado_ticket as enum ('subido', 'procesando', 'procesado', 'error');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.origen_recomendacion as enum ('sistema', 'asesor');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.tipo_recomendacion as enum ('sugerencia', 'alerta', 'observacion');
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.prioridad_recomendacion as enum ('baja', 'media', 'alta');
exception
    when duplicate_object then null;
end $$;

-- =========================================================
-- Funciones simples
-- =========================================================

create or replace function public.es_service_role()
returns boolean
language sql
stable
as $$
    select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
    new.actualizado_en := now();
    return new;
end;
$$;

-- =========================================================
-- Tablas
-- =========================================================

create table if not exists public.usuarios (
    id uuid primary key references auth.users(id) on delete cascade,
    rol public.rol_usuario not null,
    nombre_completo text not null,
    foto_perfil_url text null,
    biografia text null,
    estado public.estado_usuario not null default 'activo',
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create table if not exists public.perfiles_usuarios (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null unique references public.usuarios(id) on delete cascade,
    ocupacion text null,
    ingreso_estimado numeric(12,2) null,
    objetivo_financiero text null,
    moneda_preferida char(3) null,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create table if not exists public.perfiles_asesores (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid not null unique references public.usuarios(id) on delete cascade,
    matricula text null unique,
    especialidad text null,
    descripcion text null,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create table if not exists public.asignaciones_de_clientes (
    id uuid primary key default gen_random_uuid(),
    asesor_id uuid not null references public.usuarios(id) on delete cascade,
    cliente_id uuid not null references public.usuarios(id) on delete cascade,
    activo boolean not null default true,
    asignado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    constraint uq_asignaciones_de_clientes unique (asesor_id, cliente_id)
);

create table if not exists public.categorias_de_gasto (
    id uuid primary key default gen_random_uuid(),
    nombre text not null unique,
    descripcion text null,
    icono text null,
    categoria_sistema boolean not null default true,
    creado_en timestamptz not null default now()
);

create table if not exists public.tickets (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references public.usuarios(id) on delete cascade,
    url_archivo text not null,
    nombre_archivo text null,
    tipo_mime text null,
    tamano_bytes bigint null,
    estado_procesamiento public.estado_ticket not null default 'subido',
    subido_en timestamptz not null default now()
);

create table if not exists public.gastos (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references public.usuarios(id) on delete cascade,
    categoria_id uuid not null references public.categorias_de_gasto(id) on delete restrict,
    comercio text not null,
    fecha_gasto date not null,
    monto numeric(12,2) not null,
    descripcion text null,
    origen public.origen_gasto not null,
    moneda char(3) not null default 'ARS',
    ticket_principal_id uuid null references public.tickets(id) on delete set null,
    ocr_estado public.estado_ocr not null default 'pendiente',
    ocr_confianza numeric(5,2) null,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    constraint chk_gastos_monto_positivo check (monto > 0),
    constraint chk_gastos_ocr_confianza check (ocr_confianza is null or (ocr_confianza >= 0 and ocr_confianza <= 100))
);

create table if not exists public.analisis_ocr (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references public.tickets(id) on delete cascade,
    gasto_id uuid null references public.gastos(id) on delete set null,
    texto_extraido text null,
    comercio_detectado text null,
    fecha_detectada date null,
    monto_detectado numeric(12,2) null,
    categoria_sugerida_id uuid null references public.categorias_de_gasto(id) on delete set null,
    confianza_general numeric(5,2) null,
    respuesta_modelo jsonb null,
    creado_en timestamptz not null default now(),
    constraint chk_analisis_ocr_confianza check (confianza_general is null or (confianza_general >= 0 and confianza_general <= 100)),
    constraint chk_analisis_ocr_monto check (monto_detectado is null or monto_detectado > 0)
);

create table if not exists public.recomendaciones_financieras (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references public.usuarios(id) on delete cascade,
    asesor_id uuid null references public.usuarios(id) on delete set null,
    origen public.origen_recomendacion not null,
    tipo public.tipo_recomendacion not null,
    titulo text not null,
    mensaje text not null,
    prioridad public.prioridad_recomendacion not null default 'media',
    leida boolean not null default false,
    leida_en timestamptz null,
    creado_en timestamptz not null default now()
);

create table if not exists public.perfiles_de_gasto (
    id uuid primary key default gen_random_uuid(),
    nombre text not null unique,
    descripcion text null,
    criterio_regla jsonb null,
    activo boolean not null default true,
    creado_en timestamptz not null default now()
);

create table if not exists public.clasificacion_de_perfil (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references public.usuarios(id) on delete cascade,
    perfil_id uuid not null references public.perfiles_de_gasto(id) on delete restrict,
    asesor_id uuid null references public.usuarios(id) on delete set null,
    puntaje numeric(5,2) null,
    motivo text null,
    vigente_desde timestamptz not null default now(),
    vigente_hasta timestamptz null,
    creado_en timestamptz not null default now(),
    constraint chk_clasificacion_puntaje check (puntaje is null or (puntaje >= 0 and puntaje <= 100))
);

create table if not exists public.analisis_de_consumo (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references public.usuarios(id) on delete cascade,
    periodo_inicio date not null,
    periodo_fin date not null,
    gasto_total numeric(12,2) not null,
    gasto_promedio numeric(12,2) null,
    categoria_dominante_id uuid null references public.categorias_de_gasto(id) on delete set null,
    comercio_mas_frecuente text null,
    dia_mayor_gasto smallint null,
    cantidad_gastos int not null,
    gastos_inusuales_detectados int not null default 0,
    creado_en timestamptz not null default now(),
    constraint chk_analisis_consumo_dia check (dia_mayor_gasto is null or (dia_mayor_gasto between 1 and 7)),
    constraint uq_analisis_consumo unique (cliente_id, periodo_inicio, periodo_fin)
);

-- =========================================================
-- Funciones dependientes de tablas
-- =========================================================

create or replace function public.es_asesor_asignado_a_cliente(p_cliente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.asignaciones_de_clientes ac
        where ac.cliente_id = p_cliente_id
          and ac.asesor_id = auth.uid()
          and ac.activo = true
    );
$$;

create or replace function public.analisis_ocr_cliente_referencia(p_ticket_id uuid, p_gasto_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (select t.cliente_id from public.tickets t where t.id = p_ticket_id),
        (select g.cliente_id from public.gastos g where g.id = p_gasto_id)
    );
$$;

-- =========================================================
-- Triggers de updated_at
-- =========================================================

drop trigger if exists trg_usuarios_actualizado_en on public.usuarios;
create trigger trg_usuarios_actualizado_en
before update on public.usuarios
for each row execute function public.set_actualizado_en();

drop trigger if exists trg_perfiles_usuarios_actualizado_en on public.perfiles_usuarios;
create trigger trg_perfiles_usuarios_actualizado_en
before update on public.perfiles_usuarios
for each row execute function public.set_actualizado_en();

drop trigger if exists trg_perfiles_asesores_actualizado_en on public.perfiles_asesores;
create trigger trg_perfiles_asesores_actualizado_en
before update on public.perfiles_asesores
for each row execute function public.set_actualizado_en();

drop trigger if exists trg_asignaciones_de_clientes_actualizado_en on public.asignaciones_de_clientes;
create trigger trg_asignaciones_de_clientes_actualizado_en
before update on public.asignaciones_de_clientes
for each row execute function public.set_actualizado_en();

drop trigger if exists trg_gastos_actualizado_en on public.gastos;
create trigger trg_gastos_actualizado_en
before update on public.gastos
for each row execute function public.set_actualizado_en();

-- =========================================================
-- Validaciones de consistencia
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

create or replace function public.validar_tickets()
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
        raise exception 'tickets.cliente_id debe referenciar un usuario con rol cliente';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validar_tickets on public.tickets;
create trigger trg_validar_tickets
before insert or update on public.tickets
for each row execute function public.validar_tickets();

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

create or replace function public.validar_analisis_ocr()
returns trigger
language plpgsql
as $$
begin
    return new;
end;
$$;

drop trigger if exists trg_validar_analisis_ocr on public.analisis_ocr;
create trigger trg_validar_analisis_ocr
before insert or update on public.analisis_ocr
for each row execute function public.validar_analisis_ocr();

-- =========================================================
-- RLS
-- =========================================================

alter table public.usuarios enable row level security;
alter table public.perfiles_usuarios enable row level security;
alter table public.perfiles_asesores enable row level security;
alter table public.asignaciones_de_clientes enable row level security;
alter table public.categorias_de_gasto enable row level security;
alter table public.tickets enable row level security;
alter table public.gastos enable row level security;
alter table public.analisis_ocr enable row level security;
alter table public.recomendaciones_financieras enable row level security;
alter table public.perfiles_de_gasto enable row level security;
alter table public.clasificacion_de_perfil enable row level security;
alter table public.analisis_de_consumo enable row level security;

-- usuarios
drop policy if exists "usuarios_select" on public.usuarios;
create policy "usuarios_select"
on public.usuarios
for select
using (
    auth.uid() = id
    or (
        rol = 'cliente'
        and public.es_asesor_asignado_a_cliente(id)
    )
);

drop policy if exists "usuarios_insert" on public.usuarios;
create policy "usuarios_insert"
on public.usuarios
for insert
with check (auth.uid() = id);

drop policy if exists "usuarios_update" on public.usuarios;
create policy "usuarios_update"
on public.usuarios
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- perfiles_usuarios
drop policy if exists "perfiles_usuarios_select" on public.perfiles_usuarios;
create policy "perfiles_usuarios_select"
on public.perfiles_usuarios
for select
using (
    usuario_id = auth.uid()
    or public.es_asesor_asignado_a_cliente(usuario_id)
);

drop policy if exists "perfiles_usuarios_insert" on public.perfiles_usuarios;
create policy "perfiles_usuarios_insert"
on public.perfiles_usuarios
for insert
with check (usuario_id = auth.uid());

drop policy if exists "perfiles_usuarios_update" on public.perfiles_usuarios;
create policy "perfiles_usuarios_update"
on public.perfiles_usuarios
for update
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

-- perfiles_asesores
drop policy if exists "perfiles_asesores_select" on public.perfiles_asesores;
create policy "perfiles_asesores_select"
on public.perfiles_asesores
for select
using (usuario_id = auth.uid());

drop policy if exists "perfiles_asesores_insert" on public.perfiles_asesores;
create policy "perfiles_asesores_insert"
on public.perfiles_asesores
for insert
with check (usuario_id = auth.uid());

drop policy if exists "perfiles_asesores_update" on public.perfiles_asesores;
create policy "perfiles_asesores_update"
on public.perfiles_asesores
for update
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

-- asignaciones_de_clientes
drop policy if exists "asignaciones_select" on public.asignaciones_de_clientes;
create policy "asignaciones_select"
on public.asignaciones_de_clientes
for select
using (
    asesor_id = auth.uid()
    or cliente_id = auth.uid()
);

drop policy if exists "asignaciones_insert" on public.asignaciones_de_clientes;
create policy "asignaciones_insert"
on public.asignaciones_de_clientes
for insert
with check (asesor_id = auth.uid());

drop policy if exists "asignaciones_update" on public.asignaciones_de_clientes;
create policy "asignaciones_update"
on public.asignaciones_de_clientes
for update
using (asesor_id = auth.uid())
with check (asesor_id = auth.uid());

-- categorias_de_gasto
drop policy if exists "categorias_select" on public.categorias_de_gasto;
create policy "categorias_select"
on public.categorias_de_gasto
for select
using (auth.uid() is not null);

-- gastos
drop policy if exists "gastos_select" on public.gastos;
create policy "gastos_select"
on public.gastos
for select
using (
    cliente_id = auth.uid()
    or public.es_asesor_asignado_a_cliente(cliente_id)
);

drop policy if exists "gastos_insert" on public.gastos;
create policy "gastos_insert"
on public.gastos
for insert
with check (cliente_id = auth.uid());

drop policy if exists "gastos_update" on public.gastos;
create policy "gastos_update"
on public.gastos
for update
using (cliente_id = auth.uid())
with check (cliente_id = auth.uid());

drop policy if exists "gastos_delete" on public.gastos;
create policy "gastos_delete"
on public.gastos
for delete
using (cliente_id = auth.uid());

-- tickets
drop policy if exists "tickets_select" on public.tickets;
create policy "tickets_select"
on public.tickets
for select
using (
    cliente_id = auth.uid()
    or public.es_asesor_asignado_a_cliente(cliente_id)
);

drop policy if exists "tickets_insert" on public.tickets;
create policy "tickets_insert"
on public.tickets
for insert
with check (cliente_id = auth.uid());

drop policy if exists "tickets_delete" on public.tickets;
create policy "tickets_delete"
on public.tickets
for delete
using (
    cliente_id = auth.uid()
    and estado_procesamiento in ('subido', 'error')
);

-- analisis_ocr
drop policy if exists "analisis_ocr_select" on public.analisis_ocr;
create policy "analisis_ocr_select"
on public.analisis_ocr
for select
using (
    auth.uid() = public.analisis_ocr_cliente_referencia(ticket_id, gasto_id)
    or public.es_asesor_asignado_a_cliente(public.analisis_ocr_cliente_referencia(ticket_id, gasto_id))
);

-- recomendaciones_financieras
drop policy if exists "recomendaciones_select" on public.recomendaciones_financieras;
create policy "recomendaciones_select"
on public.recomendaciones_financieras
for select
using (
    cliente_id = auth.uid()
    or asesor_id = auth.uid()
    or public.es_asesor_asignado_a_cliente(cliente_id)
);

drop policy if exists "recomendaciones_insert" on public.recomendaciones_financieras;
create policy "recomendaciones_insert"
on public.recomendaciones_financieras
for insert
with check (
    public.es_service_role()
    or (
        origen = 'asesor'
        and asesor_id = auth.uid()
        and public.es_asesor_asignado_a_cliente(cliente_id)
    )
);

drop policy if exists "recomendaciones_update_cliente" on public.recomendaciones_financieras;
create policy "recomendaciones_update_cliente"
on public.recomendaciones_financieras
for update
using (cliente_id = auth.uid())
with check (cliente_id = auth.uid());

drop policy if exists "recomendaciones_update_asesor" on public.recomendaciones_financieras;
create policy "recomendaciones_update_asesor"
on public.recomendaciones_financieras
for update
using (asesor_id = auth.uid())
with check (asesor_id = auth.uid());

-- perfiles_de_gasto
drop policy if exists "perfiles_de_gasto_select" on public.perfiles_de_gasto;
create policy "perfiles_de_gasto_select"
on public.perfiles_de_gasto
for select
using (auth.uid() is not null);

-- clasificacion_de_perfil
drop policy if exists "clasificacion_select" on public.clasificacion_de_perfil;
create policy "clasificacion_select"
on public.clasificacion_de_perfil
for select
using (
    cliente_id = auth.uid()
    or public.es_asesor_asignado_a_cliente(cliente_id)
);

drop policy if exists "clasificacion_insert" on public.clasificacion_de_perfil;
create policy "clasificacion_insert"
on public.clasificacion_de_perfil
for insert
with check (
    public.es_service_role()
    or (
        asesor_id = auth.uid()
        and public.es_asesor_asignado_a_cliente(cliente_id)
    )
);

drop policy if exists "clasificacion_update" on public.clasificacion_de_perfil;
create policy "clasificacion_update"
on public.clasificacion_de_perfil
for update
using (
    public.es_service_role()
    or (
        asesor_id = auth.uid()
        and public.es_asesor_asignado_a_cliente(cliente_id)
    )
)
with check (
    public.es_service_role()
    or (
        asesor_id = auth.uid()
        and public.es_asesor_asignado_a_cliente(cliente_id)
    )
);

-- analisis_de_consumo
drop policy if exists "analisis_consumo_select" on public.analisis_de_consumo;
create policy "analisis_consumo_select"
on public.analisis_de_consumo
for select
using (
    cliente_id = auth.uid()
    or public.es_asesor_asignado_a_cliente(cliente_id)
);

-- No se definen policies de insert/update/delete para analisis_de_consumo,
-- ya que la carga se reserva a procesos internos / service role.

-- =========================================================
-- Fin
-- =========================================================
