-- =============================================================================
-- 0018_categoria_ropa.sql
-- Agrega la categoría "Ropa" al catálogo global.
--
-- Producción ya la tiene (se cargó a mano el 15/05/2026, fuera de las migraciones),
-- así que esta migración solo hace falta para que 0001..0018 reproduzcan la base.
-- Es idempotente: si "Ropa" ya existe (UNIQUE uq_categories_name), no hace nada y no
-- cambia su id, que usan los gastos existentes.
--
-- La usan también el OCR (ALLOWED_CATEGORIES en ocr.service.ts) y el mock del front
-- (frontend/mocks/seed.js). No es discrecional: no entra en la regla del perfil.
-- =============================================================================

INSERT INTO public.categorias_de_gasto (nombre, icono)
VALUES ('Ropa', '👕')
ON CONFLICT (nombre) DO NOTHING;
