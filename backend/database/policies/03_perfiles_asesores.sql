-- =========================================================
-- ROW LEVEL SECURITY: perfiles_asesores
-- =========================================================

alter table public.perfiles_asesores enable row level security;

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
