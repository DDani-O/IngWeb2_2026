# FinTrack 2026

Plataforma web de educacion y acompanamiento financiero personal. Conecta clientes con asesores financieros, centraliza el registro de gastos, analiza patrones de consumo con IA y genera recomendaciones personalizadas.

**Estado actual:** sistema full-stack funcional con backend NestJS + Supabase y frontend SPA vanilla JS. Autenticacion real con JWT. Analytics dinamico. OCR de tickets via Gemini AI.

---

## Arquitectura general

```
frontend/          SPA vanilla JS — puerto 5500
backend/           NestJS + TypeScript — puerto 3000
Supabase           PostgreSQL + Auth + Storage (cloud)
Gemini AI          OCR e interpretacion de tickets de gasto
```

El frontend se comunica con el backend via REST API (`/api/v1`). El backend usa el service role de Supabase para acceder a la BD con privilegios completos, verificando identidad y permisos en la capa de aplicacion.

### Roles del sistema

- **cliente**: registra gastos, sube tickets, ve analytics, recibe recomendaciones.
- **asesor**: gestiona cartera de clientes, asigna perfiles de gasto, envia recomendaciones, ve dashboard consolidado.

---

## Frontend

SPA (Single Page Application) con JavaScript ES modules nativo, enrutamiento por hash (`#/ruta`), sin frameworks.

### Tecnologias

- JavaScript ES Modules (sin bundler)
- Bootstrap 5 (grid/utilidades)
- Chart.js (graficos: doughnut, line, bar apilado)
- Font Awesome 6 (iconos)
- CSS custom properties con sistema de temas claro/oscuro

### Estructura

```
frontend/
├── index.html                  Entrada, landing publica, modales auth
├── core/
│   ├── Router.js               Enrutamiento por hash con guards de rol
│   ├── PageController.js       Clase base de todas las paginas
│   ├── APIClient.js            Cliente HTTP centralizado (JWT en header)
│   └── AppShell.js             Bootstrap de la app, inyeccion de shells
├── pages/
│   ├── usuario/
│   │   ├── dashboard.html / DashboardPage.js
│   │   ├── cargar-gasto.html / CargarGastoPage.js   (manual + OCR)
│   │   ├── historial.html / HistorialPage.js
│   │   ├── patrones.html / PatronesPage.js           (analytics)
│   │   ├── perfil.html / PerfilPage.js               (cuenta cliente)
│   │   ├── perfiles.html / PerfilesPage.js           (informativo, solo lectura)
│   │   └── recomendaciones.html / RecomendacionesPage.js
│   └── asesor/
│       ├── dashboard.html / AsesorDashboardPage.js
│       ├── clientes.html / AsesorClientesPage.js
│       ├── inbox.html / AsesorInboxPage.js
│       ├── perfil.html / AsesorPerfilPage.js
│       └── reportes.html / AsesorReportesPage.js
├── components/
│   ├── user/UserShell/         Sidebar + topbar del cliente
│   └── advisor/AdvisorShell/   Sidebar + topbar del asesor
└── assets/css/                 Estilos por componente + temas
```

### Paginas del cliente

| Ruta | Descripcion |
|------|-------------|
| `/usuario/dashboard` | KPIs del mes, ultimos gastos, perfil activo, recomendaciones pendientes |
| `/usuario/cargar-gasto` | Carga manual de gasto o upload de ticket con OCR (Gemini) |
| `/usuario/historial` | Listado paginado de gastos con filtros |
| `/usuario/patrones` | Analytics completo: distribucion por categoria, evolucion mensual, evolucion categoria x mes (stacked bar), gastos inusuales |
| `/usuario/perfil` | Cuenta: datos personales, preferencias, configuracion (pais, ocupacion, ingresos, tema) |
| `/usuario/perfiles` | Explorador informativo de perfiles de gasto — SOLO lectura, sin seleccion |
| `/usuario/recomendaciones` | Listado de recomendaciones con acciones (marcar completada/descartar) |

### Paginas del asesor

| Ruta | Descripcion |
|------|-------------|
| `/asesor/dashboard` | Estadisticas agregadas de cartera, alertas, calendario, graficos |
| `/asesor/clientes` | Gestion de clientes asignados: ver perfil, historial de gastos, recomendaciones |
| `/asesor/inbox` | Mensajes recibidos de clientes |
| `/asesor/perfil` | Perfil del asesor: matricula, especialidad, capacidad, pais |
| `/asesor/reportes` | Reportes y estadisticas de la cartera |

### Levantar el frontend

```bash
cd frontend
python3 -m http.server 5500
# o
npx serve -l 5500 .
```

Abrir: `http://localhost:5500`

> No abrir con `file://` — los modulos ES requieren servidor HTTP.

---

## Backend

NestJS + TypeScript. Arquitectura modular por dominio. Cada modulo: `*.module.ts` → `*.controller.ts` → `*.service.ts` → `dto/*.dto.ts`.

### Tecnologias

- NestJS + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Passport + JWT (`@nestjs/jwt`, `passport-jwt`)
- class-validator + class-transformer (validacion de DTOs)
- Google Gemini AI (OCR de tickets)

### Modulos

| Modulo | Descripcion |
|--------|-------------|
| `auth` | Registro y login. Crea usuario en `auth.users` y en `usuarios`. |
| `users` | Perfil de cuenta, recomendaciones, dashboard cliente, perfiles de gasto. |
| `expenses` | CRUD de gastos. Filtros por fecha, categoria, comercio. |
| `categories` | Listado de categorias (publico). |
| `tickets` | Upload de tickets al storage, OCR via Gemini, creacion de gasto desde ticket. |
| `analytics` | Consumption analytics dinamico: highlights, distribucion categorias, evolucion mensual, evolucion categoria x mes, gastos inusuales (Z-score + percentil). |
| `advisor` | Dashboard del asesor, gestion de clientes, asignacion de perfiles, recomendaciones, mensajeria, reportes. |

### Levantar el backend

```bash
cd backend
cp .env.example .env   # completar variables
npm install
npm run start:dev      # puerto 3000
```

### Variables de entorno

```
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_KEY=<service_role_key>
JWT_SECRET=<secreto>
GEMINI_API_KEY=<api_key_google>
PORT=3000
CORS_ORIGIN=http://localhost:5500
```

### Endpoints principales

**Auth (publico)**
```
POST /auth/register
POST /auth/login
```

**Users (JWT)**
```
GET  /users/me
PATCH /users/me
GET  /users/me/recommendations
GET  /users/me/dashboard
GET  /users/me/consumption-analysis?monthsBack=12
GET  /users/spending-profiles
```

**Expenses (JWT, rol cliente)**
```
GET    /expenses
POST   /expenses
GET    /expenses/:id
PATCH  /expenses/:id
DELETE /expenses/:id
GET    /expenses/summary
```

**Tickets (JWT, rol cliente)**
```
POST /tickets/upload     multipart/form-data, procesa OCR Gemini
GET  /tickets
GET  /tickets/:id/status
```

**Categories (publico)**
```
GET /categories
```

**Advisor (JWT, rol asesor)**
```
GET  /advisor/dashboard
GET  /advisor/clients
GET  /advisor/clients/:id
GET  /advisor/clients/:id/expenses
GET  /advisor/clients/:id/recommendations
POST /advisor/clients/:id/recommendations
GET  /advisor/clients/:id/spending-profile
POST /advisor/clients/:id/spending-profile     asigna perfil al cliente
GET  /advisor/messages
POST /advisor/messages
GET  /advisor/profile
PATCH /advisor/profile
GET  /advisor/reports
```

---

## Base de datos

Supabase / PostgreSQL. Ver detalle completo en `backend/database/DB_SCHEMA_SUMMARY.md`.

### Tablas

| Tabla | Descripcion |
|-------|-------------|
| `usuarios` | Usuarios del sistema (clientes y asesores) |
| `perfiles_usuarios` | Preferencias del cliente (pais, ingresos, tema, etc.) |
| `perfiles_asesores` | Datos profesionales del asesor |
| `asignaciones_de_clientes` | Relacion asesor ↔ cliente |
| `gastos` | Registro de gastos del cliente |
| `categorias_de_gasto` | Catalogo global de categorias |
| `tickets` | Imagenes de tickets subidas al storage |
| `analisis_ocr` | Resultado del procesamiento OCR por ticket |
| `recomendaciones_financieras` | Recomendaciones enviadas por asesores o sistema |
| `mensajes_asesor` | Mensajeria asesor ↔ cliente |
| `perfiles_de_gasto` | Catalogo de perfiles financieros (ahorrador, equilibrista, etc.) |
| `clasificacion_de_perfil` | Perfil asignado a un cliente por un asesor |
| `analisis_de_consumo` | Snapshot historico de analytics (opcional, datos calculados dinamicamente) |

### Views SQL

| View | Descripcion |
|------|-------------|
| `advisor_dashboard_view` | Estadisticas agregadas por asesor |
| `category_distribution_view` | Distribucion de gastos por categoria por cliente |
| `client_anomaly_view` | Gastos con Z-score y percentil para deteccion de anomalias |
| `consumption_stats_view` | Estadisticas generales de consumo por cliente |
| `monthly_evolution_view` | Evolucion mensual de gastos con variacion porcentual |

### Migraciones

```
backend/database/migrations/
├── 0001_init_schema.sql       Schema completo inicial
├── 0002_*.sql                 ...parches incrementales...
├── 0010_ciudad_to_pais.sql    Renombrar ciudad → pais en perfiles_usuarios
```

Ejecutar en orden en el editor SQL de Supabase.

---

## Analytics — Deteccion de gastos inusuales

El modulo `analytics` calcula todo dinamicamente desde la tabla `gastos`. No escribe en `analisis_de_consumo`.

Algoritmo (Z-score + percentil):
1. Agrupar gastos por categoria.
2. Calcular media y desvio estandar por categoria.
3. Calcular Z-score de cada gasto: `(monto - media) / stdev`.
4. Calcular percentil del gasto dentro de su categoria.
5. Gasto anomalo si `|zScore| > 1.5` O `percentil > 95`.
6. `anomalyScore = (zsContribution + percentileContribution) / 2` (0-1).
7. Retornar top anomalias ordenadas por score desc.

---

## Perfiles de gasto

Los perfiles financieros (Ahorrador Disciplinado, Equilibrista Financiero, etc.) son un catalogo persistido en `perfiles_de_gasto`. El campo `criterio_regla` (JSONB) almacena metadata de display: emoji, tagline, caracteristicas, consejos, umbrales de clasificacion.

**Regla de negocio:** el cliente NUNCA puede asignarse un perfil. Solo el asesor puede asignar un perfil via `clasificacion_de_perfil`. La pantalla `/usuario/perfiles` es puramente informativa.

---

## OCR de tickets

Flujo:
1. Cliente sube imagen/PDF en `/usuario/cargar-gasto`.
2. `POST /tickets/upload` sube el archivo a Supabase Storage.
3. El backend llama a Gemini AI con el texto extraido del ticket.
4. Gemini retorna: comercio, monto, fecha, categoria sugerida.
5. Se crea un registro en `analisis_ocr` y se pre-rellena el formulario de gasto.
6. El cliente confirma y guarda el gasto (con `origen: "ticket"`).

---

## Estado del proyecto

### Implementado y funcional
- Autenticacion JWT real (registro, login, guards, roles)
- Dashboard cliente con datos reales de BD
- Dashboard asesor con estadisticas reales
- CRUD de gastos con filtros
- Upload y OCR de tickets (Gemini)
- Analytics de consumo completo (distribucion, evolucion, anomalias)
- Asignacion asesor ↔ cliente (automatica al registrarse)
- Perfiles de gasto (catalogo + asignacion por asesor)
- Recomendaciones financieras (lectura + cambio de estado por cliente)
- Mensajeria asesor → cliente (inbox)
- Historial de gastos
- Cuenta cliente (datos personales, preferencias, tema)

### Pendiente — ver `PENDIENTES_GENERALES.md`
- Envio de recomendaciones desde el panel del asesor (frontend)
- Mensajeria bidireccional cliente ↔ asesor (frontend + endpoint cliente)
- Revision completa del dashboard asesor (metricas, UX)
- Validacion de calculos del dashboard cliente
- Boton logout del dashboard cliente (comportamiento incorrecto)


