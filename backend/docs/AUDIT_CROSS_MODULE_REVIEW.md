# Cross-Module Code Review (NestJS + Supabase)

Date: 2026-05-17
Scope: backend only (controllers, services, DTOs, guards).

Database context provided:
- `categorias_de_gasto` is global/public with unique `nombre` and PK `id`.
- `gastos.categoria_id` has FK to `categorias_de_gasto(id)` with `ON DELETE RESTRICT` and a positive amount check.
- `gastos.cliente_id` has FK to `usuarios(id)` with `ON DELETE CASCADE`.

## A) Errores Criticos / Bugs Encontrados
- `mapPriority()` devuelve "Media" cuando el valor es "baja", lo que rompe el contrato de prioridad baja y puede confundir al UI. Referencia: [backend/src/modules/users/users.service.ts](backend/src/modules/users/users.service.ts#L452-L468)
- `mapType()` mapea "observacion" a "felicitacion" de forma inesperada (posible bug de mapeo). Referencia: [backend/src/modules/users/users.service.ts](backend/src/modules/users/users.service.ts#L470-L485)

## B) Vulnerabilidades de Seguridad o Brechas de Aislamiento
- `findAll` en gastos usa `query.search` directo dentro de `.or(...)` sin sanitizar caracteres especiales (`%`, `,`, `)`), lo que permite ampliar filtros de forma inesperada o generar consultas anomalas. Estado: RESUELTO (se sanitiza `%`, `,`, `(`, `)`, `\`). Referencia: [backend/src/modules/expenses/expenses.service.ts](backend/src/modules/expenses/expenses.service.ts#L34-L70)
- El cliente Supabase con `SUPABASE_SERVICE_KEY` se usa en servicios con datos sensibles y evita RLS. La seguridad depende 100% de filtros `.eq("cliente_id", userId)` y checks de asignacion. Recomendable documentarlo y reforzar tests de aislamiento. Referencia: [backend/src/common/supabase/supabase.provider.ts](backend/src/common/supabase/supabase.provider.ts#L1-L33)

## C) Inconsistencias de Formato/DTOs post-merge
- `categorias_de_gasto` se trata como objeto en `formatExpense()` pero como array en `findOne/create/update`. Esto puede producir `categoryName` null o inconsistente segun la forma de la respuesta de Supabase. Estado: RESUELTO (mapeo normalizado en `formatExpense` y reutilizado en `findOne/create/update`). Referencias: [backend/src/modules/expenses/expenses.service.ts](backend/src/modules/expenses/expenses.service.ts#L120-L190), [backend/src/modules/expenses/expenses.service.ts](backend/src/modules/expenses/expenses.service.ts#L175-L260), [backend/src/modules/expenses/expenses.service.ts](backend/src/modules/expenses/expenses.service.ts#L300-L410)
- `getSummary()` intenta normalizar ambos formatos (objeto vs array) para categorias, pero el resto del modulo no mantiene el mismo criterio, generando riesgo de `undefined` o `null` en respuestas. Referencia: [backend/src/modules/expenses/expenses.service.ts](backend/src/modules/expenses/expenses.service.ts#L70-L115)
- La validacion de `categoryId` en `create/update` es correcta y consistente con el FK `gastos.categoria_id -> categorias_de_gasto(id)` y el esquema de categorias globales. No se detectan intentos de categorias locales en los modulos auditados.

## D) Sugerencias de Refactorizacion para Clean Code
- Centralizar el mapeo de gastos en un helper unico que normalice la relacion `categorias_de_gasto` a un formato estable (objeto o array), y reutilizarlo en `findAll`, `findOne`, `create`, `update`, y `getSummary`.
- Sanitizar entradas de busqueda en gastos igual que en asesor (`replace(/%/g, "")`) o implementar una funcion comun de sanitizacion para `ilike`/`or`.
- Documentar explicitamente la decision de usar service key (bypass RLS) y crear tests de aislamiento multi-tenant que verifiquen filtros por `cliente_id` o checks de asignacion en cada endpoint.
- Revisar y alinear los mapeos de enums (`mapPriority`, `mapType`) con el contrato de UI y las tablas de Supabase para evitar estados incoherentes.
- Alinear mensajes de error de integridad con el esquema (FK `ON DELETE RESTRICT` en categorias) para que el API explique claramente cuando una categoria no existe o no se puede eliminar.
