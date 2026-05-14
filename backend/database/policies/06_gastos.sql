-- =========================================================
-- ROW LEVEL SECURITY: gastos
-- =========================================================

alter table public.gastos enable row level security;

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
