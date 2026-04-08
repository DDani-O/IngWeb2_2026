-- =========================================================
-- ROW LEVEL SECURITY: categorias_de_gasto
-- =========================================================

alter table public.categorias_de_gasto enable row level security;

drop policy if exists "categorias_select" on public.categorias_de_gasto;
create policy "categorias_select"
on public.categorias_de_gasto
for select
using (auth.uid() is not null);
