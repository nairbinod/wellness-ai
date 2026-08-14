import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";
import { AdminNav } from "@/components/admin-nav";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { Database } from "@/lib/types/database";
import { updateLeadStatusAdmin, signOutAdmin } from "../actions";

type LeadStatus = Database["public"]["Enums"]["lead_status"];
const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "converted", "rejected"];

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminUser(supabase);
  if (!user || !isAdmin) redirect("/admin");

  let leadsQuery = supabase
    .from("leads")
    .select(
      "id, consumer_name, consumer_email, consumer_phone, service_interest, message, status, created_at, business:businesses(name, category)"
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (status) leadsQuery = leadsQuery.eq("status", status as LeadStatus);
  const { data: leads } = await leadsQuery;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AdminNav email={user.email} signOutAction={signOutAdmin} />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Leads</h1>

      <form className="mt-4" action="/admin/leads">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="ml-2 border border-rule-strong px-3 py-2 font-mono text-xs uppercase"
        >
          Filter
        </button>
      </form>

      {!leads?.length ? (
        <p className="mt-8 text-sm text-ink-soft">No leads yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {leads.map((lead) => (
            <li key={lead.id} className="border border-rule-strong p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-ink-soft">
                    {lead.business?.name}
                    {lead.business ? ` · ${CATEGORY_LABELS[lead.business.category]}` : ""}
                  </div>
                  <div className="font-semibold">{lead.consumer_name}</div>
                  <div className="text-sm text-ink-soft">
                    {lead.consumer_email}
                    {lead.consumer_phone ? ` · ${lead.consumer_phone}` : ""}
                  </div>
                  {lead.service_interest ? (
                    <div className="mt-1 text-sm text-ink-soft">Interested in: {lead.service_interest}</div>
                  ) : null}
                  {lead.message ? <p className="mt-2 text-sm">{lead.message}</p> : null}
                  <div className="mt-2 font-mono text-xs text-ink-soft">
                    {new Date(lead.created_at).toLocaleString()}
                  </div>
                </div>
                <form action={updateLeadStatusAdmin.bind(null, lead.id)} className="flex gap-2">
                  <select
                    name="status"
                    defaultValue={lead.status}
                    className="border border-rule-strong bg-paper px-2 py-1 text-sm outline-none focus:border-teal"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="border border-rule-strong px-2 py-1 font-mono text-xs uppercase">
                    Update
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
