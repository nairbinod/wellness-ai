-- search_vector (0003_search.sql) only indexed businesses.name/description as
-- a generated column, so keyword search never matched service names (e.g.
-- "hydrafacial") since those live in the separate `services` table and a
-- generated column can't reference another table. This migration converts
-- search_vector to a trigger-maintained column that also folds in the
-- business's own services, and backfills existing rows.

-- Drop the generated expression but keep the column (and its data/index) —
-- PG allows converting a generated column to a normal writable one this way.
alter table businesses alter column search_vector drop expression;

create or replace function refresh_business_search_vector(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update businesses b
  set search_vector = to_tsvector(
    'english',
    coalesce(b.name, '') || ' ' ||
    coalesce(b.description, '') || ' ' ||
    coalesce(
      (select string_agg(coalesce(s.name, '') || ' ' || coalesce(s.description, ''), ' ')
       from services s where s.business_id = b.id),
      ''
    )
  )
  where b.id = p_business_id;
end;
$$;

create or replace function trg_refresh_business_search_vector_from_business()
returns trigger
language plpgsql
as $$
begin
  perform refresh_business_search_vector(new.id);
  return new;
end;
$$;

create or replace function trg_refresh_business_search_vector_from_service()
returns trigger
language plpgsql
as $$
begin
  perform refresh_business_search_vector(coalesce(new.business_id, old.business_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists businesses_refresh_search_vector on businesses;
create trigger businesses_refresh_search_vector
  after insert or update of name, description on businesses
  for each row execute function trg_refresh_business_search_vector_from_business();

drop trigger if exists services_refresh_business_search_vector on services;
create trigger services_refresh_business_search_vector
  after insert or update or delete on services
  for each row execute function trg_refresh_business_search_vector_from_service();

-- Backfill: recompute every existing row now that services are included.
update businesses b
set search_vector = to_tsvector(
  'english',
  coalesce(b.name, '') || ' ' ||
  coalesce(b.description, '') || ' ' ||
  coalesce(
    (select string_agg(coalesce(s.name, '') || ' ' || coalesce(s.description, ''), ' ')
     from services s where s.business_id = b.id),
    ''
  )
);
