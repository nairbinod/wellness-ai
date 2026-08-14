import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin";
import { AdminNav } from "@/components/admin-nav";
import {
  signOutAdmin,
  approveDocumentClaim,
  rejectDocumentClaim,
  approveDispute,
  rejectDispute,
} from "../actions";

const btnSolid = "border border-teal px-3 py-1.5 font-mono text-xs uppercase text-teal";
const btnOutline = "border border-rule-strong px-3 py-1.5 font-mono text-xs uppercase hover:border-ink";

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminUser(supabase);
  if (!user || !isAdmin) redirect("/admin");

  const admin = createAdminClient();

  const [{ data: pendingDocs }, { data: disputes }] = await Promise.all([
    admin
      .from("claim_verifications")
      .select("id, business_id, claimant_user_id, document_url, created_at, businesses(name, slug)")
      .eq("method", "document")
      .eq("status", "pending")
      .order("created_at"),
    admin
      .from("claim_verifications")
      .select("id, business_id, claimant_user_id, created_at, businesses(name, slug, claimed_by)")
      .eq("status", "disputed")
      .order("created_at"),
  ]);

  const userIds = new Set<string>();
  for (const d of pendingDocs ?? []) userIds.add(d.claimant_user_id);
  for (const d of disputes ?? []) {
    userIds.add(d.claimant_user_id);
    if (d.businesses?.claimed_by) userIds.add(d.businesses.claimed_by);
  }
  const emails = new Map<string, string>();
  await Promise.all(
    [...userIds].map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data.user?.email) emails.set(id, data.user.email);
    })
  );

  const signedUrls = new Map<string, string>();
  await Promise.all(
    (pendingDocs ?? []).map(async (d) => {
      if (!d.document_url) return;
      const { data } = await admin.storage.from("claim-documents").createSignedUrl(d.document_url, 3600);
      if (data?.signedUrl) signedUrls.set(d.id, data.signedUrl);
    })
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AdminNav email={user.email} signOutAction={signOutAdmin} />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Claims</h1>

      {saved ? <p className="mt-4 border border-teal px-3 py-2 text-sm text-teal">Saved.</p> : null}
      {error ? (
        <p className="mt-4 border border-red-400 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}

      <section className="mt-8">
        <h2 className="font-semibold">Pending document reviews ({pendingDocs?.length ?? 0})</h2>
        {!pendingDocs?.length ? (
          <p className="mt-2 text-sm text-ink-soft">None right now.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pendingDocs.map((d) => (
              <li key={d.id} className="border border-rule-strong p-4">
                <div className="text-sm font-semibold">{d.businesses?.name}</div>
                <div className="mt-1 text-xs text-ink-soft">
                  Claimant: {emails.get(d.claimant_user_id) ?? d.claimant_user_id}
                </div>
                <div className="mt-1 font-mono text-xs text-ink-soft">
                  {new Date(d.created_at).toLocaleString()}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {signedUrls.get(d.id) ? (
                    <a
                      href={signedUrls.get(d.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal underline"
                    >
                      View document
                    </a>
                  ) : null}
                  <form action={approveDocumentClaim.bind(null, d.id)}>
                    <button type="submit" className={btnSolid}>
                      Approve
                    </button>
                  </form>
                  <form action={rejectDocumentClaim.bind(null, d.id)}>
                    <button type="submit" className={btnOutline}>
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-semibold">Disputes ({disputes?.length ?? 0})</h2>
        {!disputes?.length ? (
          <p className="mt-2 text-sm text-ink-soft">None right now.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {disputes.map((d) => (
              <li key={d.id} className="border border-rule-strong p-4">
                <div className="text-sm font-semibold">{d.businesses?.name}</div>
                <div className="mt-1 text-xs text-ink-soft">
                  Currently claimed by:{" "}
                  {d.businesses?.claimed_by ? emails.get(d.businesses.claimed_by) ?? d.businesses.claimed_by : "unclaimed"}
                </div>
                <div className="text-xs text-ink-soft">
                  Disputed by: {emails.get(d.claimant_user_id) ?? d.claimant_user_id}
                </div>
                <div className="mt-1 font-mono text-xs text-ink-soft">
                  {new Date(d.created_at).toLocaleString()}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <form action={approveDispute.bind(null, d.id)}>
                    <button type="submit" className={btnSolid}>
                      Reassign to disputer
                    </button>
                  </form>
                  <form action={rejectDispute.bind(null, d.id)}>
                    <button type="submit" className={btnOutline}>
                      Reject dispute
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
