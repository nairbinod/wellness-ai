-- profiles rows were never actually created anywhere — is_admin() and the
-- "read/update own profile" policies all assume a row exists per user, but
-- nothing populated one on signup. Standard Supabase pattern: trigger a
-- profile row into existence whenever a new auth.users row appears.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, role) values (new.id, 'consumer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
