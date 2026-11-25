# Especificación: Recomendaciones Financieras

> Reescrita en la Fase 0 del refactor (ver `../DiagnosticoRefactor.md` §6, decisión 1). El modelo de datos es el de la tabla `recomendaciones_financieras`. Se eliminaron el ahorro potencial, los pasos de implementación, los estados Pendiente/En Progreso/Completada/Descartada y el contacto con el asesor, porque no forman parte de la consigna ni tienen respaldo en la BD.

## DESCRIPCIÓN GENERAL

La página muestra al cliente las recomendaciones financieras que recibió. Pueden venir del **sistema** (generadas automáticamente a partir de sus gastos) o de su **asesor**. Cubre el punto 4.6 de la consigna: reducir gastos en determinadas categorías, alertas de gasto elevado y sugerencias de ahorro.

**Objetivos:**
- Listar las recomendaciones recibidas, agrupadas por prioridad.
- Distinguir las recomendaciones leídas de las que todavía no se leyeron.
- Permitir filtrar, ordenar, ver el detalle y marcar como leída.

## MODELO DE UNA RECOMENDACIÓN

| Campo (UI) | Columna en la BD | Valores |
|---|---|---|
| `title` | `titulo` | texto |
| `message` | `mensaje` | texto |
| `type` | `tipo` | `sugerencia` · `alerta` · `observacion` |
| `priority` | `prioridad` | `alta` · `media` · `baja` |
| `origin` | `origen` | `sistema` · `asesor` |
| `advisorName` | nombre del `asesor_id` (si `origen = asesor`) | texto o `null` |
| `date` | `creado_en` | fecha |
| `read` | `leida` | booleano |

Los valores válidos de `type` y `priority` están en `RECOMMENDATION_TYPES` y `RECOMMENDATION_PRIORITIES` (`frontend/utils/constants.js`).

## ESTRUCTURA VISUAL

1. **Navbar y sidebar** del cliente (layout compartido).
2. **Encabezado:** título "Recomendaciones Financieras" y una descripción breve.
3. **Barra de filtros:**
   - Prioridad: Todas · Alta · Media · Baja
   - Tipo: Todos · Sugerencia · Alerta · Observación
   - Estado: Todas · Sin leer · Leídas
   - Orden: Más reciente · Por prioridad
   - Contador: "N recomendaciones · M sin leer"
4. **Grupos:**
   - *Prioridad Alta*: sin leer, con prioridad alta.
   - *Prioridad Media y Baja*: el resto de las sin leer.
   - *Leídas*.
   Cada grupo muestra un mensaje cuando queda vacío por el filtro.
5. **Tarjeta de recomendación:** badges de prioridad, tipo y estado (Sin leer / Leída), título, mensaje, origen ("Generada por el sistema" o "Enviada por {asesor}") y fecha. Acciones: "Marcar como leída" (solo si no está leída) y "Ver detalle".
6. **Modal de detalle:** título, mensaje, tipo, prioridad, origen y fecha.
7. **Botón "Volver al Dashboard".**

## INTERACCIÓN CON EL BACKEND

- `GET /recomendaciones` — recomendaciones del cliente autenticado.
- `PUT /recomendaciones/:id/leida` — marca una recomendación como leída (actualiza `leida` y `leida_en`).

El contrato exacto (en español) se fija en `EspecificacionDesarrolloFront.md` §10 durante la Fase 1.

## REGLAS DE COMPORTAMIENTO

1. Una recomendación leída no vuelve a quedar sin leer desde la UI.
2. Marcar como leída actualiza el contador y la mueve al grupo "Leídas" sin recargar la página.
3. El orden por defecto es el más reciente primero.
4. Todo el texto que viene de la API se muestra escapado.

## METADATA

- **Ruta:** `#/cliente/recomendaciones`
- **Autenticación:** requerida (rol `cliente`)
- **Responsive:** sí
