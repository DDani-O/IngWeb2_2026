# FinTrack 2026 — Ingeniería Web II (IUA)

Plataforma de gestión de gastos personales con OCR/IA, roles **cliente** y **asesor**. Grupo: Daniel y Cele. Requisitos: `Consigna_Plataforma Gestion de Gastos Personales.pdf` (fuente de verdad).

## Dónde está cada cosa

- [README.md](README.md): sistema, arquitectura, endpoints, IA, cómo levantar, demo, **principios de desarrollo (§11)**, decisiones y pendientes después de la entrega (§14).
- [backend/README.md](backend/README.md): estructura, convenciones, **contrato de la API (§3)**, reglas del análisis (§4), OCR, base de datos, variables de entorno, tests y deploy.
- [frontend/README.md](frontend/README.md): estructura, ruteo, servicios y drivers, componentes, **estilos (§5)** y **principios del front (§6)**.

## Reglas

- Todo en **español rioplatense** (textos, comentarios, docs, commits, respuestas). Identificadores en inglés salvo lo que ya está en español (tablas y contrato).
- Seguir los principios de `README.md` §11 y de `frontend/README.md` §5 y §6.
- Frontend en HTML, CSS y JS vanilla; solo Bootstrap 5 y Chart.js por CDN. Backend en NestJS.
- Si cambia el contrato de la API: en el mismo cambio, backend, mock (`frontend/mocks/`), `frontend/services/adapters.js` y `backend/README.md` §3. Si cambia una regla del análisis: `analysis.rules.ts`, `frontend/mocks/analytics.js` y `backend/README.md` §4.
- **No hacer commits ni push.** Dejar los cambios sin commitear y proponer un mensaje en español con el estilo del repo ("Implementación de …", "Corrección de …", "Refactorización de …").
- **Nunca commitear ni mostrar secretos** (`.env`, claves de Supabase, API keys).
- **Supabase es la base de producción y de la demo:** todo cambio (migraciones, datos, borrados) va primero como archivo o script y se aplica solo con confirmación del equipo.
- Nada de refactors grandes sin acordarlo; lo que no hace falta va a `README.md` §14.

## Ramas

Se trabaja en `dev` o en `feature/*` cortada de `dev`. `main` es lo publicado (Netlify y Render deployan desde ahí) y se actualiza con `git merge --ff-only dev`.

## Comandos

- Front: `cd frontend && python3 -m http.server 5500` → http://localhost:5500. Mock: `cliente@fintrack.local` / `asesor@fintrack.local`, clave `Fintrack2026*`.
- Back: `cd backend && npm install && npm run start:dev` → http://localhost:3000/api/v1 (requiere `backend/.env`).
- Antes de proponer un commit: `npx tsc --noEmit`, `npm run lint`, `npm test` y `npm run test:e2e` en `backend/`, y el recorrido manual del `README.md` §10.
- Online: https://fintrack-iua.netlify.app · https://fintrack-api-5vmm.onrender.com/api/v1 (Render tarda ~1 min en despertar).
