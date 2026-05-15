# Resumen de estructura BD (Supabase / PostgreSQL)

Este documento resume la estructura generada por la migracion inicial. Incluye tipos, tablas, relaciones, constraints, triggers y un resumen de RLS.

## Tipos ENUM
- rol_usuario: cliente | asesor
- estado_usuario: activo | inactivo
- origen_gasto: manual | ticket
- estado_ocr: pendiente | procesado | fallido
- estado_ticket: subido | procesando | procesado | error
- origen_recomendacion: sistema | asesor
- tipo_recomendacion: sugerencia | alerta | observacion
- prioridad_recomendacion: baja | media | alta

## Funciones base
- es_service_role(): true si request.jwt.claim.role = service_role.
- set_actualizado_en(): trigger para actualizar actualizado_en.

## Tablas y relaciones

### usuarios
- PK: id (uuid) -> auth.users(id)
- Campos clave: rol, nombre_completo, estado, creado_en, actualizado_en
- Trigger: actualizado_en

### perfiles_usuarios
- PK: id (uuid)
- FK: usuario_id -> usuarios(id) (unique)
- Datos: ocupacion, ingreso_estimado, objetivo_financiero, moneda_preferida
- Trigger: actualizado_en

### perfiles_asesores
- PK: id (uuid)
- FK: usuario_id -> usuarios(id) (unique)
- Datos: matricula (unique), especialidad, descripcion
- Trigger: actualizado_en

### asignaciones_de_clientes
- PK: id (uuid)
- FK: asesor_id -> usuarios(id)
- FK: cliente_id -> usuarios(id)
- Unico: (asesor_id, cliente_id)
- Datos: activo, asignado_en, actualizado_en
- Trigger: actualizado_en

### categorias_de_gasto
- PK: id (uuid)
- Unico: nombre
- Datos: descripcion, icono, categoria_sistema, creado_en

### tickets
- PK: id (uuid)
- FK: cliente_id -> usuarios(id)
- Datos: url_archivo, nombre_archivo, tipo_mime, tamano_bytes, estado_procesamiento, subido_en

### gastos
- PK: id (uuid)
- FK: cliente_id -> usuarios(id)
- FK: categoria_id -> categorias_de_gasto(id)
- FK: ticket_principal_id -> tickets(id) (nullable)
- Datos: comercio, fecha_gasto, monto, descripcion, origen, moneda, ocr_estado, ocr_confianza, creado_en, actualizado_en
- Checks: monto > 0; ocr_confianza entre 0 y 100 (o null)
- Trigger: actualizado_en

### analisis_ocr
- PK: id (uuid)
- FK: ticket_id -> tickets(id)
- FK: gasto_id -> gastos(id) (nullable)
- FK: categoria_sugerida_id -> categorias_de_gasto(id) (nullable)
- Datos: texto_extraido, comercio_detectado, fecha_detectada, monto_detectado, confianza_general, respuesta_modelo, creado_en
- Checks: confianza_general entre 0 y 100 (o null); monto_detectado > 0 (o null)

### recomendaciones_financieras
- PK: id (uuid)
- FK: cliente_id -> usuarios(id)
- FK: asesor_id -> usuarios(id) (nullable)
- Datos: origen, tipo, titulo, mensaje, prioridad, leida, leida_en, creado_en

### perfiles_de_gasto
- PK: id (uuid)
- Unico: nombre
- Datos: descripcion, criterio_regla (jsonb), activo, creado_en

### clasificacion_de_perfil
- PK: id (uuid)
- FK: cliente_id -> usuarios(id)
- FK: perfil_id -> perfiles_de_gasto(id)
- FK: asesor_id -> usuarios(id) (nullable)
- Datos: puntaje, motivo, vigente_desde, vigente_hasta, creado_en
- Check: puntaje entre 0 y 100 (o null)

### analisis_de_consumo
- PK: id (uuid)
- FK: cliente_id -> usuarios(id)
- FK: categoria_dominante_id -> categorias_de_gasto(id) (nullable)
- Unico: (cliente_id, periodo_inicio, periodo_fin)
- Datos: periodo_inicio, periodo_fin, gasto_total, gasto_promedio, comercio_mas_frecuente, dia_mayor_gasto, cantidad_gastos, gastos_inusuales_detectados, creado_en
- Check: dia_mayor_gasto entre 1 y 7 (o null)

## Funciones de validacion y triggers
- validar_usuarios: bloquea cambio de rol salvo service_role.
- validar_perfiles_usuarios: usuario_id debe ser rol cliente.
- validar_perfiles_asesores: usuario_id debe ser rol asesor.
- validar_asignaciones_de_clientes: asesor_id y cliente_id distintos y roles correctos.
- validar_gastos: cliente_id debe ser rol cliente.
- validar_tickets: cliente_id debe ser rol cliente.
- validar_recomendaciones_financieras:
  - Insercion: si no es service_role, solo origen asesor, asesor_id = auth.uid(), asesor asignado al cliente.
  - Update: cliente solo puede marcar leida/leida_en; asesor puede actualizar; otros bloqueado.
- validar_clasificacion_de_perfil: cliente_id rol cliente; asesor_id (si existe) rol asesor.
- validar_analisis_de_consumo: cliente_id rol cliente.
- validar_analisis_ocr: sin reglas adicionales.

## RLS (resumen por tabla)
- usuarios: select propio o asesor asignado al cliente; insert/update solo propio.
- perfiles_usuarios: select propio o asesor asignado; insert/update solo propio.
- perfiles_asesores: select/insert/update solo propio.
- asignaciones_de_clientes: select asesor o cliente; insert/update solo asesor.
- categorias_de_gasto: select cualquier usuario autenticado.
- gastos: select propio o asesor asignado; insert/update/delete solo cliente propio.
- tickets: select propio o asesor asignado; insert solo cliente propio; delete solo cliente propio y estado subido/error.
- analisis_ocr: select si es cliente del ticket/gasto o asesor asignado.
- recomendaciones_financieras: select cliente, asesor asignado o asesor del registro; insert service_role o asesor asignado; update por cliente o asesor (segun policy y trigger).
- perfiles_de_gasto: select cualquier usuario autenticado.
- clasificacion_de_perfil: select cliente o asesor asignado; insert/update solo service_role o asesor asignado.
- analisis_de_consumo: select cliente o asesor asignado. Sin policies de insert/update/delete (reservado a procesos internos).
