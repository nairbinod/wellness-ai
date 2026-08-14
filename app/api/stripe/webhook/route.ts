import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Keeps `subscriptions` and `businesses.listing_tier` in sync with the
// subscription itself, not the one-off checkout.session.completed event —
// that way renewals, payment failures, and cancellations (which fire
// customer.subscription.* without a matching checkout session) all flow
// through the same path.
async function syncSubscription(subscription: Stripe.Subscription) {
  const businessId = subscription.metadata?.businessId;
  if (!businessId) return;

  const item = subscription.items.data[0];
  const isActive = subscription.status === "active" || subscription.status === "trialing";

  const supabase = createAdminClient();

  const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
    {
      business_id: businessId,
      tier: "featured",
      stripe_subscription_id: subscription.id,
      stripe_customer_id:
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      status: subscription.status,
      current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
    },
    { onConflict: "stripe_subscription_id" }
  );
  if (subscriptionError) throw subscriptionError;

  const { data: business } = await supabase
    .from("businesses")
    .select("verified")
    .eq("id", businessId)
    .maybeSingle();

  const { error: businessError } = await supabase
    .from("businesses")
    .update({ listing_tier: isActive ? "featured" : business?.verified ? "verified" : "free" })
    .eq("id", businessId);
  if (businessError) throw businessError;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (err) {
    // Non-2xx tells Stripe to retry the event with backoff instead of
    // considering it delivered — important since these events are the only
    // source of truth for subscription state (see syncSubscription above).
    console.error("Stripe webhook handler failed", event.type, err);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response(null, { status: 200 });
}
