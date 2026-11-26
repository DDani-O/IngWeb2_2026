# Backend — NestJS + Supabase

Estado: **implementado**, pero su contrato todavía no coincide con el del front. La alineación se hace por fases según `../especificaciones/PlanIntegracionBackend.md`; hasta terminar la fase I2, el código responde en camelCase inglés y eso es lo que hay que corregir, no imitar.

## Estructura

- `src/main.ts` — prefijo global `/api/v1`, `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`), filtro global de errores, CORS (`FRONTEND_URL` + `http://localhost:5500`).
- `src/common/` — `auth/` (`JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()`), `filters/` (formato de errores), `supabase/` (clientes service role y anon).
- `src/modules/<dominio>/` — `auth`, `users`, `expenses`, `categories`, `tickets` (Storage + `ocr.service.ts` con Groq), `analytics`, `advisor`. Cada uno con `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`.
- `test/e2e/` — tests e2e con Jest + Supertest contra un Supabase real (limpian sus datos con `test-utils.ts`).
- `database/` — `migrations/0001..0015` (se ejecutan en orden en el SQL Editor de Supabase), `functions/` y `policies/` (referencia separada por archivo), `seeds/`, `DB_SCHEMA_SUMMARY.md`, `database.types.ts`. Tablas en español; leer el esquema antes de escribir DTOs. Cambios de esquema → migración nueva `00NN_*.sql`, nunca editar una ya aplicada.

## Convenciones

- **Contrato:** `../especificaciones/EspecificacionDesarrolloFront.md` §10 es la fuente de verdad y los mínimos de la consigna mandan. Rutas en inglés; **todo lo demás en español snake_case, igual que las columnas de la BD** (campos de entrada y salida, query params, errores `{error, mensaje, codigo, detalles}`, login `{token, usuario}`, multipart `archivo`). Sin mezclar idiomas en una misma respuesta. Si cambia un endpoint, se actualizan en el mismo cambio la spec §10, el mock del front (`../frontend/mocks/`) y `../frontend/services/adapters.js`.
- El `id` del usuario nunca viene del body: siempre del JWT (`@CurrentUser()`). Endpoints por rol con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`; roles `cliente` y `asesor`.
- El back usa el service role de Supabase (saltea RLS): la autorización y el control de pertenencia se hacen en los servicios Nest.
- Validación de entrada con DTOs + `class-validator`.
- Configuración por variables de entorno (`@nestjs/config`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `JWT_EXPIRATION`, `GROQ_API_KEY`, `PORT`, `FRONTEND_URL`. Mantener `.env.example` versionado con esas claves; el `.env` real nunca se commitea.

## Comandos

- `npm install` · `npm run start:dev` · `npm run build` · `npm run lint` · `npm run test:e2e`
- Después de cada cambio: `npx tsc --noEmit` (o `npm run build`) y, si hay `.env` de prueba, `npm run test:e2e`.
