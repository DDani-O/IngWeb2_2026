# FinTrack Backend — Contexto para Generación de Código

**Stack:** NestJS + TypeScript + Supabase (PostgreSQL) + JWT + Gemini AI  
**Base URL:** `https://fintrack-api.onrender.com/api/v1`  
**Proyecto:** Ingeniería Web II — 2026

---

## Arquitectura

Cada dominio tiene: `*.module.ts` → `*.controller.ts` → `*.service.ts` → `dto/*.dto.ts`

- **Controlador:** solo recibe el request HTTP y delega al servicio. Sin lógica de negocio, sin tocar la BD.
- **Servicio:** toda la lógica de negocio. Habla con Supabase.
- **DTO:** define y valida la forma exacta del JSON entrante con `class-validator`.
- **Guard:** `JwtAuthGuard` verifica el JWT antes de llegar al controlador. `RolesGuard` verifica el rol.

**Pipeline de un request (en orden):**
1. `JwtAuthGuard` → verifica JWT, adjunta `user` al request → falla: `401`
2. `ValidationPipe` → valida el DTO → falla: `400`
3. `Controller` → delega al servicio
4. `Service` → lógica + Supabase
5. Respuesta JSON

---

## Configuración global (`main.ts`)

```typescript
app.setGlobalPrefix('api/v1');
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.enableCors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

---

## Estructura de carpetas

```
src/
├── main.ts
├── app.module.ts
└── modules/
    ├── auth/         { auth.module, auth.controller, auth.service, auth.guard, dto/{register,login}.dto }
    ├── users/        { users.module, users.controller, users.service, dto/update-user.dto }
    ├── expenses/     { expenses.module, expenses.controller, expenses.service, dto/{create,update}-expense.dto }
    ├── tickets/      { tickets.module, tickets.controller, tickets.service, dto/ticket-result.dto }
    ├── categories/   { categories.module, categories.controller, categories.service }
    └── advisor/      { advisor.module, advisor.controller, advisor.service, dto/recommendation.dto }
```

También: `src/common/supabase/supabase.provider.ts` y `src/common/filters/http-exception.filter.ts`

---

## Supabase Provider

```typescript
export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';
export const supabaseProvider = {
  provide: SUPABASE_CLIENT,
  useFactory: () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY),
};
// Inyectar en servicios:
constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}
```

---

## Variables de entorno (`.env`)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
JWT_SECRET=
JWT_EXPIRATION=7d
GEMINI_API_KEY=
PORT=3000
FRONTEND_URL=
```

---

## Seguridad — Reglas críticas

- El `user_id` **NUNCA** viene del body. Siempre del token JWT via `@CurrentUser()`.
- El JWT payload incluye `{ sub: userId, email, role }`.
- Endpoints de asesor usan `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('asesor')`.
- Errores de Supabase nunca se exponen al cliente: usar excepciones NestJS con mensajes amigables.

---

## Endpoints — Contrato completo

### AUTH (público)

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/auth/register` | `{ email, password, fullName, role: 'cliente'\|'asesor' }` | `201 { access_token, user }` |
| `POST` | `/auth/login` | `{ email, password }` | `200 { access_token, user }` |

- `register` → errores: `400` (datos inválidos), `409` (email duplicado)
- `login` → error: `401` (no especificar si es email o password incorrecto)

### USERS (🔒 JWT)

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `GET` | `/users/me` | — | `200 { id, email, fullName, role, avatarUrl, createdAt }` |
| `PATCH` | `/users/me` | `{ fullName?, avatarUrl? }` | `200` perfil completo |
| `GET` | `/users/me/recommendations` | — | `200 [{ id, advisorName, content, type, isRead, createdAt }]` |

### CATEGORIES (público)

| Método | Ruta | Respuesta |
|--------|------|-----------|
| `GET` | `/categories` | `200 [{ id, name, icon, color }]` |

### EXPENSES (🔒 JWT — solo `cliente`)

| Método | Ruta | Body / Query | Respuesta |
|--------|------|------|-----------|
| `GET` | `/expenses` | `?page&limit&categoryId&from&to&search` | `200 { data[], pagination }` |
| `POST` | `/expenses` | `{ amount, merchant, categoryId, date, notes? }` | `201` gasto completo |
| `GET` | `/expenses/summary` | `?month=YYYY-MM` | `200 { totalMonth, totalByCategory[], expenseCount, averageExpense, highestExpense }` |
| `GET` | `/expenses/:id` | — | `200` gasto completo \| `404` |
| `PATCH` | `/expenses/:id` | campos opcionales | `200` gasto actualizado \| `404` |
| `DELETE` | `/expenses/:id` | — | `204 No Content` \| `404` |

**Objeto gasto completo:**
```json
{ "id", "amount", "merchant", "categoryId", "categoryName", "date", "notes", "ticketImageUrl", "userId", "createdAt" }
```

**Paginación:**
```json
{ "data": [...], "pagination": { "total", "page", "limit", "totalPages" } }
```

### TICKETS (🔒 JWT — solo `cliente`)

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/tickets/upload` | `multipart/form-data` — campo `file` (JPEG/PNG/WEBP ≤5MB) + `categoryId?` | `202 { ticketId, status, extractedData, createdExpense }` |

- `400` si tipo no soportado o mayor a 5MB
- `422` si la IA no puede extraer datos del ticket

### ADVISOR (🔒 JWT — solo `asesor`)

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `GET` | `/advisor/clients` | — | `200 [{ id, fullName, email, totalExpensesMonth, lastExpenseDate }]` |
| `GET` | `/advisor/clients/:clientId/expenses` | mismos query params que `GET /expenses` | `200` mismo formato |
| `POST` | `/advisor/recommendations` | `{ clientId, content, type: 'alerta'\|'consejo'\|'felicitacion' }` | `201 { id, clientId, advisorId, content, type, isRead: false, createdAt }` |

---

## DTOs — Validaciones

### `register.dto.ts`
```typescript
email: @IsEmail()
password: @IsString() @MinLength(8)
fullName: @IsString() @MinLength(2)
role: @IsEnum(['cliente', 'asesor'])
```

### `create-expense.dto.ts`
```typescript
amount: @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01)
merchant: @IsString() @MaxLength(100)
categoryId: @IsUUID('4')
date: @IsDateString()
notes: @IsOptional() @IsString() @MaxLength(500)
```

### `recommendation.dto.ts`
```typescript
clientId: @IsUUID('4')
content: @IsString() @MinLength(10) @MaxLength(1000)
type: @IsEnum(['alerta', 'consejo', 'felicitacion'])
```

---

## Integración IA — OCR de Tickets

**Flujo:** `frontend` → `tickets.controller` (Multer valida archivo) → `tickets.service`:
1. Subir imagen a Supabase Storage (`ticket-images/{userId}/{timestamp}.jpg`)
2. Llamar a Gemini con la URL de la imagen
3. Parsear JSON devuelto por la IA
4. Crear gasto en tabla `expenses` con los datos extraídos
5. Retornar `202` con `extractedData` + `createdExpense`

**Prompt a Gemini:**
```
Eres un asistente especializado en lectura de tickets argentinos. Extrae SOLO:
- monto total (número decimal)
- nombre del comercio
- fecha (YYYY-MM-DD)
Responde ÚNICAMENTE con JSON válido sin markdown:
{ "amount": 1234.56, "merchant": "Nombre", "date": "YYYY-MM-DD", "rawText": "..." }
Si no podés extraer un dato: null. Si no es un ticket: { "error": "..." }
```

**Implementación:**
```typescript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const result = await model.generateContent([prompt, { inlineData: { mimeType: 'image/jpeg', data: base64 } }]);
const clean = result.response.text().replace(/```json|```/g, '').trim();
const parsed = JSON.parse(clean);
if (parsed.error) throw new UnprocessableEntityException(parsed.error);
```

---

## Manejo de errores — Excepciones NestJS

| Excepción | HTTP | Cuándo |
|-----------|------|--------|
| `BadRequestException` | 400 | Datos inválidos |
| `UnauthorizedException` | 401 | Token ausente o inválido |
| `ForbiddenException` | 403 | Rol incorrecto |
| `NotFoundException` | 404 | Recurso no existe o no pertenece al usuario |
| `ConflictException` | 409 | Email duplicado |
| `UnprocessableEntityException` | 422 | IA no reconoce el ticket |
| `InternalServerErrorException` | 500 | Error inesperado |

**Formato estándar de error:**
```json
{ "statusCode": 400, "message": "El email ya está registrado", "timestamp": "...", "path": "/api/v1/..." }
```

---

## Dependencias

```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport-jwt
npm install @supabase/supabase-js
npm install class-validator class-transformer
npm install @google/generative-ai
npm install multer && npm install @types/multer -D
npm install bcrypt && npm install @types/bcrypt -D
```

---

## Anti-patrones — Nunca hacer esto

```typescript
// ❌ Lógica en controlador / ✅ Delegar al servicio
// ❌ user_id del body / ✅ user.id del token (@CurrentUser())
// ❌ Claves hardcodeadas / ✅ configService.get('JWT_SECRET')
// ❌ throw new Error(supabaseError.message) / ✅ throw new NotFoundException('mensaje amigable')
```
