# Resumen de estructura BD (Supabase / PostgreSQL)

Este documento resume la estructura consolidada del esquema (v1). Incluye tipos, tablas, relaciones, constraints, triggers y un resumen de RLS.

## Tipos ENUM
- **rol_usuario**: `cliente` | `asesor`
- **estado_usuario**: `activo` | `inactivo`
- **origen_gasto**: `manual` | `ticket`
- **estado_ocr**: `pendiente` | `procesado` | `fallido`
- **estado_ticket**: `subido` | `procesando` | `procesado` | `error`
- **origen_recomendacion**: `sistema` | `asesor`
- **tipo_recomendacion**: `sugerencia` | `alerta` | `observacion`
- **prioridad_recomendacion**: `baja` | `media` | `alta`
- **estado_recomendacion**: `pendiente` | `completada` | `descartada`
- **tipo_mensaje_asesor**: `mensaje` | `ticket`

## Funciones base
- **es_service_role()**: Retorna `true` si el rol de la sesión es `service_role`.
- **set_actualizado_en()**: Trigger para actualizar automáticamente la columna `actualizado_en`.
- **es_asesor_asignado_a_cliente(p_cliente_id)**: Verifica si el `auth.uid()` actual es un asesor con asignación activa sobre el cliente.
- **analisis_ocr_cliente_referencia(p_ticket_id, p_gasto_id)**: Resuelve el `cliente_id` asociado a un ticket o gasto.

## Tablas y relaciones

### usuarios
- **PK**: `id` (uuid) -> `auth.users(id)`
- **Campos**: `rol`, `nombre_completo`, `email`, `foto_perfil_url`, `biografia`, `estado`, `ultimo_acceso`, `creado_en`, `actualizado_en`
- **RLS**: Lectura propia o por asesor asignado. Escritura solo propia.

### perfiles_usuarios
- **PK**: `id` (uuid)
- **FK**: `usuario_id` -> `usuarios(id)` (unique)
- **Datos**: `ocupacion`, `ingreso_estimado`, `objetivo_financiero`, `moneda_preferida`, `telefono`, `ciudad`, `ahorro_objetivo`, `umbral_alerta`, `tema`, `notificar_email`, `notificar_push`
- **RLS**: Lectura propia o por asesor asignado. Escritura solo propia.

### perfiles_asesores
- **PK**: `id` (uuid)
- **FK**: `usuario_id` -> `usuarios(id)` (unique)
- **Datos**: `matricula` (unique), `especialidad`, `descripcion`
- **RLS**: Lectura y escritura solo propia.

### asignaciones_de_clientes
- **PK**: `id` (uuid)
- **FKs**: `asesor_id` -> `usuarios(id)`, `cliente_id` -> `usuarios(id)`
- **Único**: `(asesor_id, cliente_id)`
- **RLS**: Lectura por ambas partes. Inserción/Update por el asesor.

### categorias_de_gasto
- **PK**: `id` (uuid)
- **Único**: `nombre`
- **Datos**: `descripcion`, `icono`
- **Nota**: Son globales (sin `cliente_id`).
- **RLS**: Lectura pública (cualquier usuario autenticado).

### tickets
- **PK**: `id` (uuid)
- **FK**: `cliente_id` -> `usuarios(id)`
- **RLS**: Lectura por cliente o asesor asignado. Inserción por cliente. Eliminación solo en estado `subido` o `error`.

### gastos
- **PK**: `id` (uuid)
- **FKs**: `cliente_id`, `categoria_id` -> `categorias_de_gasto(id)`, `ticket_principal_id` -> `tickets(id)`
- **RLS**: Lectura por cliente o asesor asignado. Escritura solo por el cliente.

### analisis_ocr
- **PK**: `id` (uuid)
- **FKs**: `ticket_id`, `gasto_id`, `categoria_sugerida_id`
- **RLS**: Lectura por cliente o asesor asignado.

### recomendaciones_financieras
- **PK**: `id` (uuid)
- **FKs**: `cliente_id`, `asesor_id`
- **Datos**: `prioridad`, `estado`, `ahorro_potencial`, `pasos_implementacion`
- **RLS**: Lectura por cliente o asesores involucrados. Escritura por `service_role` o asesor asignado. Cliente solo puede marcar lectura/estado.

### perfiles_de_gasto
- **PK**: `id` (uuid)
- **Único**: `nombre`
- **RLS**: Lectura por cualquier usuario autenticado.

### clasificacion_de_perfil
- **PK**: `id` (uuid)
- **FKs**: `cliente_id`, `perfil_id`, `asesor_id`
- **RLS**: Lectura por cliente o asesor asignado. Inserción/Update por `service_role` o asesor asignado.

### analisis_de_consumo
- **PK**: `id` (uuid)
- **FKs**: `cliente_id`, `categoria_dominante_id`
- **RLS**: Lectura por cliente o asesor asignado.

### mensajes_asesor
- **PK**: `id` (uuid)
- **FKs**: `asesor_id`, `cliente_id`, `remitente_id`, `destinatario_id`
- **RLS**: Lectura por participantes. Inserción por participantes con asignación activa.

## Triggers y Validaciones
- **Updated At**: Todas las tablas principales actualizan `actualizado_en` automáticamente.
- **Validadores**: Verifican roles (ej: un perfil de asesor debe apuntar a un usuario con rol `asesor`) y asignaciones activas antes de permitir inserciones sensibles.
