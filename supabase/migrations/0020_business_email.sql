-- Populated by scripts/extract-emails.ts, which crawls each business's own
-- website for a published contact email (mailto: links / plain-text
-- addresses) — the same thing a third-party "email extractor" tool does,
-- built in-house so it can run against all listings at once instead of one
-- URL at a time through a web form.
alter table businesses add column if not exists email text;
