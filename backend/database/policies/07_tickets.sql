-- =========================================================
-- ROW LEVEL SECURITY: tickets
-- =========================================================

alter table public.tickets enable row level security;

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
