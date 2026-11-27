# FinTrack 2026 — Ingeniería Web II (IUA)

Trabajo final de la materia: plataforma web de gestión de gastos personales con carga de tickets por OCR/IA, rol **cliente** y rol **asesor financiero**. Terminología: "usuario" es cualquier cuenta (cliente o asesor); el rol que carga gastos se llama siempre **cliente** (valor de rol `cliente`, rutas `/cliente/*`, carpeta `pages/cliente/`). Grupo: Daniel y Cele.

- Consigna oficial: `Consigna_Plataforma Gestion de Gastos Personales.pdf` (fuente de verdad sobre requisitos y entregables).
- Idioma: todo (código comentado, docs, commits, respuestas) en **español rioplatense**. Identificadores de código en inglés salvo lo que ya existe en español (tablas de la BD).

## Arquitectura

```
frontend/  (HTML + CSS + JS vanilla, SPA con ruteo por hash)  ──HTTP/REST──▶  backend/ (NestJS, TypeScript)  ──▶  Supabase (PostgreSQL + RLS)
```

- `frontend/` — SPA modular; consume la API real (driver `http`) o, en localhost, un backend simulado (driver `mock`). Ver `frontend/CLAUDE.md`.
- `backend/` — API NestJS implementada (módulos en `src/modules/`) sobre Supabase, con el mismo contrato que el front (integración cerrada en `especificaciones/PlanIntegracionBackend.md`). Esquema de BD y migraciones en `backend/database/`. Ver `backend/CLAUDE.md`.
- `especificaciones/` — especificación de frontend (`EspecificacionDesarrolloFront.md`, incluye contrato de endpoints en la sección 10) y specs por página en `paginasFront/` con capturas de referencia en `ExamplePages/`.

## Requisitos obligatorios de la consigna (no negociables)

- Frontend: HTML, CSS y JS vanilla, sin frameworks de componentes (React, Vue, Angular, etc.). Están permitidos **Bootstrap 5** (grid, modales, offcanvas, utilidades) y **Chart.js**, ambos por CDN. Consumo de API con `fetch`.
- Backend: **NestJS**, API REST, autenticación, manejo de roles, CRUD de gastos, integración con un servicio de IA/OCR, persistencia.
- Endpoints mínimos: `POST /auth/login`, `POST /auth/register`, `GET/POST /expenses`, `PUT/DELETE /expenses/:id`, `POST /tickets/upload`.
- Visualizaciones: torta por categoría, barras por mes, ranking de comercios.
- Deploy público gratuito (front: Netlify/Vercel/GitHub Pages; back: Render/Railway/Fly.io; BD: Supabase).
- README con instrucciones + documentación (sistema, arquitectura, modelo de datos, endpoints, tecnologías, uso de IA).

## Comandos

- Levantar frontend: `cd frontend && python3 -m http.server 5500` → http://localhost:5500 (nunca abrir `index.html` con `file://`).
- Online: front https://fintrack-iua.netlify.app · API https://fintrack-api-5vmm.onrender.com/api/v1 (Render free: tarda ~1 min en despertar).
- Credenciales mock: `cliente@fintrack.local` / `asesor@fintrack.local`, clave `Fintrack2026*`.
- Backend: `cd backend && npm install && npm run start:dev` → http://localhost:3000/api/v1 (requiere `backend/.env`, ver `backend/CLAUDE.md`).

## Forma de trabajo

- Ramas: `main` estable; cada tarea en `feature/<nombre>` y se integra a `main` por PR/merge revisado por el otro integrante.
- **No hacer commits ni push**: eso lo hacen los integrantes a mano. Al terminar una tarea, dejar los cambios sin commitear y proponer un mensaje de commit en español (estilo de los existentes: "Implementación de …", "Corrección de …").
- Decisiones del front y refactor ya ejecutado: `especificaciones/DiagnosticoRefactor.md` (§6 y §7). Integración back ↔ front: `especificaciones/PlanIntegracionBackend.md` (fases I0–I6, completadas; §5 lista lo que queda antes de la entrega).
- Antes de cambios grandes, leer la spec correspondiente en `especificaciones/` y mantenerla consistente: si el código se aparta de la spec, actualizar la spec en el mismo cambio.
- Nunca commitear secretos (`.env`, claves de Supabase, API keys de OCR/IA).
