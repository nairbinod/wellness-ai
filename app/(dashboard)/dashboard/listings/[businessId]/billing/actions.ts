"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe, FEATURED_PRICE_ID } from "@/lib/stripe";
import { siteUrl } from "@/lib/jsonld";

async function requireOwnedBusiness(businessId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, claimed_by")
    .eq("id", businessId)
    .maybeSingle();

  if (!business || business.claimed_by !== user.id) redirect("/dashboard");

  return { supabase, user, businessId };
}

async function existingCustomerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string
) {
  const { data } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("business_id", businessId)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();
  return data?.stripe_customer_id ?? undefined;
}

export async function startCheckout(businessId: string) {
  const { supabase, user } = await requireOwnedBusiness(businessId);
  const billingPath = `/dashboard/listings/${businessId}/billing`;

  if (!FEATURED_PRICE_ID) {
    redirect(`${billingPath}?error=${encodeURIComponent("Billing isn't configured yet.")}`);
  }

  const customerId = await existingCustomerId(supabase, businessId);

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: FEATURED_PRICE_ID, quantity: 1 }],
    client_reference_id: businessId,
    subscription_data: { metadata: { businessId } },
    ...(customerId ? { customer: customerId } : user.email ? { customer_email: user.email } : {}),
    success_url: siteUrl(`${billingPath}?upgraded=1`),
    cancel_url: siteUrl(billingPath),
  });

  if (!session.url) {
    redirect(`${billingPath}?error=${encodeURIComponent("Couldn't start checkout. Try again.")}`);
  }
  redirect(session.url);
}

export async function openBillingPortal(businessId: string) {
  const { supabase } = await requireOwnedBusiness(businessId);
  const billingPath = `/dashboard/listings/${businessId}/billing`;

  const customerId = await existingCustomerId(supabase, businessId);
  if (!customerId) redirect(billingPath);

  const portalSession = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: siteUrl(billingPath),
  });

  redirect(portalSession.url);
}
