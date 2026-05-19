-- Migration: Remove Consumption Analysis Table
-- Description: Drops the analisis_de_consumo table and related components (trigger and function).
-- Note: Consumption analysis is currently calculated dynamically from expenses and doesn't persist in this table.

-- Drop trigger
DROP TRIGGER IF EXISTS trg_validar_analisis_de_consumo ON public.analisis_de_consumo;

-- Drop function
DROP FUNCTION IF EXISTS public.validar_analisis_de_consumo();

-- Drop table
DROP TABLE IF EXISTS public.analisis_de_consumo CASCADE;
