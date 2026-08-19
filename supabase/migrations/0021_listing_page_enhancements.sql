-- Supports the stronger listing-page template: a real "verified since" date
-- (previously only a boolean existed) and an owner-editable current-special
-- field, rather than static/fabricated copy.
alter table businesses add column if not exists verified_at timestamptz;
alter table businesses add column if not exists current_special text;
