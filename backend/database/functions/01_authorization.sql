-- =========================================================
-- FUNCIONES DE AUTORIZACIÓN Y REFERENCIAS
-- =========================================================
-- Funciones para verificar permisos y resolver referencias

create or replace function public.es_asesor_asignado_a_cliente(p_cliente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.asignaciones_de_clientes ac
        where ac.cliente_id = p_cliente_id
          and ac.asesor_id = auth.uid()
          and ac.activo = true
    );
$$;

create or replace function public.analisis_ocr_cliente_referencia(p_ticket_id uuid, p_gasto_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (select t.cliente_id from public.tickets t where t.id = p_ticket_id),
        (select g.cliente_id from public.gastos g where g.id = p_gasto_id)
    );
$$;
