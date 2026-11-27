# FinTrack 2026

Plataforma web de gestión de gastos personales con carga de tickets por OCR/IA, para la materia **Ingeniería Web II (2026)**. Grupo: Daniel Olguín y Celeste Núñez.

> **Estado:** sistema completo. El **frontend** (SPA vanilla) consume la **API NestJS**, que implementa el contrato completo (auth, perfil, gastos, tickets con OCR/IA, recomendaciones, análisis de consumo y cartera del asesor) sobre **Supabase**, probado de punta a punta contra la base real (`especificaciones/PlanIntegracionBackend.md`, fases I0–I6). Online: ver [URLs públicas](#urls-públicas). En `localhost` el front también puede usar un **backend simulado** (`frontend/mocks/`) para demos sin conexión.

---

## 1. Descripción del sistema

FinTrack permite a una persona registrar sus gastos, a mano o subiendo la foto de un ticket que una IA interpreta, y entender en qué gasta. Un asesor financiero analiza los patrones de consumo de sus clientes y les envía recomendaciones.

### Roles y funcionalidades

**Cliente**
- Registro e inicio de sesión; edición del perfil de cuenta (ocupación, ingreso estimado, objetivo financiero, tema claro/oscuro).
- **Carga de gastos**: formulario manual (comercio, fecha, monto, categoría, descripción) o **imagen del ticket**, que se analiza con OCR/IA y precompleta el formulario para revisarlo antes de guardar.
- **Historial**: búsqueda, filtros por categoría y origen, orden, detalle, **edición y recategorización** y borrado.
- **Dashboard**: gasto del mes con variación, promedio mensual, categoría principal, gastos inusuales, alertas, gráficos (por día, **torta por categoría**, **barras por mes** con promedio) y **ranking de comercios**.
- **Patrones de consumo**: promedio mensual, categorías con más gasto, evolución en el tiempo (total y por categoría), día de mayor gasto y **gastos inusuales**.
- **Perfil de gasto**: el sistema lo **asigna automáticamente** según los hábitos (Drácula Nocturno, Equilibrista Cósmico, Espíritu Libre); el cliente lo ve, no lo elige.
- **Recomendaciones** del sistema o del asesor (sugerencias, alertas y observaciones con prioridad): filtros y "marcar como leída".

**Asesor**
- Dashboard de la cartera: clientes activos, clientes con gastos inusuales, recomendaciones leídas, alertas y gráficos (clientes por perfil, gasto por perfil, actividad mensual).
- **Mis clientes**: búsqueda y filtros por riesgo y estado, vista en tarjetas o tabla.
- **Análisis por cliente**: perfil asignado, nivel de riesgo, indicadores, gráficos, gastos inusuales, ranking de comercios, últimos gastos y recomendaciones enviadas.
- **Generar recomendaciones** (título, tipo, prioridad y mensaje) para un cliente.
- Perfil profesional (especialidad, matrícula, descripción).

**Extras opcionales de la consigna cubiertos:** categoría sugerida por la IA al leer el ticket (1), dashboard financiero con varios gráficos (2), alertas de gasto inusual y de aumento mensual (3, sin límites de presupuesto), comparación con el mes anterior (6), análisis de patrones (7), ranking de comercios (8), búsqueda y filtros de gastos (9, sin rango de fechas ni montos en la UI), modo oscuro (11), edición de los datos detectados en el ticket (13) y perfil financiero del usuario (16).

---

## 2. Arquitectura

Arquitectura cliente-servidor por HTTP/REST:

```
Frontend (HTML + CSS + JS vanilla, SPA)
   páginas → servicios → APIClient ──HTTP/REST (JSON, JWT)──▶ Backend NestJS ──▶ Supabase (PostgreSQL + RLS)
                             │                                      │
                             └─ driver "mock": mocks/mockServer.js  └─ OCR/IA: Groq (modelo con visión)
```

### Frontend (`frontend/`)

SPA con ES modules nativos, sin bundler ni frameworks de componentes. Bootstrap 5 y Chart.js por CDN.

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| Arranque y rutas | `app.js`, `routes.js` | Tabla de rutas declarativa por rol, guard global, layouts, manejo de sesión expirada. |
| Núcleo | `core/` | `Router` (hash, `:params`, layouts persistentes, 404), `Component` (ciclo de vida, props, eventos, composición), `PageController`, `AuthManager`, `APIClient`, `EventBus`, `ThemeManager`, `TabRegistry`. |
| Componentes | `components/` | Biblioteca con Atomic Design: átomos y moléculas (funciones que devuelven HTML escapado) y organismos (`DataTable`, `FilterBar`, `ChartCard`, `Modal`, `ExpenseForm`, `TicketUploader`…). Catálogo y API: [spec §7](especificaciones/EspecificacionDesarrolloFront.md). |
| Páginas | `pages/{public,cliente,asesor}/` | Componen componentes y piden datos a los servicios. |
| Servicios | `services/` | Un servicio por dominio y `adapters.js`, la única capa que traduce el contrato en español de la API al modelo de la UI. |
| Backend simulado | `mocks/` | Implementa el contrato completo (tokens, roles, validaciones, errores) y calcula el análisis de consumo. Persiste en `localStorage`. |
| Estilos | `assets/css/`, `components/**/*.css` | Tokens (escalas de espaciado y tipografía, colores por tema), componentes mobile-first. Reglas: [ReglasCSS.md](frontend/ReglasCSS.md). |

Decisiones clave: todo el texto que viene de la API se escapa por defecto (`utils/html.js`); el guard de rutas es de experiencia de usuario y la seguridad la impone el backend con el token; el mock y la API real son dos drivers de `APIClient` que se eligen por entorno (`API_CONFIG.DRIVERS`), sin tocar páginas ni servicios.

### Backend (`backend/`)

NestJS con un módulo por dominio en `src/modules/` (`auth`, `users`, `categories`, `expenses`, `tickets`, `recommendations`, `analysis`, `clients`), DTOs con `class-validator` (`ValidationPipe` global con `whitelist`), prefijo global `/api/v1`, JWT propio con `JwtAuthGuard` + `RolesGuard` (`@Roles('cliente' | 'asesor')`), filtro global de errores y configuración por variables de entorno. Habla con Supabase por `@supabase/supabase-js` (sin ORM): Supabase Auth para las cuentas, PostgREST para los datos y Storage para las imágenes de los tickets. Las reglas del análisis de consumo son funciones puras (`analysis.rules.ts`) con tests unitarios; los tests e2e están en `backend/test/e2e/`. Ver `backend/CLAUDE.md`.

---

## 3. Modelo de datos

Base PostgreSQL en Supabase, definida por las migraciones `backend/database/migrations/0001` a `0017` (tablas, ENUMs, funciones validadoras, triggers, políticas RLS e índices; la `0016` deja el catálogo de 3 perfiles de gasto y la `0017` cierra el acceso anónimo a las funciones y fija su `search_path`). Cómo cargarla: `backend/database/README.md`.

| Tabla | Contenido |
|---|---|
| `usuarios` | Cuenta (rol `cliente` o `asesor`, nombre completo, estado). Referencia a `auth.users` de Supabase. |
| `perfiles_usuarios` | Datos del cliente: ocupación, ingreso estimado, objetivo financiero. |
| `perfiles_asesores` | Datos del asesor: matrícula, especialidad, descripción. |
| `asignaciones_de_clientes` | Qué asesor atiende a qué cliente. |
| `categorias_de_gasto` | Catálogo de categorías. |
| `gastos` | Comercio, fecha, monto, categoría, descripción, origen (`manual` · `ticket`), ticket asociado y estado del OCR. |
| `tickets` | Imagen subida (URL, tipo, tamaño, estado de procesamiento). |
| `analisis_ocr` | Resultado del OCR/IA por ticket: texto, comercio, fecha y monto detectados, categoría sugerida, confianza. |
| `recomendaciones_financieras` | Título, mensaje, tipo, prioridad, origen (`sistema` · `asesor`), leída. |
| `perfiles_de_gasto` | Catálogo de perfiles con su regla de asignación (`criterio_regla`). |
| `clasificacion_de_perfil` | Perfil asignado a cada cliente y su vigencia. |

El análisis de consumo se calcula en el momento a partir de `gastos` (la tabla `analisis_de_consumo` se eliminó en la migración 0014; la mensajería asesor-cliente, en la 0013). Datos de la demo: `backend/database/seeds/seed_demo_jun_nov_2026.sql` (idempotente; gastos de junio a hoy para dos clientes, con gastos inusuales).

---

## 4. Endpoints del backend

Contrato completo (cuerpos, errores y reglas de cálculo) en la [spec §10](especificaciones/EspecificacionDesarrolloFront.md). Rutas en inglés, cuerpos en español, todas bajo el prefijo `/api/v1`. La API NestJS y el backend simulado implementan este mismo contrato. Todas requieren `Authorization: Bearer <token>` salvo login, registro y `/health`.

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/health` | público | `{ estado: "ok" }`: health check del hosting y "despertar" del servidor. |
| POST | `/auth/register` | público | Registro (cliente o asesor); devuelve `{ token, usuario }`. |
| POST | `/auth/login` | público | Inicio de sesión; devuelve `{ token, usuario }`. |
| GET · PUT | `/auth/me` · `/auth/profile` | ambos | Usuario autenticado · edición del perfil. |
| GET | `/categories` · `/spending-profiles` | ambos | Catálogos. |
| GET · POST | `/expenses` | cliente | Listar (filtros y orden) · crear gasto. |
| GET · PUT · DELETE | `/expenses/:id` | cliente | Ver · editar/recategorizar · borrar. |
| POST | `/tickets/upload` | cliente | Sube la imagen (multipart `archivo`) y devuelve los datos detectados por OCR/IA. |
| GET · PUT | `/recommendations` · `/recommendations/:id/read` | cliente | Recomendaciones recibidas · marcar leída. |
| GET · POST | `/recommendations/sent` · `/recommendations` | asesor | Enviadas (filtro por cliente) · crear. |
| GET | `/analysis/me` | cliente | Análisis de consumo propio. |
| GET | `/analysis/clients/:id` · `/analysis/advisor/summary` | asesor | Análisis de un cliente · resumen de la cartera. |
| GET | `/clients` · `/clients/:id` · `/clients/:id/expenses` | asesor | Clientes asignados · detalle · gastos del cliente. |

Errores: `{ error, mensaje, codigo, detalles }` con 401, 403, 404, 409, 422 o 500.

---

## 5. Uso de la inteligencia artificial

La IA reduce la carga manual al interpretar la foto de un ticket (consigna §4.3):

1. El cliente elige o arrastra la imagen en **Cargar gasto** (`TicketUploader`: valida que sea una imagen de hasta 5 MB).
2. El front la envía a `POST /tickets/upload` (multipart).
3. El backend guarda la imagen (`tickets`), la manda al **servicio de OCR/IA** y persiste el resultado (`analisis_ocr`): comercio, fecha, monto, **categoría sugerida** y confianza.
4. El front precompleta el formulario y muestra los datos detectados; el cliente los revisa y corrige antes de guardar (el gasto queda con origen `ticket`).

Además, el sistema calcula de forma automática el análisis de consumo: gastos inusuales (más de 35% sobre el promedio de su categoría), nivel de riesgo y asignación del perfil de gasto según la participación del gasto discrecional (reglas en la spec §10.6).

El backend NestJS sube la imagen a Supabase Storage y se la pasa a un modelo de IA con visión en **Groq** (por defecto `qwen/qwen3.8-27b`, configurable con `GROQ_MODEL`; vía la API compatible con OpenAI), con un prompt que pide el JSON del ticket argentino: comercio, fecha, **total final** (no el subtotal) y categoría sugerida (`backend/src/modules/tickets/ocr.service.ts`). La respuesta se normaliza antes de guardarla: el monto acepta formatos `1.500,50` y `1,500.50` (`parseMonto`, con tests). Si la IA no puede leer el ticket, la API responde `analisis: null` y el front deja el formulario para completar a mano. Con el driver mock, el paso 3 lo simula `frontend/mocks/mockServer.js` a partir del nombre del archivo.

---

## 6. Tecnologías

| Parte | Tecnologías |
|---|---|
| Frontend | HTML5, CSS3 (custom properties, grid, `clamp`, `color-mix`), JavaScript ES2022 con ES modules nativos, Fetch API, Bootstrap 5.3 (CDN), Chart.js 4 (CDN), Font Awesome 6. |
| Backend | Node.js, NestJS 11, TypeScript, `class-validator`, Passport + JWT, `@nestjs/config`, `@supabase/supabase-js`, Jest (unitarios) + Supertest (e2e). |
| Base de datos | Supabase (PostgreSQL, Auth, Storage, Row Level Security, funciones y triggers). |
| OCR/IA | Groq, modelo con visión Qwen 3.8 27B (configurable con `GROQ_MODEL`; SDK `openai`). |
| Deploy | Front: **Netlify** (`netlify.toml`) · Back: **Render** (`render.yaml`, plan gratuito) · BD: **Supabase**. |

---

## 7. Cómo levantar el proyecto

### Frontend

No se puede abrir `index.html` con `file://`: hay que servirlo por HTTP.

```bash
cd frontend
python3 -m http.server 5500      # o: npx serve -l 5500 .
```

Abrir http://localhost:5500.

**Credenciales de prueba** (backend simulado), clave `Fintrack2026*` para todas:

| Rol | Email |
|---|---|
| Cliente | `cliente@fintrack.local` |
| Asesor | `asesor@fintrack.local` |

También se puede registrar una cuenta nueva desde la landing (los clientes nuevos quedan asignados al asesor de prueba).

**Backend simulado.** Mientras la API no esté lista, `APIClient` usa `frontend/mocks/mockServer.js`. Los datos (8 clientes con 7 meses de gastos generados a partir de la fecha actual, recomendaciones, asignaciones) se guardan en `localStorage` con la clave `fintrack.mockDb`; para volver a los datos iniciales, borrar esa clave desde las herramientas del navegador. Aplica las mismas validaciones que la API; para probar un ticket que la IA no puede leer, subir una imagen con "ilegible" en el nombre.

**Mock o API real.** El front elige solo según dónde corre (`API_CONFIG` en `frontend/utils/constants.js`):

| Dónde | Driver | API |
|---|---|---|
| Deploy (cualquier host que no sea `localhost`) | Siempre `http` (no se puede cambiar desde el navegador) | `API_CONFIG.BASE_URLS.production` |
| `localhost` / `127.0.0.1` | `mock` por defecto (demo sin conexión) | `API_CONFIG.BASE_URLS.local` = `http://localhost:3000/api/v1` |

Para usar la API local con el backend levantado: en la consola del navegador, `localStorage.setItem("fintrack.apiDriver", "http")` y recargar; para volver al mock, `"mock"`. Con el driver `http` se entra con las cuentas reales de Supabase, no con las del mock.

### Backend

```bash
cd backend
cp .env.example .env      # completar con las claves de Supabase y Groq
npm install
npm run start:dev         # http://localhost:3000/api/v1
npm test                  # tests unitarios (reglas del análisis), sin BD
npm run test:e2e          # requiere un proyecto de Supabase de prueba en el .env
```

La base se crea ejecutando en orden las migraciones de `backend/database/migrations/` en el SQL Editor de Supabase. Variables de entorno: ver `backend/.env.example`.

### Deploy

La configuración está versionada; el deploy sale de la rama `main`.

1. **Backend en Render:** New → **Blueprint** → elegir este repo (lee `render.yaml`: servicio web Node, `rootDir: backend`, build `npm ci && npm run build`, start `npm run start`, health check `/api/v1/health`, región Virginia, cerca de Supabase `us-east-1`). Cargar las variables marcadas como secretas: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `GROQ_API_KEY` y `FRONTEND_URL` (la URL de Netlify, sin barra final). `PORT` lo pone Render.
2. **Frontend en Netlify:** Add new site → Import from Git → este repo (lee `netlify.toml`: publica `frontend/` sin build).
3. `API_CONFIG.BASE_URLS.production` en `frontend/utils/constants.js` apunta a la URL de Render y `FRONTEND_URL` en Render a la de Netlify (ver [URLs públicas](#urls-públicas)). Cada push a `main` redeploya los dos.

**Plan gratuito de Render:** el backend se duerme tras 15 minutos sin pedidos y tarda cerca de un minuto en despertar. El front lo despierta apenas se abre la app (`GET /health`), hace esperar a los demás pedidos y muestra "Despertando el servidor…" mientras tanto. Para una demo, abrir la app un par de minutos antes.

### URLs públicas

- Frontend: https://fintrack-iua.netlify.app
- Backend: https://fintrack-api-5vmm.onrender.com/api/v1 (health check: [`/health`](https://fintrack-api-5vmm.onrender.com/api/v1/health))

Las cuentas de demostración de la versión online se entregan por separado (no se publican en el repo).

---

## 8. Prueba manual

El backend tiene tests automáticos (`npm test` y `npm run test:e2e`); el front se prueba a mano. Con el front servido (y, para el driver `http`, el backend levantado o la versión online), recorrer:

1. La landing carga; el login y el registro abren y cierran sin errores en consola.
2. Login de cliente → `#/cliente/dashboard`; login de asesor → `#/asesor/dashboard`.
3. Sin sesión, `#/cliente/patrones` lleva al login y, al entrar, vuelve a patrones.
4. **Cargar gasto**: manual y con una imagen (analizar, revisar, guardar); aparece en el historial y en el dashboard.
5. **Historial**: filtrar, ver detalle, **editar** (cambiar categoría) y eliminar con confirmación.
6. **Recomendaciones**: filtrar y marcar como leída (persiste al recargar).
7. **Perfil de cuenta**: editar datos y tema; el nombre se actualiza en la barra superior.
8. **Asesor**: filtrar clientes, abrir **Ver análisis**, enviar una recomendación y comprobar que el cliente la recibe.
9. Una ruta inexistente (`#/no-existe`) muestra "Ruta no encontrada" y "Volver" regresa.
10. Probar en 360 px de ancho y en tema claro: sin scroll horizontal y con texto legible.

---

## 9. Documentación del proyecto

| Documento | Contenido |
|---|---|
| `Consigna_Plataforma Gestion de Gastos Personales.pdf` | Consigna oficial. |
| `especificaciones/EspecificacionDesarrolloFront.md` | Especificación del frontend: arquitectura, componentes (§7), estilos (§8), **contrato de la API (§10)** y páginas (§11). |
| `especificaciones/paginasFront/` | Specs por página y capturas de referencia. |
| `especificaciones/DiagnosticoRefactor.md` | Diagnóstico del frontend, decisiones del equipo y plan de refactor ejecutado (fases 0 a 5). |
| `frontend/PrincipiosDesarrollo.md` · `frontend/ReglasCSS.md` | Principios de desarrollo y reglas de CSS. |
| `especificaciones/PlanIntegracionBackend.md` | Plan de integración del backend con el frontend (fases I0 a I6). |
| `backend/database/README.md` | Cómo cargar la base (migraciones en orden y seed de la demo). |
| `backend/CLAUDE.md` · `frontend/CLAUDE.md` | Estructura, convenciones y comandos de cada parte. |
