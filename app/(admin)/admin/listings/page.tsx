import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";
import { AdminNav } from "@/components/admin-nav";
import { CATEGORY_LABELS, type BusinessCategory } from "@/lib/categories";
import { addBusiness, updateBusinessModeration, signOutAdmin } from "../actions";
import type { Database } from "@/lib/types/database";

type ListingTier = Database["public"]["Enums"]["listing_tier"];
const LISTING_TIERS: ListingTier[] = ["free", "verified", "featured"];
const inputClass = "border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; q?: string }>;
}) {
  const { error, saved, q } = await searchParams;
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminUser(supabase);
  if (!user || !isAdmin) redirect("/admin");

  const { data: metros } = await supabase.from("metros").select("id, name, state").order("name");

  let businessQuery = supabase
    .from("businesses")
    .select("id, name, city, state, category, verified, listing_tier, metro:metros(name, state)")
    .order("name")
    .limit(30);
  if (q?.trim()) businessQuery = businessQuery.ilike("name", `%${q.trim()}%`);
  const { data: businesses } = await businessQuery;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <AdminNav email={user.email} signOutAction={signOutAdmin} />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Listings</h1>

      {saved ? <p className="mt-4 border border-teal px-3 py-2 text-sm text-teal">Saved.</p> : null}
      {error ? (
        <p className="mt-4 border border-red-400 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}

      <section className="mt-8">
        <h2 className="font-semibold">Add business</h2>
        <form action={addBusiness} className="mt-4 grid gap-2 sm:grid-cols-2">
          <input name="name" placeholder="Business name" required className={inputClass} />
          <select name="category" required defaultValue="" className={inputClass}>
            <option value="" disabled>Category…</option>
            {(Object.keys(CATEGORY_LABELS) as BusinessCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <select name="metro_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>Metro…</option>
            {metros?.map((m) => (
              <option key={m.id} value={m.id}>{m.name}, {m.state}</option>
            ))}
          </select>
          <input name="city" placeholder="City" className={inputClass} />
          <input name="state" placeholder="State" maxLength={2} className={inputClass} />
          <button
            type="submit"
            className="bg-teal px-4 py-2 font-mono text-xs tracking-wider uppercase text-teal-ink sm:col-span-2"
          >
            Add business
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold">Moderation</h2>
        <form className="mt-2" action="/admin/listings">
          <input type="text" name="q" defaultValue={q} placeholder="Search by name…" className={`w-full ${inputClass}`} />
        </form>
        <ul className="mt-4 space-y-2">
          {businesses?.map((business) => (
            <li key={business.id} className="border border-rule-strong p-3">
              <form action={updateBusinessModeration.bind(null, business.id)} className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[10rem]">
                  <div className="text-sm font-semibold">{business.name}</div>
                  <div className="text-xs text-ink-soft">
                    {CATEGORY_LABELS[business.category]} · {business.metro?.name}, {business.metro?.state}
                  </div>
                  <Link
                    href={`/dashboard/listings/${business.id}`}
                    className="text-xs text-teal underline"
                  >
                    Edit details &amp; services
                  </Link>
                </div>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" name="verified" value="yes" defaultChecked={business.verified} />
                  Verified
                </label>
                <select
                  name="listing_tier"
                  defaultValue={business.listing_tier}
                  className="border border-rule-strong bg-paper px-2 py-1 text-xs outline-none focus:border-teal"
                >
                  {LISTING_TIERS.map((tier) => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
                <button type="submit" className="border border-rule-strong px-3 py-1 font-mono text-xs uppercase">
                  Save
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
