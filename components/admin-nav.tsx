import Link from "next/link";

export function AdminNav({ email, signOutAction }: { email?: string; signOutAction: () => Promise<void> }) {
  return (
    <div className="flex items-center justify-between border-b border-rule pb-4">
      <nav className="flex gap-5 font-mono text-xs tracking-wider uppercase">
        <Link href="/admin/listings" className="hover:text-teal">
          Listings
        </Link>
        <Link href="/admin/leads" className="hover:text-teal">
          Leads
        </Link>
        <Link href="/admin/metros" className="hover:text-teal">
          Metros
        </Link>
        <Link href="/admin/claims" className="hover:text-teal">
          Claims
        </Link>
        <Link href="/admin/agent-traffic" className="hover:text-teal">
          Agent Traffic
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        {email ? <span className="text-sm text-ink-soft">{email}</span> : null}
        <form action={signOutAction}>
          <button type="submit" className="font-mono text-xs tracking-wider uppercase text-ink-soft underline">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
