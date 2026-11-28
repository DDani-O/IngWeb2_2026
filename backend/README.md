# Backend — NestJS + Supabase

API REST de FinTrack. Deploy: https://fintrack-api-5vmm.onrender.com/api/v1. Visión general del sistema: [README principal](../README.md).

## 1. Estructura

| Ruta | Qué hay |
|---|---|
| `src/main.ts` | Arranque y CORS (`FRONTEND_URL` y `http://localhost:5500`). |
| `src/app.setup.ts` | `configureApp()`: prefijo `/api/v1`, `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`; errores como 422 `VALIDACION`) y filtro global de errores. La usan `main.ts` y los e2e. |
| `src/health.controller.ts` | `GET /health`, público y sin base. |
| `src/common/auth/` | `JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()`. |
| `src/common/assignments/` | Control de asignación asesor ↔ cliente (403 si no está asignado). |
| `src/common/errors/` · `filters/` | `ApiException`, códigos del contrato, helpers (`validationError`, `notFoundError`, `forbiddenError`, `internalError`) y el filtro que serializa todo error. |
| `src/common/validation/transforms.ts` | Transformaciones de los DTOs: `@Trim()`, `@TrimLowercase()`, `@TrimToNull()`. |
| `src/common/supabase/` | Clientes de Supabase (service role y anon). |
| `src/modules/<dominio>/` | `auth` (incluye `/auth/me` y `/auth/profile`), `users` (arma el objeto `usuario`, sin rutas), `categories`, `expenses`, `tickets` (Storage + `ocr.service.ts`), `recommendations`, `analysis` y `clients`. Cada uno con `module`, `controller`, `service` y `dto/`. |
| `src/modules/analysis/` | `analysis.rules.ts` (reglas del §4, funciones puras con tests), `calendar.ts` (fechas `AAAA-MM-DD` y "hoy" en `APP_TIMEZONE`) y `analysis.service.ts` (lee, aplica las reglas y guarda la clasificación de perfil). |
| `test/e2e/` | Tests e2e (Jest + Supertest) y `test-utils.ts`. |
| `database/` | Migraciones, seeds y tipos generados (§6). |

## 2. Convenciones

- **Controller → service → mapper.** El controller declara la ruta, el rol y el DTO; el service aplica la regla de negocio; los objetos del contrato se arman en una función `to*` o un mapper por dominio.
- **El `id` del usuario sale del JWT** (`@CurrentUser()`), nunca del body. Cada ruta lleva `@UseGuards(JwtAuthGuard, RolesGuard)` y `@Roles("cliente" | "asesor")`.
- **Autorización en Nest.** El back usa la clave de servicio de Supabase (que saltea RLS): la pertenencia de cada recurso y la asignación asesor ↔ cliente se controlan en los servicios.
- **Validación con DTOs** y `class-validator`, con mensaje en español en cada regla; si un campo falla en varias, se informa la primera declarada.
- **Errores de negocio** con los helpers de `common/errors`, no con las excepciones de Nest con texto suelto. El detalle técnico va al `Logger`, no a la respuesta.
- **Cambios de contrato:** se actualizan en el mismo cambio este README, el backend simulado (`../frontend/mocks/`) y `../frontend/services/adapters.js`.

## 3. Contrato de la API

### 3.0 Convenciones, objetos y errores

- **Rutas en inglés** (las fija la consigna) y orientadas a recursos, sin prefijo por rol: el rol del token decide qué ve cada uno.
- **Todo lo demás en español `snake_case`, con los nombres de columna de la base:** campos, query params, códigos de error y campos multipart. Los calculados siguen la misma regla (`categoria_nombre`, `promedio_categoria`). No se mezclan idiomas en una respuesta.
- Prefijo global `/api/v1`. Autenticación con `Authorization: Bearer <token>`, salvo login, registro y `/health`. Una ruta de otro rol responde 403.
- Los campos que no son del contrato se rechazan con 422.
- Fechas de gasto `AAAA-MM-DD`; timestamps ISO 8601; montos como número (ARS).
- `GET /health` → **200** `{ "estado": "ok" }`. Lo usan el health check de Render y el front, que lo llama al abrirse para despertar el servidor.

**Errores**, siempre con este cuerpo:

```json
{ "error": true, "mensaje": "Descripcion legible", "codigo": "VALIDACION", "detalles": { "campos": ["monto"] } }
```

| Estado | `codigo` | Cuándo |
|---|---|---|
| 400 | `SOLICITUD_INVALIDA` | JSON mal formado. |
| 401 | `CREDENCIALES_INVALIDAS` | Login con email o contraseña incorrectos. |
| 401 | `NO_AUTENTICADO` | Token ausente, inválido o vencido (el front cierra la sesión). |
| 403 | `PROHIBIDO` | Rol incorrecto o cliente no asignado al asesor. |
| 404 | `NO_ENCONTRADO` | Recurso inexistente o ajeno (un id con formato inválido también). |
| 404 | `RUTA_INEXISTENTE` | Método o ruta que la API no expone. |
| 409 | `EMAIL_DUPLICADO` · `MATRICULA_DUPLICADA` | Registro con un email o una matrícula ya usados. |
| 422 | `VALIDACION` | Datos inválidos o campos de más. `detalles.campos` lista los campos y `mensaje` describe el primero. |
| 500 | `ERROR_INTERNO` | Error no controlado (el detalle queda en el log). |

**`usuario`** (`usuarios` + `perfiles_usuarios` o `perfiles_asesores`):

```json
{
  "id": "uuid", "email": "cliente@fintrack.local", "rol": "cliente",
  "nombre_completo": "Juan Perez", "biografia": "", "foto_perfil_url": null,
  "estado": "activo", "creado_en": "2026-10-21T12:00:00.000Z",
  "perfil_cliente": {
    "ocupacion": "Disenador UX", "ingreso_estimado": 285000, "objetivo_financiero": "Fondo de emergencia",
    "perfil_de_gasto": { "id": "uuid", "nombre": "Equilibrista Cosmico", "descripcion": "...", "origen": "sistema", "motivo": "..." },
    "asesor": { "id": "uuid", "nombre_completo": "Maria Rodriguez" }
  }
}
```

Para un asesor, en lugar de `perfil_cliente` viene `perfil_asesor: { matricula, especialidad, descripcion, clientes_asignados }`. `perfil_de_gasto` es el perfil vigente (§4): `origen: "asesor"` si lo eligió el asesor (con su `motivo` o `null`) o `origen: "sistema"` con la sugerencia; `null` si no hay ninguno.

**`gasto`**:

```json
{
  "id": "uuid", "comercio": "Supermercado Central", "fecha_gasto": "2026-11-24", "monto": 18500.5,
  "descripcion": "", "origen": "manual", "moneda": "ARS",
  "categoria": { "id": "uuid", "nombre": "Alimentacion", "icono": "🛒" },
  "ticket_principal_id": null, "creado_en": "...", "actualizado_en": "..."
}
```

**`recomendacion`**:

```json
{
  "id": "uuid", "titulo": "Reduce gastos en streaming", "mensaje": "...",
  "tipo": "sugerencia", "prioridad": "alta", "origen": "asesor",
  "leida": false, "leida_en": null, "creado_en": "...",
  "asesor": { "id": "uuid", "nombre_completo": "Maria Rodriguez" },
  "cliente": { "id": "uuid", "nombre_completo": "Juan Perez" }
}
```

`tipo`: `sugerencia` · `alerta` · `observacion`. `prioridad`: `baja` · `media` · `alta`. `origen`: `sistema` · `asesor` (`asesor` es `null` si la generó el sistema).

### 3.1 Autenticación y perfil

| Método | Ruta | Rol | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/auth/register` | público | `{ nombre_completo, email, password, rol, matricula?, especialidad? }` (`matricula` y `especialidad` obligatorios para `asesor`) | **201** `{ token, usuario }` |
| POST | `/auth/login` | público | `{ email, password }` | **200** `{ token, usuario }` |
| GET | `/auth/me` | ambos | — | **200** `usuario` |
| PUT | `/auth/profile` | ambos | cliente: `{ nombre_completo, biografia?, ocupacion?, ingreso_estimado?, objetivo_financiero? }` · asesor: `{ nombre_completo, biografia?, matricula, especialidad, descripcion? }` | **200** `usuario` |

- La contraseña tiene entre 8 y 72 caracteres, con al menos una mayúscula y un número (la misma regla en el front y el mock).
- El email no se modifica desde el perfil.
- Un cliente que se registra queda asignado, con `obtener_asesor_disponible()`, al asesor activo con lugar libre (menos clientes activos que su `capacidad_maxima`) que tenga **menos clientes activos**. Si no hay ninguno, queda sin asesor y el registro igual se completa.

### 3.2 Catálogos

| Método | Ruta | Rol | Respuesta |
|---|---|---|---|
| GET | `/categories` | ambos | **200** `[{ id, nombre, icono }]` |
| GET | `/spending-profiles` | ambos | **200** `[{ id, nombre, descripcion }]`, del más austero al más gastador |

### 3.3 Gastos (cliente)

| Método | Ruta | Cuerpo / query | Respuesta |
|---|---|---|---|
| GET | `/expenses` | query opcional: `busqueda`, `categoria_id`, `origen`, `desde`, `hasta`, `orden` (`fecha` · `monto_desc` · `monto_asc`), `limite` (1 a 1000; sin él, todos) | **200** `{ datos: [gasto], total }` |
| GET | `/expenses/:id` | — | **200** `gasto` |
| POST | `/expenses` | `{ comercio, fecha_gasto, monto, categoria_id, descripcion?, origen?, ticket_id? }` | **201** `gasto` |
| PUT | `/expenses/:id` | los mismos campos, parcial (`origen` y `ticket_id` se aceptan pero no cambian) | **200** `gasto` |
| DELETE | `/expenses/:id` | — | **204** |

Validaciones:
- `comercio` obligatorio, hasta 100 caracteres; `descripcion` hasta 500.
- `monto > 0`, con hasta 2 decimales.
- `fecha_gasto` real, `AAAA-MM-DD` y no posterior a hoy en `APP_TIMEZONE` (422 "La fecha no puede ser posterior a hoy.").
- `categoria_id` existente.
- `origen` `manual` (por defecto) o `ticket`; con `ticket_id` siempre es `ticket`, y el ticket tiene que ser del cliente.
- Un gasto ajeno responde 404.

### 3.4 Tickets / OCR (cliente)

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/tickets/upload` | `multipart/form-data`, campo `archivo`: JPEG, PNG o WebP de hasta 5 MB (si no, 422) | **201** `{ ticket: { id, nombre_archivo, estado_procesamiento }, analisis: { comercio_detectado, fecha_detectada, monto_detectado, categoria_sugerida: { id, nombre } \| null, confianza_general } \| null }` |

Flujo **en un paso**:
1. El back sube la imagen a Storage (bucket `tickets`), la manda a la IA y guarda el resultado en `analisis_ocr`.
2. Devuelve todo en la misma respuesta; no hay endpoint de confirmación.
3. Al guardar, el front manda `POST /expenses` con `origen: "ticket"` y `ticket_id`. El back guarda `ticket_principal_id`, `ocr_estado` (`procesado`, o `fallido` si la IA no lo leyó) y `ocr_confianza`, y vincula el análisis con el gasto.

`analisis` es `null` y el ticket queda con `estado_procesamiento = error` si:
- la IA falla o no responde a tiempo (§5);
- la respuesta queda cortada o no es un JSON válido;
- no trae comercio, fecha ni monto;
- el OCR no está configurado.

El cliente completa el formulario a mano y el gasto queda igual asociado al ticket. En el backend simulado, un archivo con "ilegible" en el nombre simula la falla.

### 3.5 Recomendaciones

| Método | Ruta | Rol | Cuerpo / query | Respuesta |
|---|---|---|---|---|
| GET | `/recommendations` | cliente | — | **200** `[recomendacion]` propias, más recientes primero |
| PUT | `/recommendations/:id/read` | cliente | — | **200** `recomendacion` (`leida = true`, `leida_en`) |
| GET | `/recommendations/sent` | asesor | query `limite`, `cliente_id` (opcional) | **200** `[recomendacion]` enviadas por el asesor |
| POST | `/recommendations` | asesor | `{ cliente_id, titulo, mensaje, tipo, prioridad }` | **201** `recomendacion` (`origen = asesor`); 403 si el cliente no está asignado |

### 3.6 Análisis de consumo

| Método | Ruta | Rol | Respuesta |
|---|---|---|---|
| GET | `/analysis/me` | cliente | **200** `analisis` |
| GET | `/analysis/clients/:id` | asesor | **200** `analisis` del cliente (403 si no está asignado) |
| GET | `/analysis/advisor/summary` | asesor | **200** `resumen_asesor` |

**`analisis`** (alimenta los dashboards, Patrones y el análisis por cliente):

```json
{
  "cliente_id": "uuid",
  "periodo": { "desde": "2026-05-01", "hasta": "2026-11-25" },
  "gasto_mes_actual": 135880, "gasto_mes_anterior_a_la_fecha": 56900, "variacion_mes_anterior": 139,
  "gasto_promedio_mensual": 101005, "cantidad_gastos": 97,
  "categoria_dominante": { "id": "uuid", "nombre": "Alimentacion", "porcentaje": 41 },
  "comercio_mas_frecuente": { "comercio": "Supermercado Central", "cantidad": 18 },
  "dia_mayor_gasto": 5,
  "gastos_por_categoria": [{ "categoria_id": "uuid", "categoria": "Alimentacion", "monto": 250000, "porcentaje": 41 }],
  "gastos_por_mes": [{ "mes": "2026-11", "monto": 135880 }],
  "gastos_por_mes_y_categoria": [{ "mes": "2026-11", "categoria": "Alimentacion", "monto": 60000 }],
  "gastos_por_dia": [{ "fecha": "2026-11-25", "monto": 7200 }],
  "ranking_comercios": [{ "comercio": "Supermercado Central", "monto": 120000, "cantidad": 18 }],
  "gastos_inusuales": [{ "gasto_id": "uuid", "comercio": "...", "categoria": "...", "fecha_gasto": "...", "monto": 23400, "promedio_categoria": 9060, "desvio_porcentaje": 158 }],
  "alertas": [{ "nivel": "danger", "titulo": "...", "descripcion": "..." }],
  "perfil_de_gasto": { "id": "uuid", "nombre": "Equilibrista Cosmico", "descripcion": "...", "origen": "asesor", "motivo": "Está ahorrando para mudarse" },
  "perfil_sugerido": { "id": "uuid", "nombre": "Espiritu Libre", "descripcion": "..." },
  "nivel_riesgo": "medio",
  "ultimo_gasto_fecha": "2026-11-24"
}
```

**`resumen_asesor`**:

```json
{
  "asesor_id": "uuid", "clientes_activos": 8, "clientes_con_alertas": 5,
  "recomendaciones_enviadas": 7, "recomendaciones_leidas": 3,
  "alertas": [{ "nivel": "danger", "titulo": "5 clientes con gastos inusuales", "descripcion": "..." }],
  "distribucion_por_perfil": [{ "perfil": "Equilibrista Cosmico", "cantidad": 3 }],
  "gasto_por_perfil": [{ "perfil": "Equilibrista Cosmico", "monto": 320000 }],
  "actividad_mensual": [{ "mes": "2026-11", "clientes_activos": 8 }]
}
```

### 3.7 Clientes (asesor)

Todas responden 403 si el cliente no está asignado al asesor.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/clients` | — | **200** `[resumen_cliente]` de los clientes con asignación activa |
| GET | `/clients/:id` | — | **200** `resumen_cliente` + `usuario` |
| GET | `/clients/:id/expenses` | mismos filtros que `GET /expenses` | **200** `{ datos: [gasto], total }` |
| PUT | `/clients/:id/spending-profile` | `{ perfil_id, motivo? }` (`motivo` hasta 300 caracteres; vacío = `null`) | **200** `{ perfil_de_gasto }` con `origen: "asesor"`; 422 si `perfil_id` no es un perfil activo |
| DELETE | `/clients/:id/spending-profile` | — | **200** `{ perfil_de_gasto }` con la sugerencia (`origen: "sistema"`, o `null` sin gastos); sin elección del asesor, no cambia nada |

**`resumen_cliente`**: `{ id, nombre_completo, email, estado, perfil_de_gasto, gasto_promedio_mensual, gasto_mes_actual, variacion_mes_anterior, ultimo_gasto_fecha, gastos_inusuales (cantidad), nivel_riesgo }`.

## 4. Reglas del análisis

Las implementan `src/modules/analysis/analysis.rules.ts` (con tests en `analysis.rules.spec.ts`) y el backend simulado (`../frontend/mocks/analytics.js`), con los mismos resultados. Si cambia una regla, se cambia en los dos y acá.

- **Hoy** es la fecha en `APP_TIMEZONE`, no la del servidor. El análisis se calcula en cada pedido y no se guarda.
- **Período** (`periodo`): del día 1 del mes de hace 6 meses hasta hoy. Categorías, `categoria_dominante`, ranking, `comercio_mas_frecuente`, `dia_mayor_gasto` y `cantidad_gastos` usan solo los gastos del período. El historial completo solo se usa como base de los gastos inusuales.
- **Series:** `gastos_por_mes`, últimos 7 meses con el actual; `gastos_por_dia`, últimos 14 días; `ranking_comercios`, top 5 por monto.
- **`variacion_mes_anterior`:** el mes en curso contra el anterior **hasta el mismo día**, en porcentaje (`null` sin datos).
- **`gasto_promedio_mensual`:** promedio de los meses completos anteriores con gastos.
- **`dia_mayor_gasto`:** 0 = domingo … 6 = sábado.
- **Gasto inusual:** un gasto de los últimos 30 días que supera en más de 35 % el promedio de **todos los otros gastos** de su categoría en el historial (anteriores y posteriores, sin contarse a sí mismo), con al menos 3 para comparar.
- **Alertas** (`danger` · `warning` · `success` · `info`), en este orden:
  1. Sin gastos en el período: una sola `info` ("Sin gastos en el periodo analizado").
  2. Con gastos inusuales: `danger`.
  3. Con variación > 10 %: `warning`.
  4. Si no hubo ninguna de las anteriores y el mes en curso no tiene gastos: `info` ("Todavia no registraste gastos este mes").
  5. Si lo tiene: `success` ("Tus gastos estan dentro de lo habitual"). Nunca `success` con el mes en $0.
- **`nivel_riesgo`:**
  - `alto`: 2 o más gastos inusuales, o variación > 25 %.
  - `medio`: 1 gasto inusual, o variación > 10 %.
  - `bajo`: en otro caso.
- **Perfil sugerido** (`perfil_sugerido`):
  - Se mide qué parte del gasto de los últimos 3 meses (el actual y los dos anteriores, desde el día 1) es discrecional (Entretenimiento, Suscripciones, Otros).
  - Se compara con `perfiles_de_gasto.criterio_regla.discrecional_max`: Drácula Nocturno < 10 %, Equilibrista Cósmico < 30 %, Espíritu Libre el resto. Sin gastos en la ventana, `null`.
  - El catálogo tiene exactamente esos 3 perfiles. Los textos y la comparativa viven en el front (`../frontend/content/spendingProfiles.js`), vinculados por nombre.
  - La sugerencia se guarda en `clasificacion_de_perfil` (`asesor_id = null`, `motivo` con el porcentaje, cerrando la anterior con `vigente_hasta`). Solo se escribe cuando cambia el perfil; la ventana avanza aunque no haya gastos nuevos.
- **Perfil vigente** (`perfil_de_gasto`):
  - Si el asesor eligió uno (§3.7), vale ese. Se guarda con su `asesor_id` y el motivo, y mientras esté vigente el sistema sigue calculando `perfil_sugerido` pero no escribe clasificaciones para ese cliente.
  - Sin elección del asesor, o si el perfil elegido salió del catálogo activo, vale la sugerencia con `origen: "sistema"`.
  - La distribución y el gasto por perfil del resumen del asesor usan el perfil vigente.

## 5. OCR

`src/modules/tickets/ocr.service.ts`:
- **Modelo:** usa la API de Groq compatible con OpenAI (SDK `openai`) con un modelo con visión. Por defecto es `qwen/qwen3.8-27b`; se cambia con `GROQ_MODEL`. Groq retira modelos: si el OCR empieza a dar 404, listar los de la cuenta con `GET https://api.groq.com/openai/v1/models` y elegir uno con `image` en `input_modalities`.
- **Prompt:** pide un JSON del ticket argentino con comercio, fecha, **total final** (no el subtotal) y una categoría de la lista del catálogo.
- **Límites:** 12 s por intento y un reintento (unos 25 s en el peor caso, dentro de los 30 s que espera el front), hasta 2048 tokens de respuesta.
- **Normalización** (`parseTicketResponse`, con tests en `ocr.service.spec.ts`):
  - el monto acepta `1.500,50` y `1,500.50`;
  - una fecha imposible se descarta;
  - una categoría que no está en la lista queda `null`;
  - una respuesta cortada, inválida o vacía lanza un error y el upload responde `analisis: null`.
- Sin `GROQ_API_KEY`, el OCR queda deshabilitado y todo upload responde `analisis: null`.

## 6. Base de datos

PostgreSQL en Supabase. Tablas en español; antes de escribir un DTO, leer el esquema.

**Migraciones** (`database/migrations/`): se ejecutan en orden, una sola vez, desde el SQL Editor de Supabase. Un cambio de esquema va siempre en una migración nueva `00NN_*.sql`; nunca se edita una ya aplicada. El historial del panel de Supabase está vacío porque se aplican a mano: la fuente de verdad es esta carpeta.

| Migración | Qué hace |
|---|---|
| `0001` | Esquema inicial: tablas, ENUMs, funciones validadoras, triggers y políticas RLS. |
| `0002`–`0009` | Categorías globales, perfiles, asignaciones, vistas e índices, filtros de fecha. |
| `0010`–`0012` | `ciudad` → `pais`, índices de recomendaciones, corrección de `es_service_role`. |
| `0013` · `0014` | Eliminan la mensajería asesor-cliente y la tabla `analisis_de_consumo`. |
| `0015` | Preferencias de notificación del asesor. |
| `0016` | Catálogo de 3 perfiles con `criterio_regla = { "discrecional_max": n }`; elimina las vistas sin uso. |
| `0017` | Funciones sin acceso anónimo y con `search_path` fijo; elimina el z-score en SQL. |
| `0018` | Categoría `Ropa`. Es idempotente (`ON CONFLICT DO NOTHING`): en producción ya existía, cargada a mano. |

**Seeds** (`database/seeds/`):
- `seed_demo_jun_nov_2026.sql`: gastos desde el 1/06/2026 hasta hoy para dos clientes de la demo, con gastos inusuales, y capacidad 10 para su asesor. Es idempotente (borra y regenera sus filas, marcadas con `descripcion = '[seed-demo]'`) y no genera fechas futuras: se vuelve a correr el día de la demo.
- `seed_perfiles_de_gasto.sql`: el catálogo de perfiles (lo mismo que carga la `0016`).
- `seed_gastos_2026.sql` · `seed_gastos_cliente2_2026.sql`: gastos de enero a mayo de 2026 para un cliente; el UUID se reemplaza a mano.

**Funciones SQL:**
- `obtener_asesor_disponible()`: la usa el registro (§3.1).
- `contar_clientes_activos()`, `es_asesor_asignado_a_cliente()` y `analisis_ocr_cliente_referencia()`: las dos últimas las usan las políticas RLS.
- `es_service_role()` y `set_actualizado_en()` (trigger).
- `sync_user_email()` y `handle_auth_user_email_change()` no están conectadas a ningún trigger.

**Triggers:** validan que solo un cliente tenga `perfiles_usuarios` y solo un asesor `perfiles_asesores`, y validan las referencias de `clasificacion_de_perfil` y `analisis_ocr`.

**Seguridad:**
- RLS está activo en todas las tablas: con la clave anónima y sin login no se lee nada.
- Ninguna función `SECURITY DEFINER` la puede ejecutar `anon`, y todas tienen `search_path` fijo.

**Columnas sin uso** (existen, el contrato no las expone y conservan sus valores por defecto; ver §10):
- `perfiles_usuarios`: `telefono`, `pais`, `ahorro_objetivo`, `umbral_alerta`, `tema`, `moneda_preferida`, `notificar_email`, `notificar_push`;
- `perfiles_asesores`: `telefono`, `pais`, `notificar_email`, `notificar_push`;
- `recomendaciones_financieras`: `ahorro_potencial`, `pasos_implementacion`, `problema`, `solucion`.

`database/database.types.ts` son los tipos generados con `npx supabase gen types typescript`. Son solo de referencia: el backend no los importa.

## 7. Variables de entorno

Se cargan con `@nestjs/config` desde `backend/.env`, que nunca se commitea. `.env.example` tiene las claves.

| Variable | Uso |
|---|---|
| `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_KEY` | Proyecto de Supabase. |
| `JWT_SECRET` · `JWT_EXPIRATION` | Firma y vigencia del token (por ejemplo `7d`). |
| `GROQ_API_KEY` | OCR; sin ella, el upload responde `analisis: null`. |
| `GROQ_MODEL` | Opcional; por defecto `qwen/qwen3.8-27b`. |
| `APP_TIMEZONE` | Opcional; por defecto `America/Argentina/Buenos_Aires`. |
| `FRONTEND_URL` | Origen permitido por CORS (sin barra final), además de `http://localhost:5500`. |
| `PORT` | Opcional; por defecto 3000 (Render lo define solo). |

## 8. Tests

```bash
npx tsc --noEmit
npm run lint
npm test            # unitarios: reglas del análisis y parseo del OCR, sin base
npm run test:e2e    # e2e contra el Supabase del .env
```

- **e2e:** levantan la app con `configureApp` (como `main.ts`) y prueban cada endpoint contra Supabase real: auth, catálogos, gastos, tickets, recomendaciones, análisis y health.
  - **OCR simulado:** `createTestApp({ ocr })` reemplaza el OCR, así cada test decide qué devuelve la IA (lectura correcta, error, timeout, sin configurar) sin llamar a Groq.
  - **En serie:** corren con `--runInBand`. En paralelo, la asignación automática podía darle a un cliente de un archivo el asesor de prueba de otro.
- **Limpieza:** cada archivo registra sus propias cuentas (`<prefijo>.<timestamp>.<n>@test.com`). Al terminar, `cleanupTestUser` las borra con todo lo suyo: archivos de Storage, análisis OCR, gastos, tickets, recomendaciones, clasificaciones, asignaciones, perfiles, el usuario y la cuenta de Auth. Si una corrida se corta a la mitad, pueden quedar cuentas `@test.com`; se borran por id.
- Si se toca una regla del análisis, se cambia también en el mock y en el §4.

## 9. Deploy en Render

`render.yaml` (en la raíz del repo) define el servicio:
- Node 22, plan gratuito, región Virginia (cerca de Supabase `us-east-1`), rama `main`, `rootDir: backend`.
- Build `npm ci && npm run build` (usa `tsconfig.build.json`, que excluye los `*.spec.ts`); start `npm run start`; health check `/api/v1/health`.

Pasos:
1. Render → New → **Blueprint** → este repo.
2. Cargar a mano los secretos: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `GROQ_API_KEY` y `FRONTEND_URL`.
3. Cada push a `main` redeploya. En el plan gratuito, el servicio se duerme tras 15 minutos sin uso.

## 10. Pendientes internos

Para después de la entrega (los pendientes generales están en el [README principal §14](../README.md#14-pendientes-después-de-la-entrega)):

- **Columnas sin uso:** borrar las 16 columnas del §6 con una migración nueva, después de confirmar que el front y el mock no las leen.
- **Cliente de Supabase:** crear los clientes de `src/common/supabase/supabase.provider.ts` con `auth: { persistSession: false }`. En el servidor no hay sesión que guardar.
