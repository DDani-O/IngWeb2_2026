-- =========================================================
-- VALIDADOR: analisis_ocr
-- =========================================================

create or replace function public.validar_analisis_ocr()
returns trigger
language plpgsql
as $$
begin
    return new;
end;
$$;

drop trigger if exists trg_validar_analisis_ocr on public.analisis_ocr;
create trigger trg_validar_analisis_ocr
before insert or update on public.analisis_ocr
for each row execute function public.validar_analisis_ocr();
