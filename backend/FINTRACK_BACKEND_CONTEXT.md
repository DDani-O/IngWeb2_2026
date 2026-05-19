# FinTrack Backend — Contexto tecnico (actualizado mayo 2026)

**Stack:** NestJS + TypeScript + Supabase (PostgreSQL + Auth + Storage) + JWT + Google Gemini AI
**Base URL local:** `http://localhost:3000/api/v1`
**Proyecto:** Ingenieria Web II — 2026

---

## Arquitectura

### Pipeline de un request
```
Request HTTP
  → JwtAuthGuard (verifica JWT, adjunta JwtPayload al request)
  → RolesGuard (si aplica, verifica rol)
  → ValidationPipe (valida y transforma el DTO)
  → Controller (delega al servicio)
  → Service (logica + consultas Supabase)
  → Response
```

### Convencion por modulo
```
src/modules/<dominio>/
  <dominio>.module.ts
  <dominio>.controller.ts
  <dominio>.service.ts
  dto/
    *.dto.ts
```

### Seguridad — reglas criticas
- El `user_id` **NUNCA** viene del body. Siempre del JWT via `@CurrentUser()`.
- JWT payload: `{ sub: userId, email, role }`.
- Roles validos: `cliente` y `asesor`.
- Endpoints de asesor: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('asesor')`.
- `GET /categories` es **publico** (sin guards).
- El backend usa el **service role** de Supabase, sin RLS en las consultas del servidor. La seguridad se aplica en la capa NestJS (guards + validacion de ownership manual).

---

## Modulos

### `auth`
Registro y login de usuarios.

**Endpoints:**
```
POST /auth/register   { email, password, fullName, role, ...extras }  → 201 { access_token, user }
POST /auth/login      { email, password }                              → 200 { access_token, user }
```

**Flujo register:**
1. Crear usuario en `auth.users` via Supabase Admin API.
2. Insertar en `usuarios` (nombre, rol, email).
3. Crear `perfiles_usuarios` o `perfiles_asesores` segun rol.
4. Asignar asesor disponible automaticamente si rol=cliente (`obtener_asesor_disponible()`).
5. Retornar JWT + datos del usuario.

---

### `users`
Perfil del usuario autenticado, recomendaciones, dashboard cliente, perfiles de gasto.

**Endpoints:**
```
GET   /users/me                              → perfil completo (base + extendido segun rol)
PATCH /users/me                              → actualizar perfil (campos segun rol)
GET   /users/me/recommendations              → { stats, recommendations[] }
GET   /users/me/dashboard                    → { profile, recommendations.stats, createdAt }
GET   /users/me/consumption-analysis         → analytics completo (ver modulo analytics)
GET   /users/spending-profiles               → { profiles[] } catalogo de perfiles de gasto
```

**Respuesta GET /users/me (cliente):**
```json
{
  "id": "uuid",
  "email": "string",
  "fullName": "string",
  "role": "cliente",
  "avatarUrl": "string|null",
  "createdAt": "ISO",
  "lastLogin": "ISO|null",
  "spendingProfile": "string|null",
  "spendingProfileSource": "asesor|sistema|null",
  "advisorName": "string|null",
  "phone": "string|null",
  "country": "string|null",
  "occupation": "string|null",
  "monthlyIncome": 0,
  "savingsGoal": 0,
  "alertThreshold": 0,
  "currency": "ARS",
  "theme": "dark",
  "notifyEmail": true,
  "notifyPush": false,
  "financialGoal": "string|null"
}
```

**PATCH /users/me — campos permitidos:**

Cliente: `fullName`, `avatarUrl`, `phone`, `country`, `occupation`, `monthlyIncome`, `savingsGoal`, `alertThreshold`, `currency`, `theme`, `notifyEmail`, `notifyPush`, `financialGoal`

Asesor: `fullName`, `avatarUrl`, `licenseNumber`, `specialty`, `description`

> Nota: `country` mapea a la columna `pais` en `perfiles_usuarios`. El campo fue renombrado de `ciudad` en migration 0010.

---

### `expenses`
CRUD de gastos. Solo para clientes.

**Endpoints:**
```
GET    /expenses                    ?page&limit&categoryId&from&to&search&orderBy&order
POST   /expenses                    { amount, merchant, categoryId, date, currency?, notes?, origin? }
GET    /expenses/:id
PATCH  /expenses/:id                campos opcionales
DELETE /expenses/:id
GET    /expenses/summary            ?month=YYYY-MM
```

**GET /expenses/summary** retorna: `totalMonth`, `totalByCategory[]`, `averageExpense`, `totalTransactions`, `topMerchant`.

---

### `categories`
Catalogo global de categorias de gasto. Endpoint publico.

```
GET /categories   → [{ id, nombre, icono, descripcion }]
```

---

### `tickets`
Upload de tickets (imagenes/PDF) y procesamiento OCR via Gemini AI.

**Endpoints:**
```
POST /tickets/upload    multipart/form-data { file }   → 202 { ticketId, status, expense? }
GET  /tickets                                          → [{ id, estado_procesamiento, subido_en }]
GET  /tickets/:id/status                               → { id, estado, resultado? }
```

**Flujo OCR:**
1. Subir archivo a Supabase Storage en bucket `ticket-images/{userId}/{timestamp}`.
2. Llamar a Gemini (`gemini-1.5-flash`) con el contenido del archivo.
3. Prompt extrae: `comercio`, `monto`, `fecha`, `categoria_sugerida`.
4. Crear registro en `analisis_ocr` con resultado del modelo.
5. Si confianza es suficiente, crear gasto con `origen: "ticket"` y `ocr_estado: "procesado"`.
6. Retornar resultado al frontend para confirmacion del usuario.

---

### `analytics`
Calculo dinamico de analytics de consumo. No persiste en `analisis_de_consumo`.

**Endpoint:**
```
GET /users/me/consumption-analysis?monthsBack=12
```

**Respuesta:**
```json
{
  "highlights": {
    "totalExpense": 0,
    "averageExpense": 0,
    "maxExpense": 0,
    "minExpense": 0,
    "dayOfHighestExpense": "string|null",
    "topMerchants": [{ "merchant": "string", "count": 0 }]
  },
  "categoryDistribution": [
    { "categoryName": "string", "amount": 0, "percentage": 0, "count": 0 }
  ],
  "monthlyEvolution": [
    { "month": "YYYY-MM", "totalExpense": 0, "transactionCount": 0, "averageExpense": 0 }
  ],
  "categoryMonthlyEvolution": {
    "months": ["YYYY-MM"],
    "series": [{ "name": "string", "amounts": [0] }]
  },
  "unusualExpenses": [
    {
      "id": "uuid",
      "amount": 0,
      "merchant": "string",
      "date": "ISO",
      "category": "string",
      "categoryMean": 0,
      "zScore": 0,
      "anomalyScore": 0
    }
  ]
}
```

**Servicios internos del modulo analytics:**
- `ConsumptionAnalyticsService`: orquesta el calculo completo.
- `AnomalyDetectionService`: Z-score + percentil para deteccion de gastos inusuales.

**Algoritmo de anomalias:**
1. Agrupar gastos por categoria.
2. Por categoria: calcular media y desvio estandar.
3. Z-score de cada gasto: `(monto - media) / stdev`.
4. Percentil dentro de su categoria.
5. Gasto anomalo si `|zScore| > 1.5` O `percentil > 95`.
6. Score final: promedio ponderado de zscore y percentil (0-1).
7. Retorna top N anomalias ordenadas por score desc.

---

### `advisor`
Dashboard del asesor, gestion de cartera, perfiles, recomendaciones, mensajeria.

**Endpoints:**
```
GET   /advisor/dashboard
GET   /advisor/profile
PATCH /advisor/profile                 { specialty?, description?, maxCapacity?, phone?, country? }

GET   /advisor/clients                 ?page&limit&search&status&profile
GET   /advisor/clients/:id
GET   /advisor/clients/:id/expenses    ?from&to&page&limit
GET   /advisor/clients/:id/profile     perfil activo del cliente
POST  /advisor/clients/:id/assign-profile   { profileId, motivo? }   asigna perfil al cliente

GET   /advisor/recommendations         ?clientId&status&type
POST  /advisor/recommendations         { clientId, title, content, type, priority?, icon?, problem?, solution?, savingsPotential?, steps? }
PATCH /advisor/recommendations/:id     { status? }

GET   /advisor/messages                ?clientId&onlyUnread
POST  /advisor/messages                { clientId, subject?, content, type? }

GET   /advisor/reports
```

**Asignacion automatica de clientes:**
Al registrarse un nuevo cliente, el sistema llama a `obtener_asesor_disponible()` (funcion SQL) que retorna el asesor con menor cantidad de clientes activos respecto a su `capacidad_maxima`. Se crea una fila en `asignaciones_de_clientes` automaticamente.

---

## DTOs — Convenciones

- Todos los DTOs usan `class-validator` con `@IsOptional`, `@IsString`, `@IsNumber`, etc.
- `ValidationPipe` configurado con `whitelist: true, transform: true`.
- `@Type(() => Number)` / `@Type(() => Boolean)` para conversion automatica desde query params.
- Campos de solo lectura (calculados, ids, timestamps) nunca estan en DTOs de entrada.

---

## Manejo de errores

| Excepcion | HTTP |
|-----------|------|
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `ConflictException` | 409 |
| `InternalServerErrorException` | 500 |

Formato de respuesta de error:
```json
{ "statusCode": 400, "message": "...", "timestamp": "ISO", "path": "/api/v1/..." }
```

---

## Supabase — Integracion

El backend usa **dos clientes** Supabase definidos en `common/supabase/supabase.provider.ts`:
- `SUPABASE_SERVICE_KEY`: service role, sin RLS. Usado para la mayoria de operaciones del backend.
- `SUPABASE_ANON_KEY`: anon key, respeta RLS. Usado para casos especificos.

Las consultas usan la API de PostgREST (`supabase.from(...).select(...)`). No se usa ORM.

---

## Estructura real de carpetas

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── auth/
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   └── supabase/
│       └── supabase.provider.ts
└── modules/
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   └── dto/  register.dto.ts  login.dto.ts
    ├── users/
    │   ├── users.module.ts
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   └── dto/  update-user.dto.ts
    ├── expenses/
    │   ├── expenses.module.ts
    │   ├── expenses.controller.ts
    │   ├── expenses.service.ts
    │   └── dto/  create-expense.dto.ts  update-expense.dto.ts  query-expense.dto.ts
    ├── categories/
    │   ├── categories.module.ts
    │   ├── categories.controller.ts
    │   └── categories.service.ts
    ├── tickets/
    │   ├── tickets.module.ts
    │   ├── tickets.controller.ts
    │   ├── tickets.service.ts
    │   ├── ocr.service.ts
    │   └── dto/  upload-ticket.dto.ts
    ├── analytics/
    │   ├── analytics.module.ts
    │   ├── analytics.controller.ts
    │   ├── constants/  analytics.constants.ts
    │   ├── dto/  consumption-analysis.dto.ts  consumption-highlights.dto.ts  unusual-expense.dto.ts  ...
    │   ├── services/
    │   │   ├── consumption-analytics.service.ts
    │   │   └── anomaly-detection.service.ts
    │   └── types/  anomaly.types.ts  ...
    └── advisor/
        ├── advisor.module.ts
        ├── advisor.controller.ts
        ├── advisor.service.ts
        └── dto/  assign-client-profile.dto.ts  create-recommendation.dto.ts  ...
```
