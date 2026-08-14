alter table businesses enable row level security;
alter table business_photos enable row level security;
alter table services enable row level security;
alter table reviews enable row level security;
alter table leads enable row level security;
alter table subscriptions enable row level security;
alter table lead_charges enable row level security;
alter table profiles enable row level security;

-- Public can read published listings and their related public data
create policy "public read businesses" on businesses for select using (true);
create policy "public read business_photos" on business_photos for select using (true);
create policy "public read services" on services for select using (true);
create policy "public read reviews" on reviews for select using (true);

-- Business owners can update only their own claimed listing
create policy "owner update own business" on businesses for update
  using (auth.uid() = claimed_by) with check (auth.uid() = claimed_by);

create policy "owner manage own services" on services for all
  using (exists (select 1 from businesses b where b.id = services.business_id and b.claimed_by = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = services.business_id and b.claimed_by = auth.uid()));

create policy "owner manage own photos" on business_photos for all
  using (exists (select 1 from businesses b where b.id = business_photos.business_id and b.claimed_by = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = business_photos.business_id and b.claimed_by = auth.uid()));

-- Leads: anyone can insert (public lead capture form), only the owning business can read their own leads
create policy "public insert leads" on leads for insert with check (true);
create policy "owner read own leads" on leads for select
  using (exists (select 1 from businesses b where b.id = leads.business_id and b.claimed_by = auth.uid()));
create policy "owner update own leads" on leads for update
  using (exists (select 1 from businesses b where b.id = leads.business_id and b.claimed_by = auth.uid()));

-- Subscriptions & lead_charges: owner read-only, writes happen via service role from server/webhooks
create policy "owner read own subscriptions" on subscriptions for select
  using (exists (select 1 from businesses b where b.id = subscriptions.business_id and b.claimed_by = auth.uid()));
create policy "owner read own lead_charges" on lead_charges for select
  using (exists (select 1 from businesses b where b.id = lead_charges.business_id and b.claimed_by = auth.uid()));

-- Profiles: users can read/update their own profile
create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);

-- Admin override: add a helper and bypass policies for role = 'admin'
create or replace function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer;

create policy "admin full access businesses" on businesses for all using (is_admin()) with check (is_admin());
create policy "admin full access leads" on leads for all using (is_admin()) with check (is_admin());
