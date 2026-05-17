# FinTrack Backend — Contexto para Generación de Código (v2)

**Stack:** NestJS + TypeScript + Supabase (PostgreSQL) + JWT + Gemini AI  
**Base URL:** `https://fintrack-api.onrender.com/api/v1`  
**Proyecto:** Ingeniería Web II — 2026

---

## Arquitectura

Cada dominio tiene: `*.module.ts` → `*.controller.ts` → `*.service.ts` → `dto/*.dto.ts`

- **Controlador:** solo recibe el request HTTP y delega al servicio.
- **Servicio:** lógica de negocio. Interactúa con Supabase (vía `SUPABASE_CLIENT` con service key).
- **DTO:** define y valida el JSON entrante con `class-validator` y `class-transformer`.
- **Guard:** `JwtAuthGuard` verifica JWT; `RolesGuard` verifica el rol (`cliente` o `asesor`).

**Pipeline de un request:**
1. `JwtAuthGuard` → verifica JWT, adjunta `user` al request.
2. `ValidationPipe` → valida el DTO (whitelist: true, transform: true).
3. `Controller` → delega al servicio.
4. `Service` → lógica + Supabase.

---

## Estructura de carpetas

```
src/
├── main.ts
├── app.module.ts
└── modules/
    ├── auth/         { auth.module, auth.controller, auth.service, dto/{register,login}.dto }
    ├── users/        { users.module, users.controller, users.service, dto/update-user.dto }
    ├── expenses/     { expenses.module, expenses.controller, expenses.service, dto/{create,update,query}-expense.dto }
    ├── categories/   { categories.module, categories.controller, categories.service, dto/category.dto }
    └── advisor/      { advisor.module, advisor.controller, advisor.service, dto/*.dto }
```

---

## Seguridad — Reglas críticas

- El `user_id` **NUNCA** viene del body. Siempre del token JWT via `@CurrentUser()`.
- El JWT payload incluye `{ sub: userId, email, role }`.
- Roles válidos: `cliente` (antes "usuario") y `asesor`.
- Endpoints de asesor usan `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('asesor')`.
- Categorías (`GET /categories`) es **PÚBLICO** (sin guard).

---

## Endpoints — Contrato completo

### AUTH (público)

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/auth/register` | `{ email, password, fullName, role: 'cliente'\|'asesor', ...extras }` | `201 { access_token, user }` |
| `POST` | `/auth/login` | `{ email, password }` | `200 { access_token, user }` |

- `extras` en register (según rol): `licenseNumber`, `specialty`, `occupation`, `estimatedIncome`, etc.

### USERS (🔒 JWT)

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `GET` | `/users/me` | — | `200` perfil completo (base + extendido) |
| `PATCH` | `/users/me` | campos opcionales | `200` perfil actualizado |
| `GET` | `/users/me/recommendations` | — | `200 { stats, recommendations[] }` |

**Base User:**
```json
{
  "id": "uuid",
  "email": "string",
  "fullName": "string",
  "role": "cliente|asesor",
  "avatarUrl": "string|null",
  "createdAt": "ISO date",
  "lastLogin": "ISO date|null",
  "profile": "string|null",
  "advisorName": "string|null"
}
```

### CATEGORIES (público)

| Método | Ruta | Respuesta |
|--------|------|-----------|
| `GET` | `/categories` | `200 [{ id, nombre, icono, descripcion }]` |

### EXPENSES (🔒 JWT — solo `cliente`)

| Método | Ruta | Body / Query | Respuesta |
|--------|------|------|-----------|
| `GET` | `/expenses` | `?page&limit&categoryId&from&to&search` | `200 { data[], pagination }` |
| `POST` | `/expenses` | `{ amount, merchant, categoryId, date, notes? }` | `201` gasto completo |
| `GET` | `/expenses/summary` | `?month=YYYY-MM` | `200 { totalMonth, totalByCategory[], ... }` |
| `PATCH` | `/expenses/:id` | campos opcionales | `200` gasto actualizado |
| `DELETE` | `/expenses/:id` | — | `204 No Content` |

### ADVISOR (🔒 JWT — solo `asesor`)

| Método | Ruta | Body / Query | Respuesta |
|--------|------|------|-----------|
| `GET` | `/advisor/dashboard` | — | `200` datos consolidados del asesor |
| `GET` | `/advisor/clients` | `?page&limit&search&status&risk&profile` | `200 { data[], pagination }` |
| `GET` | `/advisor/clients/:clientId` | — | `200` detalle del cliente |
| `GET` | `/advisor/clients/:clientId/expenses` | query de gastos | `200 { data[], pagination }` |
| `GET` | `/advisor/recommendations` | `?clientId&type&status` | `200 { data[], pagination }` |
| `POST` | `/advisor/recommendations` | `{ clientId, title?, content, type, priority?, icon?, ... }` | `201` recomendación creada |
| `GET` | `/advisor/messages` | `?clientId&onlyUnread` | `200` mensajes/inbox |
| `POST` | `/advisor/messages` | `{ clientId, subject?, content, type? }` | `201` mensaje enviado |
| `GET` | `/advisor/reports` | — | `200` reportes de gestión |

---

## Integración IA — OCR de Tickets

**Flujo:** `frontend` → `POST /tickets/upload` → `tickets.service`:
1. Subir imagen a Supabase Storage (`ticket-images/{userId}/{timestamp}.jpg`).
2. Llamar a Gemini (modelo `gemini-1.5-flash`).
3. Extraer: `amount`, `merchant`, `date`.
4. Crear automáticamente el gasto en la tabla `gastos`.
5. Retornar `202 Accepted`.

---

## Manejo de Errores

| Excepción | HTTP |
|-----------|------|
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `ConflictException` | 409 |
| `InternalServerErrorException` | 500 |

Formato: `{ "statusCode", "message", "timestamp", "path" }`.
