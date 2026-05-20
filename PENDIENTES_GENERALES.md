# Pendientes Generales — FinTrack 2026

## Mejoras UX/UI

### 4. Revision completa del dashboard del asesor

**Descripcion:** La pantalla `/asesor/dashboard` muestra datos pero requiere revision de:
- Consistencia de metricas con datos reales de la BD
- Graficos (verificar que los datos de `advisor_dashboard_view` se consumen correctamente)
- UX general: layout, responsividad, legibilidad
- Funcionalidades del calendario (actualmente estatico o parcial)

### 5. Validacion de calculos del dashboard cliente

**Descripcion:** El dashboard del cliente (`/usuario/dashboard`) muestra KPIs calculados dinamicamente. Falta validar:
- Que el total del mes coincide con la suma real de `gastos`
- Que el presupuesto restante se calcula correctamente respecto a `ingreso_estimado`
- Que los graficos del resumen reflejan datos reales
- Que las fechas se filtran correctamente por mes actual


### 5.5 Revision de perfil del asesor

**Descripcion:** AsesorPerfilPage.js carga y permite editar el perfil del asesor. Verificar que todos los campos (telefono, pais, capacidad maxima, especialidad) se guardan y leen correctamente desde perfiles_asesores. Auditar el flujo completo de edición de perfil porque el conteo de clientes activos y otros valores no se muestran correctamente.

Eso deja claro que hay que revisar toda esa parte del perfil.

### 6. Historial de gastos — mejoras de filtros

**Descripcion:** `HistorialPage.js` tiene filtros de fecha y categoria. Revisar:
- Que el filtro `from/to` funciona correctamente contra el backend
- Exportacion (actualmente puede estar como mock)
- Paginacion en la respuesta de la API

---

## Deuda tecnica


### 9. Pantalla de perfiles del asesor (`/asesor/perfil`)

**Descripcion:** `AsesorPerfilPage.js` carga y permite editar el perfil del asesor. Verificar que todos los campos (telefono, pais, capacidad maxima, especialidad) se guardan y leen correctamente desde `perfiles_asesores`.

### REALIZAR UNA LIMPIEZA PORQUE TODAVIA ESTAN DANDO VUELTAS LOS DATOS MOCKEADOS

---

## Funcionalidades futuras (backlog)

### 10. Asignacion automatica de perfiles de gasto via analytics

**Descripcion:** Cuando el sistema tenga suficiente historial de gastos de un cliente, podria sugerir automaticamente un perfil de gasto basado en los criterios de `criterio_regla` en `perfiles_de_gasto`. Actualmente la asignacion es solo manual por el asesor.

**Propuesta:** Agregar un endpoint `GET /users/me/suggested-profile` que devuelva el perfil mas compatible basado en los datos de consumo del cliente.

### 11. Notificaciones en tiempo real

**Descripcion:** Usar Supabase Realtime para notificar al cliente cuando el asesor envia una recomendacion o mensaje nuevo, sin necesidad de polling.

### 12. Exportacion de datos

**Descripcion:** Permitir al cliente exportar su historial de gastos en CSV o PDF desde `/usuario/historial`.
