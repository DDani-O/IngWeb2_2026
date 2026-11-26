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

### I0 — Integración de ramas
- Merge de `main` en `dev`: `frontend/` queda como en `main`, `backend/` como en `dev`.
- `backend/src/database/` desaparece (en `dev` se movió a `backend/database/`).
- `README.md`, `.gitignore` y `04-PerfilesDeGasto.md` se mezclan a mano.
- `backend/database/supabase/.temp/` sale del repo y pasa al `.gitignore`.
- `CLAUDE.md` y `backend/CLAUDE.md` reflejan que el back existe.
- Verificación: el back compila y el front anda con el mock.

### I1 — Contrato definitivo (solo spec)
- Reescribir la spec §10 con la convención de §2.
- Inventario endpoint por endpoint: qué expone hoy el back, qué necesita cada pantalla del front y si se mantiene, se renombra, se agrega o se borra.
- Resolver las decisiones de §4.
- Revisión de los integrantes antes de tocar código.

### I2 — Backend en español
- DTOs de entrada, funciones de mapeo de salida, query params, filtro de errores y respuesta de auth según §2.
- `PUT /expenses/:id` (mínimo de la consigna; hoy solo existe `PATCH`).
- Tests e2e actualizados.

### I3 — Backend: faltantes funcionales
- Perfil de gasto asignado automáticamente por el sistema; se elimina la asignación manual del asesor (`PATCH /advisor/clients/:id/profile`).
- Endpoints que el front necesita y no existen, según el inventario de I1.
- Una sola regla de gastos inusuales.

### I4 — Frontend alineado
- Servicios, `adapters.js` y mock (`frontend/mocks/`) ajustados al contrato final; el mock queda como espejo exacto del back para demos sin conexión.
- Ninguna página debería cambiar.

### I5 — Integración real
- Front con driver `http` contra el back y Supabase; checklist manual del README.
- `npm run test:e2e` en verde.
- Requiere un `backend/.env` con las claves de Supabase y Groq.

### I6 — Deploy y documentación
- Deploy de front y back; URLs en el README.
- Completar las secciones *(pendiente)* del README.
- Actualizar o retirar la documentación heredada de `dev` que quedó desactualizada (ver §5).

## 4. Decisiones pendientes (para I1)

1. **Gastos inusuales:** regla del back (z-score > 1,5 o percentil > 95 dentro de la categoría) o regla del mock (> 35 % sobre el promedio de la categoría, con ≥ 3 gastos de historia, últimos 30 días).
2. **Tickets:** flujo en dos pasos del back (`POST /tickets/upload` + `POST /tickets/:id/confirm`) o en uno solo (upload devuelve los datos detectados y el gasto se crea con `POST /expenses`).
3. **Frontend de `dev`:** si hay algo del "sandwich theme" o de `i18n.js` que convenga rescatar (quedó fuera del merge; se recupera con `git show 2ca5c28:<ruta>`).

## 5. Pendientes detectados en el merge

- `backend/.env.example` no existe y lo referencian el README y `backend/CLAUDE.md`.
- `tickets.service.ts` menciona `GEMINI_API_KEY` en el mensaje de error, pero el OCR usa `GROQ_API_KEY`.
- Documentación heredada de `dev` desactualizada: `backend/database/README.md` (rutas `backend/src/database/` y solo dos migraciones), `backend/FINTRACK_BACKEND_CONTEXT.md` (mensajería, Gemini, rutas viejas) y `PENDIENTES_GENERALES.md` (rutas `/usuario/*`, mocks del front viejo).
- `npm run lint` reporta 314 warnings (0 errores).
