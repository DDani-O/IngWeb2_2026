# Plan de integración backend ↔ frontend — FinTrack 2026

## 1. Contexto

`main` y `dev` se separaron el 19/04/2026 (commit `eb320b9`). Cada rama avanzó sobre una mitad distinta:

- **`dev`**: la API NestJS completa (auth, users, expenses, categories, tickets con OCR/IA, analytics, advisor), las migraciones `0001`–`0015` de Supabase y los tests e2e. El frontend de esa rama es la versión previa al refactor.
- **`main`**: el refactor completo del frontend (fases 0–5 de `DiagnosticoRefactor.md`) contra un backend simulado (`frontend/mocks/`), y la spec §10 con el contrato que espera el front.

Decisión: se conserva el **backend y la BD de `dev`** y el **frontend de `main`**, y se alinean los contratos.

## 2. Convención del contrato (decidida)

- **Rutas en inglés**, porque la consigna las fija: `/auth/login`, `/auth/register`, `/expenses`, `/expenses/:id`, `/tickets/upload`.
- **Todo lo demás en español snake_case, con los mismos nombres que las columnas de la BD**:
  - campos de entrada y salida: `monto`, `comercio`, `categoria_id`, `fecha_gasto`, `descripcion`, `cliente_id`, `creado_en`; los derivados también (`categoria_nombre`);
  - query params: `pagina`, `limite`, `categoria_id`, `desde`, `hasta`, `cliente_id`;
  - login y registro: `{ token, usuario }`;
  - errores: `{ error, mensaje, codigo, detalles }`;
  - multipart de tickets: campo `archivo`.
- **Sin mezclar idiomas** en una misma respuesta (hoy el back de `dev` devuelve `ocrEstado` junto a `amount`).
- La traducción al modelo de la UI ocurre en un solo lugar: `frontend/services/adapters.js`.

## 3. Fases

Una fase por commit; los integrantes commitean a mano.

### I0 — Integración de ramas ✅ completada
- Merge de `main` en `dev`: `frontend/` queda como en `main`, `backend/` como en `dev`.
- `backend/src/database/` desaparece (en `dev` se movió a `backend/database/`).
- `README.md`, `.gitignore` y `04-PerfilesDeGasto.md` se mezclan a mano.
- `backend/database/supabase/.temp/` sale del repo y pasa al `.gitignore`.
- `CLAUDE.md` y `backend/CLAUDE.md` reflejan que el back existe.
- Verificación: el back compila y el front anda con el mock.

### I1 — Contrato definitivo (solo spec) ✅ completada
- Reescribir la spec §10 con la convención de §2.
- Inventario endpoint por endpoint: qué expone hoy el back, qué necesita cada pantalla del front y si se mantiene, se renombra, se agrega o se borra.
- Resolver las decisiones de §4.
- Revisión de los integrantes antes de tocar código.

**Cómo quedó:** la spec §10 ya usaba la convención en español, así que se conservan sus rutas orientadas a recursos (`/auth/me`, `/clients`, `/analysis/*`, `/recommendations`) y es el back el que se reacomoda. Se agregaron: prefijo `/api/v1`, rechazo de campos desconocidos, límites del upload, flujo de tickets en un paso (con la vinculación del ticket en `POST /expenses`), catálogo fijo de 3 perfiles y cuándo se recalcula la clasificación. El inventario está en la spec §10.8: 22 endpoints del contrato con su equivalente actual y la fase en que se resuelven, 10 endpoints del back que se eliminan y los cambios de BD.

### I2 — Backend en español ✅ completada
- DTOs de entrada, funciones de mapeo de salida, query params, filtro de errores y respuesta de auth según §2.
- `PUT /expenses/:id` (mínimo de la consigna; hoy solo existe `PATCH`).
- Tests e2e actualizados.

**Cómo quedó:**
- `src/app.setup.ts` (`configureApp`) concentra prefijo `/api/v1`, `ValidationPipe` (422 `VALIDACION` con `detalles.campos` y el mensaje de la primera regla que falla) y filtro de errores; la usan `main.ts` y los tests. `src/common/errors/` define `ApiException` y los códigos del contrato.
- Implementadas todas las filas I2 de la spec §10.8: `auth` (registro, login, `/auth/me`, `/auth/profile`), `users` (arma el objeto `usuario`), `categories` (`/categories` y `/spending-profiles`), `expenses` (CRUD con `PUT`, filtros y orden de la spec, alta desde ticket), `tickets` (un paso, campo `archivo`, 5 MB, `analisis: null` si la IA falla), `recommendations` (módulo nuevo) y `clients` (módulo nuevo, por ahora `/clients/:id/expenses` y el control de asignación).
- Eliminados `/expenses/summary`, `/users/me` y sus subrutas salvo el análisis, `/advisor/profile`, `/advisor/recommendations*`, `/advisor/clients/:id/expenses` y `/tickets/:id/confirm`, con sus DTOs.
- `ocr.service.ts` devuelve los nombres de columna de `analisis_ocr` (se corrigieron `confianciaGeneral` y las menciones a Gemini).
- Tests e2e reescritos contra el contrato (`auth`, `categories`, `expenses`, `recommendations`); se borraron `users` y `advisor`, que probaban rutas eliminadas o la mensajería. Verificado sin BD: compilan, y los casos que no tocan Supabase pasan. Correrlos completos queda para I5.
- Prueba de humo sin BD (42 casos: guards, roles, validaciones, formato de errores, rutas eliminadas, límites del upload, fallos de Supabase como 500) en verde.

### I3 — Backend: faltantes funcionales ✅ completada
- Análisis de consumo reescrito con las reglas de la spec §10.6 (portar `frontend/mocks/analytics.js`): `/analysis/me`, `/analysis/clients/:id`, `/analysis/advisor/summary`, `/clients`, `/clients/:id`.
- Perfil de gasto asignado automáticamente por el sistema; se elimina la asignación manual del asesor (`PATCH /advisor/clients/:id/profile`).
- Gastos inusuales con la regla del 35 % (se descarta el z-score).
- Migración nueva: catálogo de 3 perfiles con `criterio_regla` en español (spec §10.8) y evaluar eliminar las vistas sin uso de la `0008`.
- Eliminar los endpoints pendientes de la lista de la spec §10.8 y, con ellos, los módulos heredados `advisor` y `analytics` y el `UsersController` (sus servicios ya no tienen otros usuarios; la regla del z-score se va con `analytics`).

**Cómo quedó:**
- Módulo `analysis`: `analysis.rules.ts` porta las reglas del mock como funciones puras; `analysis.service.ts` lee gastos (paginando de a 1000, el máximo de PostgREST), aplica las reglas y deja una sola clasificación vigente por cliente en `clasificacion_de_perfil`, escribiendo solo cuando el perfil cambia. "Hoy" se calcula en `APP_TIMEZONE` (por defecto Argentina): un servidor en UTC daba el mes corrido entre las 21 y las 24 hs.
- El objeto `usuario` toma el perfil del análisis en el momento (como el mock), así `/auth/me` nunca muestra uno desactualizado.
- `clients` suma `GET /clients` y `GET /clients/:id`; el control de asignación pasó a `common/assignments` para compartirlo sin dependencias circulares.
- Migración `0016_spending_profiles_v2.sql` y seed de perfiles nuevo. Se eliminaron `advisor`, `analytics`, `UsersController` y la dependencia `@google/generative-ai` (restos del OCR con Gemini).
- `tsconfig.build.json` (estándar de Nest): el build excluye los tests y guarda el estado incremental dentro de `dist/`. Antes, borrar `dist/` a mano dejaba un build incompleto (sin `main.js`).
- Verificación:
  - 24 tests unitarios de reglas y calendario (`npm test`).
  - Comparación de las reglas con el mock: 73 casos idénticos, con 8 clientes, varias fechas, bordes de mes y cambio de año.
  - Las 16 migraciones aplicadas en orden sobre un PostgreSQL 16 local; la `0016` probada sobre el catálogo viejo y dos veces seguidas.
  - Integración contra PostgreSQL + PostgREST locales con el seed del mock: análisis de los 8 clientes y resumen del asesor idénticos al mock, sincronización de perfiles, `/clients`, 403, gastos con ticket, recomendaciones, edición de perfil y rutas eliminadas.
  - Sin cubrir: Supabase Auth (registro y login) y Storage, que quedan para I5. Test e2e nuevo: `analysis.e2e-spec.ts`.

### I4 — Frontend alineado ✅ completada
- Servicios, `adapters.js` y mock (`frontend/mocks/`) ajustados al contrato final; el mock queda como espejo exacto del back para demos sin conexión.
- `API_CONFIG.BASE_URLS.local` pasa a `http://localhost:3000/api/v1`.
- Nombres de categorías del seed del mock iguales a los de la BD (con tildes, y se suma `Hogar`).
- Nombres de perfiles con tildes, como en la BD (`Drácula Nocturno`, `Equilibrista Cósmico`, `Espíritu Libre`), en el seed del mock y en `content/spendingProfiles.js`; `findSpendingProfileContent` tiene que comparar sin distinguir tildes.
- La BD limita los clientes por asesor (`perfiles_asesores.capacidad_maxima`, 5 por defecto) y el mock le asigna 8 al asesor de prueba: reflejar el límite en el mock y darle capacidad suficiente al asesor de la demo en los datos de I5.
- El upload responde `analisis: null` si la IA falla: `Cargar gasto` tiene que avisar y dejar el formulario para completar a mano.
- Ninguna página debería cambiar.

**Cómo quedó:** hechos todos los puntos. Además: timeout de 30 s para la carga de tickets (`API_CONFIG.UPLOAD_TIMEOUT_MS`), `TicketUploader` acepta solo JPEG/PNG/WebP, `maxlength` de los formularios iguales a los del back, `ocr_estado = fallido` en el back cuando la IA no leyó el ticket y corrección de `Modal.destroy()` (liberar el modal durante su animación de cierre tiraba un error). Único cambio de página: `Cargar gasto` avisa cuando el ticket no se pudo leer. Verificado en Firefox headless con los dos drivers: todas las pantallas de los dos roles y los flujos de gasto manual, ticket, edición, recomendación leída, perfil y envío de recomendación, sin errores de consola ni respuestas 4xx/5xx; con `http`, contra la API real sobre PostgreSQL + PostgREST locales y verificando lo persistido. Sin cubrir: registro y login reales (Supabase Auth), para I5.

### I5 — Integración real ✅ completada
- Front con driver `http` contra el back y Supabase; checklist manual del README.
- `npm run test:e2e` en verde.
- Requiere un `backend/.env` con las claves de Supabase y Groq.

**Cómo quedó:**
- **OCR:** el modelo de Groq es configurable con `GROQ_MODEL` (por defecto `qwen/qwen3.8-27b`, el único con visión de la cuenta el 26/11; `meta-llama/llama-4-scout-17b-16e-instruct` se retiró el 17/07/2026 y daba 404). `parseMonto` (exportada en `ocr.service.ts`) reemplaza a `extractMonto`, que borraba todos los puntos (355.37 → 35537): si el valor es number se usa tal cual y, si es texto, el último `.` o `,` seguido de 1 o 2 dígitos es el decimal. 28 tests en `ocr.service.spec.ts`. Probado con tickets reales: Carrefour → 355.37, sintético → 17230.74, Zara → 25, todos con comercio, fecha y categoría correctos; el gasto queda con `origen = ticket` y vinculado a `tickets` y `analisis_ocr`.
- **Fechas futuras:** regla `NotAfterToday` en `expense-fields.ts` (alta y edición, "hoy" en `APP_TIMEZONE`), la misma regla en el mock, `max` = hoy en el input (ya estaba en `ExpenseForm`), spec §10.3 y test e2e.
- **Driver por entorno:** `API_CONFIG.DRIVERS` (`production: "http"` sin override posible; `local: "mock"`, con override en `localStorage`). README §7 lo explica.
- **Dashboards sin datos** (punto 6 del relevamiento): con la base real, la torta, el ranking y la categoría dominante usaban todo el historial mientras las barras mostraban 7 meses, y con el mes en $0 aparecía la alerta verde "Tus gastos estan dentro de lo habitual". Ahora esos agregados usan solo el `periodo` informado, y las alertas distinguen "Sin gastos en el periodo analizado" y "Todavia no registraste gastos este mes" (`info`); nunca hay `success` con el mes en $0. Cambiado en back, mock y spec §10.6 (4 tests nuevos; mock y back idénticos en 40 casos con bordes de mes, de año y gastos fuera del período). En el front, la línea de promedio del gráfico mensual usa el mismo `gasto_promedio_mensual` del KPI (antes mostraba otro número), Patrones no afirma "sin gastos inusuales" cuando no hay gastos y se corrigieron las leyendas.
- **Base de datos:** migración `0017_security_functions.sql` aplicada (sin acceso anónimo a funciones `SECURITY DEFINER`, `obtener_gastos_inusuales` y `calcular_zscore` eliminadas, `search_path = public` en las 18 funciones); probada antes en un PostgreSQL 16 local con las 16 migraciones previas. Seed `seed_demo_jun_nov_2026.sql` aplicado (218 gastos de junio a hoy para bj@ y bi@, idempotente, sin fechas futuras; mj@ con capacidad 10; `asesorprueba@gmail.com` inactivo para que los registros de la demo vayan a mj@). Limpieza: el ticket en error del 24/11, 9 archivos huérfanos de Storage y las cuentas de prueba.
- **Tests:** 56 unitarios y 39 e2e contra Supabase en verde. Los e2e fallaban por el timeout de 5 s de Jest (registrar cuentas en Supabase tarda más): `testTimeout` de 60 s en `jest-e2e.json`; no quedan cuentas de test después de correrlos.
- **Recorrido con `http`:** registro y login reales, todas las pantallas de los dos roles, alta/edición/borrado de gasto, tickets, filtros, detalle de recomendaciones y análisis por cliente del asesor, sin errores de consola ni respuestas 4xx/5xx inesperadas; los números de dashboard, patrones y cartera coinciden con la base. El modo `mock` sigue andando.
- Detalles menores detectados en esta fase: ver §5.

### I6 — Deploy y documentación ✅ completada
- Deploy de front y back; URLs en el README.
- Completar las secciones *(pendiente)* del README.
- Actualizar o retirar la documentación heredada de `dev` que quedó desactualizada.

**Parte 1 (26/11):**
- Configuración versionada: `render.yaml` (API en Render, plan free, región Virginia junto a Supabase `us-east-1`, rama `main`, health check `/api/v1/health`) y `netlify.toml` (publica `frontend/` sin build). Build probado desde una copia limpia con los mismos comandos de Render (`npm ci && npm run build`, `npm run start`): arranca, `/health` responde y el CORS acepta solo `FRONTEND_URL`.
- `GET /health` público (`src/health.controller.ts`, spec §10, mock y e2e).
- Arranque en frío del plan gratuito: con el driver `http`, `APIClient.wakeUp()` llama a `/health` al abrir la app (hasta 90 s), los demás pedidos lo esperan y, si tarda más de 2,5 s, se muestra "Despertando el servidor…" hasta que responde. Probado demorando `/health` 8 s: el login enviado mientras tanto espera y entra sin errores.
- README: estado, modelo de datos (`0017`, seed de demo), endpoints (`/health`), uso de la IA (modelo configurable, `parseMonto`), tecnologías y guía de deploy. Las URLs se completan después del deploy.
- Documentación heredada: `backend/database/README.md` reescrito; `DB_SCHEMA_SUMMARY.md` actualizado (objetos eliminados por la `0013`, `0014`, `0016` y `0017`, migraciones hasta la `0017`); se retiraron `backend/database/INDEX.md`, `backend/FINTRACK_BACKEND_CONTEXT.md` y `PENDIENTES_GENERALES.md`, cuyo contenido vigente ya está en los `CLAUDE.md`, la spec y este plan.

**Parte 2 (27/11) — deploy:**
- Backend en Render (Blueprint de `render.yaml`): https://fintrack-api-5vmm.onrender.com/api/v1.
- Frontend en Netlify (`netlify.toml`): https://fintrack-iua.netlify.app.
- `API_CONFIG.BASE_URLS.production` apunta a Render y `FRONTEND_URL` en Render a Netlify.
- Verificado online: `GET /health` responde `{ estado: "ok" }`; el preflight CORS desde la URL de Netlify devuelve `access-control-allow-origin` con ese origen; un login inválido responde 401 `CREDENCIALES_INVALIDAS` con el formato de error del contrato; Netlify sirve la versión de `constants.js` con la URL de producción.
- README (URLs públicas y guía de deploy), spec §10 y `CLAUDE.md` actualizados.

## 4. Decisiones

Tomadas en I1:

1. **Gastos inusuales:** la regla del mock (> 35 % sobre el promedio de la categoría, con ≥ 3 gastos de historia, últimos 30 días). Se descarta el z-score del back.
2. **Tickets:** flujo en un paso; el gasto se crea con `POST /expenses` (`origen: "ticket"`, `ticket_id`) y se elimina `POST /tickets/:id/confirm`.
3. **Perfiles de gasto:** los 3 del front (Drácula Nocturno, Equilibrista Cósmico, Espíritu Libre) con regla automática por gasto discrecional; se reemplaza el seed de 7 perfiles de `dev`.

Cerrada al terminar la integración:

4. **Frontend de `dev`:** no se rescata nada del "sandwich theme" ni de `i18n.js` para la entrega: la consigna no pide internacionalización y el front de `main` ya tiene su propio tema (`ThemeManager`, claro/oscuro). Si más adelante se quiere retomar, el código se recupera con `git show 2ca5c28:<ruta>`.

## 5. Pendientes antes de la entrega (fuera de las fases)

La integración está cerrada. Lo resuelto de los pendientes del merge: la documentación heredada de `dev` se reescribió o retiró en I6; `npm run lint` da 0 errores y 0 warnings desde I3; los `Logica_modulo_*.md` se borraron en I2.

Quedan tareas del equipo (paneles y archivos que Claude Code no toca):

- **Seguridad:** cambiar las claves de las cuentas reales de la demo (`bj@`, `bi@`, `cn@`, `mj@` y `asesorprueba@`), que usan `Fintrack2026*` (la clave publicada para el mock), y pasar las nuevas a los docentes por privado. Activar en Supabase **Authentication → Policies → Leaked password protection**.
- **`backend/.env.example`:** agregar `GROQ_MODEL=qwen/qwen3.8-27b` y `APP_TIMEZONE=America/Argentina/Buenos_Aires` (opcionales; la regla de permisos sobre `.env*` impide editarlo desde Claude Code).
- **Día de la demo (1/12):** volver a correr `seed_demo_jun_nov_2026.sql` esa mañana (idempotente) para que "Gasto del mes" no arranque en $0, y abrir la app un par de minutos antes para que Render despierte.

Detalles menores conocidos (no bloquean):

- La UI muestra los montos sin centavos ($ 48.351 por 48.350,90).
- La categoría `Ropa` existe en la base de Supabase pero no en las migraciones, en el seed del mock ni en las categorías que sugiere el OCR.
