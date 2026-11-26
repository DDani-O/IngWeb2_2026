# Backend — NestJS + Supabase

Estado: **sin inicializar**. `package.json` y `tsconfig.json` están vacíos; las carpetas `src/auth`, `src/users`, `src/expenses`, `src/tickets` solo tienen `.gitkeep`. La primera tarea es generar el proyecto Nest dentro de `backend/` sin pisar `src/database/`.

## Base de datos (ya hecha)

- `src/database/migrations/0001_init_schema.sql` — esquema completo y autosuficiente (PostgreSQL/Supabase): 12 tablas, ENUMs, funciones validadoras, triggers y políticas RLS. Se ejecuta en el SQL Editor de Supabase.
- `src/database/functions/` y `src/database/policies/` — los mismos componentes separados por archivo, solo de referencia. Si se modifica algo, mantener sincronizados el migration y estos archivos (o crear una migración nueva `0002_*.sql`).
- Tablas con nombres en español: `usuarios`, `perfiles_usuarios`, `perfiles_asesores`, `asignaciones_de_clientes`, `categorias_de_gasto`, `gastos`, `tickets`, `analisis_ocr`, `recomendaciones_financieras`, `perfiles_de_gasto`, `clasificacion_de_perfil`, `analisis_de_consumo`. Leer el migration antes de escribir entidades/DTOs.

## Convenciones

- Un módulo Nest por dominio (`auth`, `users`, `expenses`, `tickets`, y los que hagan falta: recomendaciones, análisis, asesor). Cada uno con `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`.
- Validación de entrada con DTOs + `class-validator` y `ValidationPipe` global.
- Auth con JWT; roles `usuario`/`asesor` con guard + decorador `@Roles()`.
- Respetar el contrato de endpoints de `../especificaciones/EspecificacionDesarrolloFront.md` (sección 10) y los mínimos de la consigna. Si se cambia un endpoint, actualizar esa sección.
- Referencia ejecutable del contrato: el backend simulado del front (`../frontend/mocks/mockServer.js`) implementa todas las rutas, validaciones, códigos de error y permisos, y `../frontend/mocks/analytics.js` implementa las reglas de análisis (gastos inusuales, nivel de riesgo, asignación automática del perfil de gasto). Las respuestas tienen que tener exactamente esa forma (en español, como la BD).
- Configuración por variables de entorno (`@nestjs/config`): URL/keys de Supabase, secreto JWT, API key del servicio OCR/IA. Mantener un `.env.example` versionado; el `.env` real nunca se commitea.
- CORS habilitado para el origen del frontend (local `http://localhost:5500` y el dominio del deploy).

## Comandos (una vez inicializado)

- `npm install` · `npm run start:dev` · `npm run build` · `npm run lint` · `npm test`
- Después de cada cambio: compilar (`npm run build`) y correr los tests que existan.
