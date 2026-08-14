-- Logs hits from known AI-agent/crawler user agents, separate from regular
-- traffic (which isn't logged server-side at all — that's what Vercel
-- Analytics is for). Written by middleware using the service-role client;
-- no insert policy for anon/authenticated is intentional.
create table agent_traffic_log (
  id uuid primary key default gen_random_uuid(),
  bot_name text not null,
  path text not null,
  user_agent text not null,
  created_at timestamptz not null default now()
);
create index on agent_traffic_log (created_at);
create index on agent_traffic_log (bot_name);

alter table agent_traffic_log enable row level security;

create policy "admin read agent_traffic_log" on agent_traffic_log
  for select using (is_admin());
