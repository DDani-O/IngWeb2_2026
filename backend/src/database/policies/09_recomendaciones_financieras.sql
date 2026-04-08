-- =========================================================
-- ROW LEVEL SECURITY: recomendaciones_financieras
-- =========================================================

alter table public.recomendaciones_financieras enable row level security;

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
