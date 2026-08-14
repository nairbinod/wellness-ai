-- Stripe customer id lives on subscriptions, not businesses, because
-- subscriptions has no public-read RLS policy (owner-only), while businesses
-- is publicly readable — putting it there would leak Stripe customer ids
-- through the public REST API.
alter table subscriptions add column stripe_customer_id text;

create unique index subscriptions_stripe_subscription_id_key
  on subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;
