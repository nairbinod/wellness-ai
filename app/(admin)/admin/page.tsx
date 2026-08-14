import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";
import { sendAdminMagicLink, signOutAdmin } from "./actions";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminUser(supabase);

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-ink-soft">Sign in with an admin account.</p>
        <form action={sendAdminMagicLink} className="mt-6 flex gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder="you@company.com"
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

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-ink-soft">
          Signed in as {user.email}, but this account doesn&apos;t have admin access.
        </p>
        <form action={signOutAdmin} className="mt-4">
          <button type="submit" className="font-mono text-xs tracking-wider uppercase text-ink-soft underline">
            Sign out
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-ink-soft">Signed in as {user.email}</p>
      <ul className="mt-8 space-y-3">
        <li>
          <Link href="/admin/listings" className="block border border-rule-strong p-4 hover:border-ink">
            Listings — moderation &amp; manual entry
          </Link>
        </li>
        <li>
          <Link href="/admin/leads" className="block border border-rule-strong p-4 hover:border-ink">
            Leads — cross-business oversight
          </Link>
        </li>
        <li>
          <Link href="/admin/metros" className="block border border-rule-strong p-4 hover:border-ink">
            Metros — manage launch markets
          </Link>
        </li>
      </ul>
      <form action={signOutAdmin} className="mt-8">
        <button type="submit" className="font-mono text-xs tracking-wider uppercase text-ink-soft underline">
          Sign out
        </button>
      </form>
    </main>
  );
}
