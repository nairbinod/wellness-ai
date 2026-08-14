-- Claiming a business only requires setting claimed_by from null to the
-- caller's own id — nothing else should change. A broad RLS "update where
-- claimed_by is null" policy can't express that (WITH CHECK only validates
-- the resulting claimed_by, not that other columns were left untouched), so
-- this is a narrow SECURITY DEFINER RPC instead, restricted to authenticated
-- users only.
create or replace function claim_business(target_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to claim a business';
  end if;

  update businesses
  set claimed_by = auth.uid(), updated_at = now()
  where id = target_business_id
    and claimed_by is null;

  if not found then
    raise exception 'Business is already claimed or does not exist';
  end if;
end;
$$;

revoke all on function claim_business(uuid) from public;
grant execute on function claim_business(uuid) to authenticated;
