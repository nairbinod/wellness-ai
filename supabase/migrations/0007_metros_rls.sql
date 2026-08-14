-- 0002_rls.sql enabled RLS on businesses/business_photos/services/reviews/
-- leads/subscriptions/lead_charges/profiles but never touched metros, which
-- left it with no RLS at all — meaning Supabase's default grants (anon +
-- authenticated get ALL on every public table) applied unfiltered. Confirmed
-- exploitable: an anonymous request could INSERT into metros directly.
alter table metros enable row level security;

create policy "public read metros" on metros for select using (true);

create policy "admin write metros" on metros for insert with check (is_admin());
create policy "admin update metros" on metros for update using (is_admin()) with check (is_admin());
create policy "admin delete metros" on metros for delete using (is_admin());
