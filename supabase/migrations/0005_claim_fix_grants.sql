-- Supabase auto-grants EXECUTE on new functions to anon/authenticated/
-- service_role individually via default privileges, so "revoke ... from
-- public" in 0004_claim.sql wasn't enough to keep anon out.
revoke execute on function claim_business(uuid) from anon;
