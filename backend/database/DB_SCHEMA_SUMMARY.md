# Resumen de estructura BD — FinTrack 2026

Fuente de verdad: `database.types.ts` generado con `npx supabase gen types typescript`.
Ultima actualizacion: 26/11/2026 (base al dia con la migracion `0017`).

---

## ENUMs

| Enum | Valores |
|------|---------|
| `rol_usuario` | `cliente` \| `asesor` |
| `estado_usuario` | `activo` \| `inactivo` |
| `origen_gasto` | `manual` \| `ticket` |
| `estado_ocr` | `pendiente` \| `procesado` \| `fallido` |
| `estado_ticket` | `subido` \| `procesando` \| `procesado` \| `error` |
| `origen_recomendacion` | `sistema` \| `asesor` |
| `tipo_recomendacion` | `sugerencia` \| `alerta` \| `observacion` |
| `prioridad_recomendacion` | `baja` \| `media` \| `alta` |
| `estado_recomendacion` | `pendiente` \| `completada` \| `descartada` |

---

## Tablas

### `usuarios`
Usuarios del sistema. PK referencia `auth.users(id)`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | Sincronizado con `auth.users` |
| `nombre_completo` | text NOT NULL | |
| `email` | text | Opcional, redundante con auth |
| `rol` | `rol_usuario` NOT NULL | `cliente` o `asesor` |
| `estado` | `estado_usuario` | default `activo` |
| `foto_perfil_url` | text | |
| `biografia` | text | |
| `ultimo_acceso` | timestamptz | |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | auto-trigger |

**RLS:** Lectura propia o por asesor asignado. Update solo propio.

---

### `perfiles_usuarios`
Preferencias y datos personales del cliente.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `usuario_id` | uuid UNIQUE FK→usuarios | |
| `ocupacion` | text | |
| `ingreso_estimado` | numeric | |
| `objetivo_financiero` | text | |
| `moneda_preferida` | text | default `ARS` |
| `telefono` | text | |
| `pais` | text | **Renombrado de `ciudad` en migration 0010** |
| `ahorro_objetivo` | numeric | |
| `umbral_alerta` | numeric | Porcentaje 0-100 |
| `tema` | text | `dark` o `light` |
| `notificar_email` | boolean | |
| `notificar_push` | boolean | |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | auto-trigger |

**RLS:** Lectura propia o por asesor asignado. Update solo propio.

---

### `perfiles_asesores`
Datos profesionales del asesor.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `usuario_id` | uuid UNIQUE FK→usuarios | |
| `matricula` | text UNIQUE | |
| `especialidad` | text | |
| `descripcion` | text | |
| `telefono` | text | |
| `pais` | text | |
| `capacidad_maxima` | int | Default: configurado al crear |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | auto-trigger |

**RLS:** Lectura y update solo propio o asesor asignado.

---

### `asignaciones_de_clientes`
Relacion activa entre asesor y cliente.

| Campo | Tipo |
|-------|------|
| `id` | uuid PK |
| `asesor_id` | uuid FK→usuarios |
| `cliente_id` | uuid FK→usuarios |
| `activo` | boolean default true |
| `asignado_en` | timestamptz |
| `actualizado_en` | timestamptz |

**Unique:** `(asesor_id, cliente_id)`.
**RLS:** Lectura por ambas partes. Insert/Update por asesor.
**Nota:** Al registrar un cliente, se asigna automaticamente al asesor con menor carga.

---

### `categorias_de_gasto`
Catalogo global de categorias. Sin `cliente_id`.

| Campo | Tipo |
|-------|------|
| `id` | uuid PK |
| `nombre` | text UNIQUE NOT NULL |
| `icono` | text NOT NULL |
| `descripcion` | text |
| `creado_en` | timestamptz |
| `actualizado_en` | timestamptz |

**RLS:** Lectura publica (cualquier usuario autenticado).

---

### `gastos`
Registro principal de gastos del cliente.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `cliente_id` | uuid FK→usuarios | |
| `categoria_id` | uuid FK→categorias_de_gasto | |
| `ticket_principal_id` | uuid FK→tickets | Nullable |
| `monto` | numeric NOT NULL | |
| `moneda` | text | default `ARS` |
| `comercio` | text NOT NULL | |
| `descripcion` | text | |
| `fecha_gasto` | date NOT NULL | |
| `origen` | `origen_gasto` | `manual` o `ticket` |
| `ocr_estado` | `estado_ocr` | Estado del OCR si viene de ticket |
| `ocr_confianza` | numeric | 0-1 |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | |

**RLS:** Lectura por cliente o asesor asignado. Escritura solo por el cliente.

---

### `tickets`
Tickets/imagenes subidos al storage para OCR.

| Campo | Tipo |
|-------|------|
| `id` | uuid PK |
| `cliente_id` | uuid FK→usuarios |
| `url_archivo` | text NOT NULL |
| `nombre_archivo` | text |
| `tipo_mime` | text |
| `tamano_bytes` | int |
| `estado_procesamiento` | `estado_ticket` |
| `subido_en` | timestamptz |

**RLS:** Lectura por cliente o asesor asignado. Insert por cliente.

---

### `analisis_ocr`
Resultado del procesamiento OCR de un ticket.

| Campo | Tipo |
|-------|------|
| `id` | uuid PK |
| `ticket_id` | uuid FK→tickets |
| `gasto_id` | uuid FK→gastos (nullable) |
| `categoria_sugerida_id` | uuid FK→categorias_de_gasto (nullable) |
| `texto_extraido` | text |
| `comercio_detectado` | text |
| `monto_detectado` | numeric |
| `fecha_detectada` | date |
| `confianza_general` | numeric |
| `respuesta_modelo` | jsonb |
| `creado_en` | timestamptz |

**RLS:** Lectura por cliente o asesor asignado.

---

### `recomendaciones_financieras`
Recomendaciones dirigidas al cliente.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `cliente_id` | uuid FK→usuarios | |
| `asesor_id` | uuid FK→usuarios | Nullable si origen=sistema |
| `origen` | `origen_recomendacion` | `sistema` o `asesor` |
| `tipo` | `tipo_recomendacion` | `sugerencia`, `alerta`, `observacion` |
| `titulo` | text NOT NULL | |
| `mensaje` | text NOT NULL | |
| `prioridad` | `prioridad_recomendacion` | `baja`, `media`, `alta` |
| `estado` | `estado_recomendacion` | `pendiente`, `completada`, `descartada` |
| `leida` | boolean | |
| `leida_en` | timestamptz | |
| `icono` | text | |
| `problema` | text | |
| `solucion` | text | |
| `ahorro_potencial` | numeric | |
| `pasos_implementacion` | text[] | |
| `creado_en` | timestamptz | |

**RLS:** Lectura por cliente o asesor involucrado. Insert por service_role o asesor asignado. Cliente puede cambiar `estado` y `leida`.

---

### `perfiles_de_gasto`
Catalogo de perfiles financieros. Administrado por asesores/sistema.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `nombre` | text UNIQUE NOT NULL | |
| `descripcion` | text | |
| `criterio_regla` | jsonb | Solo la regla de asignacion: `{ "discrecional_max": 0.1 }` (los textos viven en el front) |
| `activo` | boolean | default true |
| `creado_en` | timestamptz | |

**RLS:** Lectura por cualquier usuario autenticado. Insert/Update restringido.
**Regla de negocio:** el perfil lo asigna el sistema automaticamente segun el gasto discrecional (spec §10.6); ni el cliente ni el asesor lo eligen.
**Catalogo:** exactamente 3 perfiles (Drácula Nocturno, Equilibrista Cósmico, Espíritu Libre), cargados por la migracion `0016` (y `seeds/seed_perfiles_de_gasto.sql`).

---

### `clasificacion_de_perfil`
Perfil de gasto asignado a cada cliente. Lo escribe el backend (`analysis.service.ts`) solo cuando el perfil calculado cambia.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `cliente_id` | uuid FK→usuarios | |
| `perfil_id` | uuid FK→perfiles_de_gasto | |
| `asesor_id` | uuid FK→usuarios | `null`: la asignacion es automatica |
| `puntaje` | numeric(5,2) | 0-100, confianza de la clasificacion |
| `motivo` | text | |
| `vigente_desde` | timestamptz | |
| `vigente_hasta` | timestamptz | NULL = perfil actualmente activo |
| `creado_en` | timestamptz | |

**RLS:** Lectura por cliente o asesor asignado. Insert/Update por service_role o asesor asignado.
**Historial:** `vigente_hasta = NULL` indica perfil activo. Los anteriores tienen fecha de cierre.

---

### Objetos eliminados

- `analisis_de_consumo`: eliminada en la `0014` (el analisis se calcula en cada pedido a partir de `gastos`).
- `mensajes_asesor` y su ENUM: eliminados en la `0013` (se quito la mensajeria asesor-cliente).
- Vistas `advisor_dashboard_view`, `category_distribution_view`, `client_anomaly_view`, `consumption_stats_view` y `monthly_evolution_view`: eliminadas en la `0016` (no las usaba nadie y exponian datos sin login).
- Funciones `obtener_gastos_inusuales` y `calcular_zscore`: eliminadas en la `0017` (el z-score se descarto en la fase I1; los gastos inusuales los calcula el backend con la regla del 35 %).

---

## Funciones SQL

Todas tienen `search_path = public` (`0017`). Ninguna `SECURITY DEFINER` es ejecutable por `anon`; `es_asesor_asignado_a_cliente` y `analisis_ocr_cliente_referencia` conservan `authenticated` porque las usan las politicas RLS.

| Funcion | Descripcion |
|---------|-------------|
| `es_service_role()` | Retorna true si la sesion es service_role |
| `set_actualizado_en()` | Trigger: actualiza `actualizado_en` automaticamente |
| `es_asesor_asignado_a_cliente(p_cliente_id)` | Verifica si auth.uid() tiene asignacion activa sobre el cliente |
| `analisis_ocr_cliente_referencia(p_gasto_id, p_ticket_id)` | Resuelve cliente_id desde gasto o ticket |
| `contar_clientes_activos(p_asesor_id)` | Cuenta asignaciones activas de un asesor |
| `obtener_asesor_disponible()` | Retorna el id del asesor **activo** con menos clientes y con capacidad libre (lo usa el registro) |
| `sync_user_email()` · `handle_auth_user_email_change()` | Sin uso: no estan conectadas a ningun trigger; solo las puede ejecutar `service_role` |

---

## Triggers

Todas las tablas con `actualizado_en` tienen trigger `trg_<tabla>_actualizado_en` que llama a `set_actualizado_en()`.

Validadores de integridad:
- `trg_validar_perfiles_usuarios`: solo clientes pueden tener perfil_usuario.
- `trg_validar_perfiles_asesores`: solo asesores pueden tener perfil_asesor.
- `trg_validar_clasificacion_de_perfil`: valida roles y asignaciones antes de clasificar.
- `trg_validar_analisis_ocr`: valida integridad de referencias.

---

## Migraciones aplicadas

Se ejecutan en orden en el SQL Editor de Supabase (ver `README.md` de esta carpeta). La base de produccion esta al dia con la `0017`.

| Archivo | Descripcion |
|---------|-------------|
| `0001_init_schema.sql` | Schema completo inicial |
| `0002` – `0009` | Parches: categorias globales, perfiles, mensajeria, asignaciones, vistas, filtros de fecha |
| `0010_ciudad_to_pais.sql` | Renombrar `ciudad` → `pais` en `perfiles_usuarios` |
| `0011` – `0012` | Indices de recomendaciones y correccion de `es_service_role` |
| `0013_remove_messaging.sql` | Elimina la mensajeria asesor-cliente |
| `0014_remove_consumption_analysis_table.sql` | Elimina `analisis_de_consumo` |
| `0015_add_notifications_to_advisors.sql` | Preferencias de notificacion del asesor |
| `0016_spending_profiles_v2.sql` | Catalogo de 3 perfiles con regla en `criterio_regla`; elimina las vistas sin uso |
| `0017_security_functions.sql` | Funciones sin acceso anonimo, `search_path` fijo, elimina el z-score SQL |

**Seeds:** `seeds/seed_perfiles_de_gasto.sql` (catalogo de perfiles) y `seeds/seed_demo_jun_nov_2026.sql` (datos de la demo, idempotente).

**Diferencia conocida con la base de produccion:** la categoria `Ropa` existe en Supabase pero no la crea ninguna migracion (se agrego a mano).
