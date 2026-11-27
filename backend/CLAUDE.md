# Backend — NestJS + Supabase

Estado: implementa todo el contrato de la spec §10 y está probado contra Supabase con el front (fases I2–I6 de `../especificaciones/PlanIntegracionBackend.md`). Deployado en Render (`render.yaml`, rama `main`): https://fintrack-api-5vmm.onrender.com/api/v1.

## Estructura

- `src/main.ts` — arranque y CORS (`FRONTEND_URL` + `http://localhost:5500`).
- `src/health.controller.ts` — `GET /api/v1/health` público (`{ estado: "ok" }`), para el health check de Render y para que el front despierte el servidor del plan gratuito.
- `src/app.setup.ts` — `configureApp()`: prefijo global `/api/v1`, `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`; errores como 422 `VALIDACION`) y filtro global de errores. La usan `main.ts` y los tests e2e.
- `src/common/` — `auth/` (`JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()`), `assignments/` (`AssignmentsService`: control de asignación asesor ↔ cliente, 403 si no está asignado), `errors/` (`ApiException`, códigos del contrato y helpers `validationError`, `notFoundError`, `forbiddenError`, `internalError`), `filters/` (serializa todo error como `{error, mensaje, codigo, detalles}`), `supabase/` (clientes service role y anon).
- `src/modules/<dominio>/` — `auth` (también `/auth/me` y `/auth/profile`), `users` (arma el objeto `usuario`; sin rutas propias), `categories` (catálogos), `expenses`, `tickets` (Storage + `ocr.service.ts` con Groq), `recommendations`, `analysis` y `clients`. Cada uno con `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`; los objetos del contrato se arman en un mapper o función `to*` por dominio.
- `src/modules/analysis/` — `analysis.rules.ts` (reglas de la spec §10.6 como funciones puras, port exacto de `../frontend/mocks/analytics.js`; tests en `analysis.rules.spec.ts`), `calendar.ts` (fechas `AAAA-MM-DD` y "hoy" en `APP_TIMEZONE`) y `analysis.service.ts` (lee de Supabase, aplica las reglas y sincroniza `clasificacion_de_perfil` solo cuando cambia el perfil).
- `test/e2e/` — tests e2e con Jest + Supertest contra un Supabase real; `test-utils.ts` levanta la app con `configureApp`, registra cuentas y limpia los datos.
- `database/` — `migrations/0001..0017` (se ejecutan en orden en el SQL Editor de Supabase; la base de producción está al día con la `0017`), `functions/` y `policies/` (referencia separada por archivo), `seeds/` (`seed_demo_jun_nov_2026.sql`: datos de la demo, idempotente), `DB_SCHEMA_SUMMARY.md` (esquema actual y objetos eliminados), `database.types.ts`. Cómo cargarla: `database/README.md`. Tablas en español; leer el esquema antes de escribir DTOs. Cambios de esquema → migración nueva `00NN_*.sql`, nunca editar una ya aplicada.

## Convenciones

- **Contrato:** `../especificaciones/EspecificacionDesarrolloFront.md` §10 es la fuente de verdad y los mínimos de la consigna mandan. Rutas en inglés; **todo lo demás en español snake_case, igual que las columnas de la BD** (campos de entrada y salida, query params, errores `{error, mensaje, codigo, detalles}`, login `{token, usuario}`, multipart `archivo`). Sin mezclar idiomas en una misma respuesta. Si cambia un endpoint, se actualizan en el mismo cambio la spec §10, el mock del front (`../frontend/mocks/`) y `../frontend/services/adapters.js`.
- El `id` del usuario nunca viene del body: siempre del JWT (`@CurrentUser()`). Endpoints por rol con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`; roles `cliente` y `asesor`.
- El back usa el service role de Supabase (saltea RLS): la autorización y el control de pertenencia se hacen en los servicios Nest.
- Validación de entrada con DTOs + `class-validator`, con mensaje en español en cada regla (la primera regla declarada es la que se informa). Errores de negocio con los helpers de `common/errors`, nunca con las excepciones de Nest con texto suelto; el detalle técnico va al `Logger`, no a la respuesta.
- Configuración por variables de entorno (`@nestjs/config`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `JWT_EXPIRATION`, `GROQ_API_KEY`, `PORT`, `FRONTEND_URL` y, opcionales, `GROQ_MODEL` (modelo de Groq con visión; por defecto `qwen/qwen3.8-27b`, ver `DEFAULT_GROQ_MODEL` en `ocr.service.ts`; Groq retira modelos, así que si el OCR empieza a dar 404 hay que listar los de la cuenta con `GET https://api.groq.com/openai/v1/models` y elegir uno con `image` en `input_modalities`) y `APP_TIMEZONE` (por defecto `America/Argentina/Buenos_Aires`). Mantener `.env.example` versionado con esas claves; el `.env` real nunca se commitea.

## Comandos

- `npm install` · `npm run start:dev` · `npm run build` · `npm run lint` · `npm test` (unitarios, sin BD) · `npm run test:e2e`
- Después de cada cambio: `npx tsc --noEmit`, `npm test` y, si hay `.env` de prueba, `npm run test:e2e`. Si se toca una regla del análisis, cambiarla también en el mock y en la spec §10.6.
- El build usa `tsconfig.build.json` (excluye los `*.spec.ts` y guarda el estado incremental dentro de `dist/`).
