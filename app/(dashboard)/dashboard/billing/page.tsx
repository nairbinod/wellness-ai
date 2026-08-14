import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function BillingIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, listing_tier")
    .eq("claimed_by", user.id)
    .order("name");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/dashboard" className="text-sm text-ink-soft hover:text-teal">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Billing</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Billing is per listing. Pick one to view its tier or upgrade.
      </p>

      {!businesses?.length ? (
        <p className="mt-8 text-ink-soft">
          You haven&apos;t claimed a business yet. Find your listing and claim it from its page
          to manage billing here.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {businesses.map((business) => (
            <li key={business.id}>
              <Link
                href={`/dashboard/listings/${business.id}/billing`}
                className="flex items-center justify-between border border-rule-strong p-4 hover:border-ink"
              >
                <span className="font-semibold">{business.name}</span>
                <span className="font-mono text-xs uppercase text-ink-soft">
                  {business.listing_tier}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
