-- Admins can already write to `businesses` (0002's "admin full access
-- businesses") but not to `services`, which only has an owner-scoped
-- policy. That blocked admins from adding/editing services on a listing
-- nobody has claimed yet — e.g. right after adding it via /admin/listings.
create policy "admin full access services" on services for all
  using (is_admin()) with check (is_admin());
