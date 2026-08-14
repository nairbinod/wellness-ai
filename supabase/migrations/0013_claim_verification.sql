-- Tiered business-claim verification (phone OTP, email-domain match,
-- document upload) replacing the previous one-click self-attestation claim.
-- Per-method write access is intentionally NOT granted via RLS to
-- authenticated/claimant users — every state transition (OTP confirmed,
-- document reviewed, dispute resolved) is a trust decision made in a server
-- action using the service-role client, not something a client-writable
-- policy should express. Claimants only get read access to their own
-- attempts, for status polling on the claim page.

create type claim_method as enum ('phone', 'email_domain', 'document');
create type claim_verification_status as enum ('pending', 'verified', 'rejected', 'disputed');
create type business_claim_status as enum ('unclaimed', 'pending_verification', 'verified', 'disputed');

alter table businesses add column claim_status business_claim_status not null default 'unclaimed';
update businesses set claim_status = 'verified' where claimed_by is not null;

create table claim_verifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  claimant_user_id uuid not null references auth.users(id) on delete cascade,
  method claim_method not null,
  status claim_verification_status not null default 'pending',
  attempts_count integer not null default 0,
  expires_at timestamptz,
  document_url text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on claim_verifications (business_id);
create index on claim_verifications (claimant_user_id);
create index on claim_verifications (business_id, created_at);

alter table claim_verifications enable row level security;

create policy "claimant read own claim_verifications" on claim_verifications
  for select using (claimant_user_id = auth.uid());

create policy "admin full access claim_verifications" on claim_verifications
  for all using (is_admin()) with check (is_admin());

-- Private bucket for claim-supporting documents (business license, EIN
-- letter, utility bill). Uploads and reads both go through the service-role
-- client from server actions/admin pages — no public or per-user storage
-- policies needed, same trust boundary as the rest of this table.
insert into storage.buckets (id, name, public)
values ('claim-documents', 'claim-documents', false)
on conflict (id) do nothing;
