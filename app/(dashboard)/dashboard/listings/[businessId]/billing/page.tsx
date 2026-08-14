import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FEATURED_PRICE_ID } from "@/lib/stripe";
import { startCheckout, openBillingPortal } from "./actions";

export default async function ListingBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ upgraded?: string; error?: string }>;
}) {
  const { businessId } = await params;
  const { upgraded, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, claimed_by, listing_tier, verified")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) notFound();
  if (business.claimed_by !== user.id) redirect("/dashboard");

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, stripe_customer_id")
    .eq("business_id", businessId);

  const active = subscriptions?.find((s) => s.status === "active" || s.status === "trialing");
  const hasBillingHistory = subscriptions?.some((s) => s.stripe_customer_id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href={`/dashboard/listings/${businessId}`} className="text-sm text-ink-soft hover:text-teal">
        ← {business.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Billing</h1>

      {upgraded ? (
        <p className="mt-4 border border-teal px-3 py-2 text-sm text-teal">
          You&apos;re upgraded to Featured. It may take a moment to reflect on your listing.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 border border-red-400 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-8 border border-rule-strong p-6">
        <div className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
          Current tier
        </div>
        <div className="mt-1.5 text-lg font-semibold uppercase">
          {business.listing_tier}
        </div>

        {active ? (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              {active.current_period_end
                ? `Renews ${new Date(active.current_period_end).toLocaleDateString()}`
                : "Active subscription"}
            </p>
            <form action={openBillingPortal.bind(null, businessId)} className="mt-5">
              <button
                type="submit"
                className="border border-rule-strong px-5 py-2.5 font-mono text-xs tracking-wider uppercase hover:border-ink"
              >
                Manage subscription
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-2 max-w-[48ch] text-sm text-ink-soft">
              Featured listings get prioritized placement on the homepage and in category
              results. $99/month, cancel anytime.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <form action={startCheckout.bind(null, businessId)}>
                <button
                  type="submit"
                  disabled={!FEATURED_PRICE_ID}
                  className="bg-teal px-5 py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink disabled:opacity-50"
                >
                  Upgrade to Featured — $99/mo
                </button>
              </form>
              {hasBillingHistory ? (
                <form action={openBillingPortal.bind(null, businessId)}>
                  <button
                    type="submit"
                    className="border border-rule-strong px-5 py-2.5 font-mono text-xs tracking-wider uppercase hover:border-ink"
                  >
                    Billing history
                  </button>
                </form>
              ) : null}
            </div>
            {!FEATURED_PRICE_ID ? (
              <p className="mt-3 text-xs text-ink-soft">Billing isn&apos;t configured yet.</p>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
