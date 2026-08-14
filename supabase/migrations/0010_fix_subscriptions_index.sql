-- 0009's partial index (`where stripe_subscription_id is not null`) doesn't
-- match PostgREST's plain `on_conflict=stripe_subscription_id` upsert target
-- (Postgres error 42P10: no unique/exclusion constraint matches ON CONFLICT),
-- so every subscription upsert from the webhook silently failed. A plain
-- unique index works the same way for our purposes — Postgres already
-- allows multiple NULLs under a plain UNIQUE index/constraint.
drop index if exists subscriptions_stripe_subscription_id_key;

create unique index subscriptions_stripe_subscription_id_key
  on subscriptions (stripe_subscription_id);
