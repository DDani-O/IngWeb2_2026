-- =========================================================
-- ROW LEVEL SECURITY: mensajes_asesor
-- =========================================================

alter table public.mensajes_asesor enable row level security;

drop policy if exists "mensajes_asesor_select" on public.mensajes_asesor;
create policy "mensajes_asesor_select"
on public.mensajes_asesor
for select
using (
    asesor_id = auth.uid()
    or cliente_id = auth.uid()
);

drop policy if exists "mensajes_asesor_insert" on public.mensajes_asesor;
create policy "mensajes_asesor_insert"
on public.mensajes_asesor
for insert
with check (
    public.es_service_role()
    or (
        remitente_id = auth.uid()
        and (
            (asesor_id = auth.uid()
             and exists (
                 select 1
                 from public.asignaciones_de_clientes ac
                 where ac.cliente_id = mensajes_asesor.cliente_id
                   and ac.asesor_id = mensajes_asesor.asesor_id
                   and ac.activo = true
             ))
            or
            (cliente_id = auth.uid()
             and exists (
                 select 1
                 from public.asignaciones_de_clientes ac
                 where ac.cliente_id = mensajes_asesor.cliente_id
                   and ac.asesor_id = mensajes_asesor.asesor_id
                   and ac.activo = true
             ))
        )
    )
);

drop policy if exists "mensajes_asesor_update" on public.mensajes_asesor;
create policy "mensajes_asesor_update"
on public.mensajes_asesor
for update
using (destinatario_id = auth.uid())
with check (destinatario_id = auth.uid());
