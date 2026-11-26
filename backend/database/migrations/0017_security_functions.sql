-- =============================================================================
-- 0017_security_functions.sql
-- Endurece las funciones del esquema public (revisor de seguridad de Supabase).
--
-- Estado relevado el 26/11/2026 (después de la 0016):
--   * 5 funciones SECURITY DEFINER ejecutables por anon y authenticated. La más grave,
--     obtener_gastos_inusuales(uuid, integer), devolvía los gastos de cualquier cliente
--     a un pedido sin login (POST /rest/v1/rpc/obtener_gastos_inusuales).
--   * EXECUTE estaba otorgado también a PUBLIC (default de Postgres): revocarlo solo a
--     anon no alcanza, porque anon lo hereda de PUBLIC.
--   * 15 funciones sin search_path fijo.
--
-- Uso de cada función (verificado contra pg_policies, pg_trigger, pg_proc y el código):
--   obtener_gastos_inusuales       -> nada (el backend no la llama; el z-score se descartó en I1)
--   calcular_zscore                -> solo obtener_gastos_inusuales
--   es_asesor_asignado_a_cliente   -> políticas RLS de 7 tablas y validar_recomendaciones_financieras
--   analisis_ocr_cliente_referencia-> política analisis_ocr_select
--   sync_user_email                -> nada (no está conectada a ningún trigger)
--   handle_auth_user_email_change  -> nada (no está conectada a ningún trigger)
--   obtener_asesor_disponible      -> backend (RPC con service role, al registrar un cliente)
--   el resto                       -> funciones de triggers o helpers de políticas
--
-- El backend usa el service role: no depende de los permisos de anon/authenticated.
-- Los triggers no necesitan EXECUTE del rol que dispara la operación.
-- Idempotente: se puede ejecutar dos veces.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Funciones sin uso: se eliminan.
-- -----------------------------------------------------------------------------
drop function if exists public.obtener_gastos_inusuales(uuid, integer);
drop function if exists public.calcular_zscore(numeric, numeric, numeric);

-- -----------------------------------------------------------------------------
-- 2. SECURITY DEFINER: sin acceso anónimo.
--    Las que usan las políticas RLS conservan authenticated (las políticas se evalúan
--    con el rol del pedido); las que no usa nada, tampoco lo conservan.
-- -----------------------------------------------------------------------------
revoke execute on function public.es_asesor_asignado_a_cliente(uuid) from public, anon;
grant  execute on function public.es_asesor_asignado_a_cliente(uuid) to authenticated, service_role;

revoke execute on function public.analisis_ocr_cliente_referencia(uuid, uuid) from public, anon;
grant  execute on function public.analisis_ocr_cliente_referencia(uuid, uuid) to authenticated, service_role;

revoke execute on function public.sync_user_email() from public, anon, authenticated;
grant  execute on function public.sync_user_email() to service_role;

revoke execute on function public.handle_auth_user_email_change() from public, anon, authenticated;
grant  execute on function public.handle_auth_user_email_change() to service_role;

-- -----------------------------------------------------------------------------
-- 3. search_path fijo en todas las funciones de public (las 3 SECURITY DEFINER que
--    ya lo tenían se reafirman). Ninguna usa objetos de otros esquemas sin calificar.
-- -----------------------------------------------------------------------------
alter function public.analisis_ocr_cliente_referencia(uuid, uuid) set search_path = public;
alter function public.es_asesor_asignado_a_cliente(uuid)         set search_path = public;
alter function public.handle_auth_user_email_change()            set search_path = public;
alter function public.sync_user_email()                          set search_path = public;
alter function public.contar_clientes_activos(uuid)              set search_path = public;
alter function public.es_service_role()                          set search_path = public;
alter function public.obtener_asesor_disponible()                set search_path = public;
alter function public.set_actualizado_en()                       set search_path = public;
alter function public.validar_analisis_ocr()                     set search_path = public;
alter function public.validar_asignaciones_de_clientes()         set search_path = public;
alter function public.validar_capacidad_asesor_insert()          set search_path = public;
alter function public.validar_clasificacion_de_perfil()          set search_path = public;
alter function public.validar_gastos()                           set search_path = public;
alter function public.validar_perfiles_asesores()                set search_path = public;
alter function public.validar_perfiles_usuarios()                set search_path = public;
alter function public.validar_recomendaciones_financieras()      set search_path = public;
alter function public.validar_tickets()                          set search_path = public;
alter function public.validar_usuarios()                         set search_path = public;

commit;

-- -----------------------------------------------------------------------------
-- Verificación (correr después, debe devolver 0 filas en cada consulta):
--
--   select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.prosecdef
--     and has_function_privilege('anon', p.oid, 'EXECUTE');
--
--   select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.prokind = 'f'
--     and not coalesce(array_to_string(p.proconfig, ',') like '%search_path=%', false);
--
--   select proname from pg_proc where proname in ('obtener_gastos_inusuales', 'calcular_zscore');
-- -----------------------------------------------------------------------------
