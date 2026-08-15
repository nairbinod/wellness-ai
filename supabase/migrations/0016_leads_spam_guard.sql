-- Lead form had no spam mitigation (no honeypot, no rate limit) despite being
-- a public, unauthenticated form tied to the pay-per-lead revenue model —
-- bot-submitted leads are a real business cost, not just noise. This adds an
-- ip_address column so the rate limit in actions.ts has something to count
-- against; honeypot rejection happens before any insert, so it needs no
-- schema change.
alter table leads add column if not exists ip_address text;

create index if not exists leads_ip_address_created_at_idx
  on leads (ip_address, created_at);
