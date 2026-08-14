import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { sendDashboardMagicLink, signOut } from "./actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-ink-soft">Sign in to manage your claimed business listings.</p>
        <form action={sendDashboardMagicLink} className="mt-6 flex gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder="you@business.com"
            className="flex-1 border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
          />
          <button
            type="submit"
            className="bg-teal px-5 py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink"
          >
            Send link
          </button>
        </form>
        {sent ? <p className="mt-3 text-sm text-teal">Check {sent} for a sign-in link.</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </main>
    );
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug, category, listing_tier, metro:metros(slug, name, state), leads(count)")
    .eq("claimed_by", user.id)
    .order("name");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <form action={signOut}>
          <button type="submit" className="font-mono text-xs tracking-wider uppercase text-ink-soft underline">
            Sign out
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm text-ink-soft">Signed in as {user.email}</p>

      {!businesses?.length ? (
        <p className="mt-8 text-ink-soft">
          You haven&apos;t claimed a business yet. Find your listing and claim it from its page to
          manage it here.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {businesses.map((business) => (
            <li key={business.id}>
              <Link
                href={`/dashboard/listings/${business.id}`}
                className="flex items-center justify-between border border-rule-strong p-4 hover:border-ink"
              >
                <div>
                  <div className="font-semibold">{business.name}</div>
                  <div className="text-sm text-ink-soft">
                    {business.metro?.name}, {business.metro?.state} ·{" "}
                    <span className="font-mono uppercase">{business.listing_tier}</span>
                  </div>
                </div>
                <div className="font-mono text-sm text-ink-soft">
                  {business.leads?.[0]?.count ?? 0} lead
                  {business.leads?.[0]?.count === 1 ? "" : "s"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
