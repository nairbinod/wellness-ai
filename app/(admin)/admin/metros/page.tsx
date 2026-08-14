import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";
import { AdminNav } from "@/components/admin-nav";
import { addMetro, signOutAdmin } from "../actions";

const inputClass = "border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal";

export default async function AdminMetrosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminUser(supabase);
  if (!user || !isAdmin) redirect("/admin");

  const { data: metros } = await supabase.from("metros").select("id, name, state, slug, radius_miles").order("name");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <AdminNav email={user.email} signOutAction={signOutAdmin} />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Metros</h1>

      {saved ? <p className="mt-4 border border-teal px-3 py-2 text-sm text-teal">Saved.</p> : null}
      {error ? (
        <p className="mt-4 border border-red-400 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}

      <ul className="mt-6 divide-y divide-rule text-sm">
        {metros?.map((metro) => (
          <li key={metro.id} className="flex justify-between py-2">
            <span>
              {metro.name}, {metro.state} <span className="text-ink-soft">({metro.slug})</span>
            </span>
            <span className="font-mono text-ink-soft">{metro.radius_miles}mi radius</span>
          </li>
        ))}
      </ul>

      <form action={addMetro} className="mt-6 grid gap-2 sm:grid-cols-5">
        <input name="name" placeholder="Name" required className={inputClass} />
        <input name="state" placeholder="State" required maxLength={2} className={inputClass} />
        <input name="lat" type="number" step="any" placeholder="Lat" required className={inputClass} />
        <input name="lng" type="number" step="any" placeholder="Lng" required className={inputClass} />
        <input name="radius_miles" type="number" placeholder="Radius (mi)" defaultValue={25} className={inputClass} />
        <button
          type="submit"
          className="bg-teal px-4 py-2 font-mono text-xs tracking-wider uppercase text-teal-ink sm:col-span-5"
        >
          Add metro
        </button>
      </form>
    </main>
  );
}
