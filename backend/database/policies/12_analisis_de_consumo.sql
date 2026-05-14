-- =========================================================
-- ROW LEVEL SECURITY: analisis_de_consumo
-- =========================================================

alter table public.analisis_de_consumo enable row level security;

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
