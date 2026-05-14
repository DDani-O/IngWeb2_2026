-- =========================================================
-- ROW LEVEL SECURITY: usuarios
-- =========================================================

alter table public.usuarios enable row level security;

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
