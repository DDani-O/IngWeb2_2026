# Backend — NestJS + Supabase

Estado: alineándose con el contrato por fases (`../especificaciones/PlanIntegracionBackend.md`). Desde la fase I2, `auth`, `users`, `categories`, `expenses`, `tickets`, `recommendations` y `clients` siguen el contrato. `advisor` y `analytics` (y `UsersController`) son heredados: responden en camelCase inglés hasta que la fase I3 los reemplace; no tomarlos como modelo.

## Estructura

- `src/main.ts` — arranque y CORS (`FRONTEND_URL` + `http://localhost:5500`).
- `src/app.setup.ts` — `configureApp()`: prefijo global `/api/v1`, `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`; errores como 422 `VALIDACION`) y filtro global de errores. La usan `main.ts` y los tests e2e.
- `src/common/` — `auth/` (`JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()`), `errors/` (`ApiException`, códigos del contrato y helpers `validationError`, `notFoundError`, `forbiddenError`, `internalError`), `filters/` (serializa todo error como `{error, mensaje, codigo, detalles}`), `supabase/` (clientes service role y anon).
- `src/modules/<dominio>/` — `auth`, `users` (objeto `usuario`), `categories` (catálogos), `expenses`, `tickets` (Storage + `ocr.service.ts` con Groq), `recommendations`, `clients` y los heredados `analytics` y `advisor`. Cada uno con `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`; los objetos del contrato se arman en un mapper o función `to*` por dominio.
- `test/e2e/` — tests e2e con Jest + Supertest contra un Supabase real; `test-utils.ts` levanta la app con `configureApp`, registra cuentas y limpia los datos.
- `database/` — `migrations/0001..0015` (se ejecutan en orden en el SQL Editor de Supabase), `functions/` y `policies/` (referencia separada por archivo), `seeds/`, `DB_SCHEMA_SUMMARY.md`, `database.types.ts`. Tablas en español; leer el esquema antes de escribir DTOs. Cambios de esquema → migración nueva `00NN_*.sql`, nunca editar una ya aplicada.

## Convenciones

- **Contrato:** `../especificaciones/EspecificacionDesarrolloFront.md` §10 es la fuente de verdad y los mínimos de la consigna mandan. Rutas en inglés; **todo lo demás en español snake_case, igual que las columnas de la BD** (campos de entrada y salida, query params, errores `{error, mensaje, codigo, detalles}`, login `{token, usuario}`, multipart `archivo`). Sin mezclar idiomas en una misma respuesta. Si cambia un endpoint, se actualizan en el mismo cambio la spec §10, el mock del front (`../frontend/mocks/`) y `../frontend/services/adapters.js`.
- El `id` del usuario nunca viene del body: siempre del JWT (`@CurrentUser()`). Endpoints por rol con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`; roles `cliente` y `asesor`.
- El back usa el service role de Supabase (saltea RLS): la autorización y el control de pertenencia se hacen en los servicios Nest.
- Validación de entrada con DTOs + `class-validator`, con mensaje en español en cada regla (la primera regla declarada es la que se informa). Errores de negocio con los helpers de `common/errors`, nunca con las excepciones de Nest con texto suelto; el detalle técnico va al `Logger`, no a la respuesta.
- Configuración por variables de entorno (`@nestjs/config`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `JWT_EXPIRATION`, `GROQ_API_KEY`, `PORT`, `FRONTEND_URL`. Mantener `.env.example` versionado con esas claves; el `.env` real nunca se commitea.

## Comandos

- `npm install` · `npm run start:dev` · `npm run build` · `npm run lint` · `npm run test:e2e`
- Después de cada cambio: `npx tsc --noEmit` (o `npm run build`) y, si hay `.env` de prueba, `npm run test:e2e`.
