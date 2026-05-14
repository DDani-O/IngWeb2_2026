-- =========================================================
-- ROW LEVEL SECURITY: analisis_ocr
-- =========================================================

alter table public.analisis_ocr enable row level security;

drop policy if exists "analisis_ocr_select" on public.analisis_ocr;
create policy "analisis_ocr_select"
on public.analisis_ocr
for select
using (
    auth.uid() = public.analisis_ocr_cliente_referencia(ticket_id, gasto_id)
    or public.es_asesor_asignado_a_cliente(public.analisis_ocr_cliente_referencia(ticket_id, gasto_id))
);
