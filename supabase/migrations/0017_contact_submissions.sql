-- Provider "Contact Us" form (app/(public)/contact) — the FAQ page already
-- promised "the contact link in the footer" for businesses wanting to be
-- added/get in touch, but no such page or table existed yet.
create table contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_name text,
  email text not null,
  phone text,
  message text not null,
  ip_address text,
  created_at timestamptz not null default now()
);
create index on contact_submissions (created_at);
create index on contact_submissions (ip_address, created_at);

alter table contact_submissions enable row level security;

-- Same shape as the leads table's policies: anyone can submit, only admins
-- can read (there's no "owner" concept here — every submission goes to us).
create policy "public insert contact_submissions" on contact_submissions
  for insert with check (true);
create policy "admin full access contact_submissions" on contact_submissions
  for all using (is_admin()) with check (is_admin());
