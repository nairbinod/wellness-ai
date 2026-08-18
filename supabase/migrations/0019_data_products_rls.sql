-- market_snapshots and data_product_reports were created in 0001_init.sql
-- but never enabled for RLS — the same gap 0007_metros_rls.sql found and
-- fixed for `metros` (Supabase's default grants give anon/authenticated ALL
-- on every public table unless RLS says otherwise). Confirmed exploitable:
-- an anonymous request could INSERT into market_snapshots directly (it got
-- past the privilege check straight to a foreign-key error, which only
-- happens once RLS has already let the write through).
--
-- Both tables are internal, Phase 2+ data-refinery tables with no public
-- read/write use case yet (see "Data Products Layer" in the project brief —
-- no reporting logic or sales motion exists until real listing density
-- does), so admin-only lockdown is correct for now, not a public-read policy.
alter table market_snapshots enable row level security;
alter table data_product_reports enable row level security;

create policy "admin full access market_snapshots" on market_snapshots
  for all using (is_admin()) with check (is_admin());
create policy "admin full access data_product_reports" on data_product_reports
  for all using (is_admin()) with check (is_admin());
