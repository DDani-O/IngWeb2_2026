-- =========================================================
-- ROW LEVEL SECURITY: perfiles_usuarios
-- =========================================================

alter table public.perfiles_usuarios enable row level security;

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
