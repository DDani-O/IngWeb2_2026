-- =========================================================
-- ROW LEVEL SECURITY: asignaciones_de_clientes
-- =========================================================

alter table public.asignaciones_de_clientes enable row level security;

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
