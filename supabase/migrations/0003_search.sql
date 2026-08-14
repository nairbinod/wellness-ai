-- Stored generated tsvector column so full-text search can be filtered via
-- PostgREST (supabase-js .textSearch()), which requires a real column
-- reference rather than the expression index created in 0001_init.sql.
alter table businesses
  add column search_vector tsvector
  generated always as (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))) stored;

create index businesses_search_vector_idx on businesses using gin (search_vector);
