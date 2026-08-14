create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

-- Same shape as the public lead-capture policy on `leads`: anyone can
-- submit an email, nobody (other than admins/service role) can read the
-- list back out through the API.
create policy "public insert newsletter_subscribers" on newsletter_subscribers
  for insert with check (true);

create policy "admin read newsletter_subscribers" on newsletter_subscribers
  for select using (is_admin());
