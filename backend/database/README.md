# Base de datos — FinTrack 2026

PostgreSQL en Supabase (proyecto `IngWeb2`, región `us-east-1`). El backend accede con el service role (saltea RLS) y hace la autorización en los servicios Nest; las políticas RLS protegen el acceso directo con las claves públicas.

## Crear o actualizar la base

1. Supabase → **SQL Editor** → **New query**.
2. Pegar y ejecutar **en orden** cada archivo de `migrations/`, de `0001` a `0017`. Cada una se ejecuta una sola vez; las nuevas se agregan como `00NN_*.sql` (nunca se edita una migración ya aplicada).
3. (Opcional) Datos de la demo: ejecutar `seeds/seed_demo_jun_nov_2026.sql`.

La base de producción está al día con la `0017` (26/11/2026). El historial de migraciones del panel de Supabase está vacío porque se aplican a mano desde el SQL Editor; la fuente de verdad es esta carpeta.

## Contenido

| Ruta | Qué es |
|---|---|
| `migrations/` | Migraciones en orden. Resumen de cada una en `DB_SCHEMA_SUMMARY.md` § Migraciones. |
| `seeds/seed_demo_jun_nov_2026.sql` | Datos de la demo: gastos desde el 1/06/2026 hasta hoy para `bj@fintrack.com` y `bi@fintrack.com`, con gastos inusuales, y capacidad 10 para el asesor `mj@fintrack.com`. **Idempotente** (borra y regenera sus filas, marcadas con `descripcion = '[seed-demo]'`) y sin fechas futuras: se puede volver a correr el día de la demo para que el mes en curso tenga gastos. |
| `seeds/seed_perfiles_de_gasto.sql` | Catálogo de los 3 perfiles de gasto (lo mismo que carga la `0016`). |
| `seeds/seed_gastos_2026.sql` · `seeds/seed_gastos_cliente2_2026.sql` | Gastos de enero a mayo de 2026 para un cliente; hay que reemplazar el UUID a mano (son los que se usaron para cargar a `bj@` y `bi@`). |
| `DB_SCHEMA_SUMMARY.md` | Resumen del esquema: ENUMs, tablas, funciones, triggers, objetos eliminados y migraciones. |
| `database.types.ts` | Tipos generados con `npx supabase gen types typescript` (referencia; el backend no los importa). |
| `functions/` · `policies/` | Las funciones y políticas de la `0001`, separadas por archivo como **referencia histórica**. Incluyen objetos que migraciones posteriores eliminaron (`analisis_de_consumo`, `mensajes_asesor`): para saber qué hay hoy, mirar las migraciones o `DB_SCHEMA_SUMMARY.md`. |

## Seguridad

- RLS activo en todas las tablas: con la clave anónima y sin login no se leen filas.
- Ninguna función `SECURITY DEFINER` es ejecutable por `anon` y todas tienen `search_path` fijo (`0017`).
- Pendiente en el panel (no es SQL): activar **Authentication → Policies → Leaked password protection**.

## Diferencia conocida

La categoría `Ropa` existe en la base de producción pero no la crea ninguna migración (se agregó a mano). El OCR no la sugiere (su lista de categorías está en `src/modules/tickets/ocr.service.ts`).
