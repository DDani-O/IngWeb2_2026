-- =========================================================
-- ROW LEVEL SECURITY: perfiles_de_gasto
-- =========================================================

alter table public.perfiles_de_gasto enable row level security;

drop policy if exists "perfiles_de_gasto_select" on public.perfiles_de_gasto;
create policy "perfiles_de_gasto_select"
on public.perfiles_de_gasto
for select
using (auth.uid() is not null);
