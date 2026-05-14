-- =========================================================
-- ROW LEVEL SECURITY: clasificacion_de_perfil
-- =========================================================

alter table public.clasificacion_de_perfil enable row level security;

drop policy if exists "clasificacion_select" on public.clasificacion_de_perfil;
create policy "clasificacion_select"
on public.clasificacion_de_perfil
for select
using (
    cliente_id = auth.uid()
    or public.es_asesor_asignado_a_cliente(cliente_id)
);

drop policy if exists "clasificacion_insert" on public.clasificacion_de_perfil;
create policy "clasificacion_insert"
on public.clasificacion_de_perfil
for insert
with check (
    public.es_service_role()
    or (
        asesor_id = auth.uid()
        and public.es_asesor_asignado_a_cliente(cliente_id)
    )
);

drop policy if exists "clasificacion_update" on public.clasificacion_de_perfil;
create policy "clasificacion_update"
on public.clasificacion_de_perfil
for update
using (
    public.es_service_role()
    or (
        asesor_id = auth.uid()
        and public.es_asesor_asignado_a_cliente(cliente_id)
    )
)
with check (
    public.es_service_role()
    or (
        asesor_id = auth.uid()
        and public.es_asesor_asignado_a_cliente(cliente_id)
    )
);
