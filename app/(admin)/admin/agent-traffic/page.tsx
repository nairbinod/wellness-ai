import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";
import { isoDaysAgo } from "@/lib/dates";
import { AdminNav } from "@/components/admin-nav";
import { signOutAdmin } from "../actions";

export default async function AdminAgentTrafficPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminUser(supabase);
  if (!user || !isAdmin) redirect("/admin");

  const since = isoDaysAgo(30);
  const { data: recent } = await supabase
    .from("agent_traffic_log")
    .select("bot_name, path, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(2000);

  const counts = new Map<string, number>();
  for (const row of recent ?? []) counts.set(row.bot_name, (counts.get(row.bot_name) ?? 0) + 1);
  const sortedCounts = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AdminNav email={user.email} signOutAction={signOutAdmin} />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Agent Traffic</h1>
      <p className="mt-1 text-sm text-ink-soft">AI crawler hits over the last 30 days.</p>

      {!sortedCounts.length ? (
        <p className="mt-8 text-ink-soft">No agent traffic logged yet.</p>
      ) : (
        <>
          <div className="mt-8 grid gap-[1px] border border-rule bg-rule sm:grid-cols-3">
            {sortedCounts.map(([bot, count]) => (
              <div key={bot} className="bg-paper p-5">
                <div className="font-mono text-[11px] tracking-wider uppercase text-teal">{bot}</div>
                <div className="mt-2 font-mono text-2xl font-bold">{count}</div>
                <div className="text-xs text-ink-soft">hits, last 30 days</div>
              </div>
            ))}
          </div>

          <h2 className="mt-10 font-semibold">Recent hits</h2>
          <ul className="mt-3 divide-y divide-rule border border-rule-strong text-sm">
            {(recent ?? []).slice(0, 50).map((row, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex-none font-mono text-xs text-teal">{row.bot_name}</span>
                <span className="flex-1 truncate text-ink-soft">{row.path}</span>
                <span className="flex-none font-mono text-xs text-ink-soft">
                  {new Date(row.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
