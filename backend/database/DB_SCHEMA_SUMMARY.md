# Resumen de estructura BD — FinTrack 2026

Fuente de verdad: `database.types.ts` generado con `npx supabase gen types typescript`.
Ultima actualizacion: mayo 2026.

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
| `tipo_mensaje_asesor` | `mensaje` \| `ticket` |

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
| `criterio_regla` | jsonb | Metadata: emoji, tagline, caracteristicas, tips, umbrales |
| `activo` | boolean | default true |
| `creado_en` | timestamptz | |

**RLS:** Lectura por cualquier usuario autenticado. Insert/Update restringido.
**Regla de negocio:** El cliente NO puede asignarse un perfil. Solo el asesor puede hacerlo via `clasificacion_de_perfil`.
**Seed:** `database/seeds/seed_perfiles_de_gasto.sql` (7 perfiles predefinidos).

---

### `clasificacion_de_perfil`
Asignacion de un perfil de gasto a un cliente por parte del asesor.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `cliente_id` | uuid FK→usuarios | |
| `perfil_id` | uuid FK→perfiles_de_gasto | |
| `asesor_id` | uuid FK→usuarios | Nullable si es asignacion automatica |
| `puntaje` | numeric(5,2) | 0-100, confianza de la clasificacion |
| `motivo` | text | |
| `vigente_desde` | timestamptz | |
| `vigente_hasta` | timestamptz | NULL = perfil actualmente activo |
| `creado_en` | timestamptz | |

**RLS:** Lectura por cliente o asesor asignado. Insert/Update por service_role o asesor asignado.
**Historial:** `vigente_hasta = NULL` indica perfil activo. Los anteriores tienen fecha de cierre.

---

### `analisis_de_consumo`
Snapshot historico de analytics por periodo. **Actualmente no utilizado activamente.**

| Campo | Tipo |
|-------|------|
| `id` | uuid PK |
| `cliente_id` | uuid FK→usuarios |
| `periodo_inicio` | date |
| `periodo_fin` | date |
| `gasto_total` | numeric |
| `gasto_promedio` | numeric |
| `cantidad_gastos` | int |
| `gastos_inusuales_detectados` | int |
| `dia_mayor_gasto` | int (1-7) |
| `comercio_mas_frecuente` | text |
| `categoria_dominante_id` | uuid FK→categorias_de_gasto |
| `creado_en` | timestamptz |

**Nota arquitectonica:** El servicio `ConsumptionAnalyticsService` calcula todo dinamicamente desde `gastos`. Esta tabla existe como tabla de snapshot para cache historico opcional pero no se escribe desde la API actual. No se recomienda eliminar aun (FK references, RLS activas), pero tampoco hay logica que la llene. Candidata a deprecar en una version futura si se implementa un job de agregacion.

---

### `mensajes_asesor`
Mensajeria entre asesor y cliente.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `asesor_id` | uuid FK→usuarios | |
| `cliente_id` | uuid FK→usuarios | |
| `remitente_id` | uuid FK→usuarios | |
| `destinatario_id` | uuid FK→usuarios | |
| `contenido` | text NOT NULL | |
| `asunto` | text | |
| `tipo` | `tipo_mensaje_asesor` | `mensaje` o `ticket` |
| `leido` | boolean | |
| `leido_en` | timestamptz | |
| `creado_en` | timestamptz | |

**RLS:** Lectura por participantes. Insert por participantes con asignacion activa.
**Estado:** El backend del asesor puede enviar mensajes. El endpoint del cliente para leer/enviar esta pendiente.

---

## Views SQL

### `advisor_dashboard_view`
Estadisticas del asesor: clientes activos, gasto promedio, transacciones recientes, recomendaciones pendientes.
Agrupada por `asesor_id`.

### `category_distribution_view`
Distribucion de gastos por categoria por cliente: total, cantidad, porcentaje, promedio, ranking.
No tiene filtro de fecha — acumulado historico completo.

### `client_anomaly_view`
Gastos del cliente enriquecidos con estadisticas de su categoria (avg 90 dias, stddev 90 dias, percentil 95).
Usada como base para deteccion de anomalias en SQL (funcion `obtener_gastos_inusuales`).
**Nota:** El backend actual usa su propio algoritmo en TypeScript (`AnomalyDetectionService`), no consulta esta view directamente.

### `consumption_stats_view`
Estadisticas generales del cliente: gasto total, promedio, maximo, minimo, desvio estandar, cantidad de gastos, comercios unicos, categorias unicas, periodo.

### `monthly_evolution_view`
Evolucion mensual: gasto del mes, mes anterior, variacion porcentual, cantidad de transacciones, promedio por transaccion.

---

## Funciones SQL

| Funcion | Descripcion |
|---------|-------------|
| `es_service_role()` | Retorna true si la sesion es service_role |
| `set_actualizado_en()` | Trigger: actualiza `actualizado_en` automaticamente |
| `es_asesor_asignado_a_cliente(p_cliente_id)` | Verifica si auth.uid() tiene asignacion activa sobre el cliente |
| `analisis_ocr_cliente_referencia(p_gasto_id, p_ticket_id)` | Resuelve cliente_id desde gasto o ticket |
| `calcular_zscore(p_mean, p_stddev, p_value)` | Calcula Z-score estandarizado |
| `contar_clientes_activos(p_asesor_id)` | Cuenta asignaciones activas de un asesor |
| `obtener_asesor_disponible()` | Retorna id del asesor con menor carga |
| `obtener_gastos_inusuales(p_cliente_id, p_dias)` | Gastos anomalos via SQL (Z-score + percentil) |

---

## Triggers

Todas las tablas con `actualizado_en` tienen trigger `trg_<tabla>_actualizado_en` que llama a `set_actualizado_en()`.

Validadores de integridad:
- `trg_validar_perfiles_usuarios`: solo clientes pueden tener perfil_usuario.
- `trg_validar_perfiles_asesores`: solo asesores pueden tener perfil_asesor.
- `trg_validar_clasificacion_de_perfil`: valida roles y asignaciones antes de clasificar.
- `trg_validar_analisis_de_consumo`: valida que cliente_id sea un cliente.
- `trg_validar_analisis_ocr`: valida integridad de referencias.

---

## Migraciones aplicadas

| Archivo | Descripcion |
|---------|-------------|
| `0001_init_schema.sql` | Schema completo inicial |
| `0002` – `0009` | Parches: vistas, funciones, ajustes de RLS, filtros de fecha |
| `0010_ciudad_to_pais.sql` | Renombrar `ciudad` → `pais` en `perfiles_usuarios` |

**Seed disponible:** `seeds/seed_perfiles_de_gasto.sql` — 7 perfiles financieros con metadata completa.
