// Pushes unclaimed businesses with a known email address into Sender.net as
// subscribers, so the "claim your listing" newsletter can be built and sent
// from Sender's own infrastructure — kept separate from primenearby.com's
// transactional sending domain (lead notifications, magic links) so a
// cold-outreach campaign can't damage that domain's reputation.
//
// Sender.net was chosen over MailerLite after MailerLite's free-plan
// subscriber cap blocked syncing the full list mid-run (see MAILERLITE_API_KEY
// history) — Sender's free tier covers 2,500 subscribers / 15,000 emails
// per month, well above the ~651 businesses with an extracted email.
//
// This script only syncs subscriber data. It does not create or send a
// campaign — do that in the Sender.net dashboard once the group is
// populated, using the custom fields synced here ({{business_name}},
// {{city}}, {{listing_url}}, {{category}}) for personalization.
//
// Usage:
//   npm run sync:sender -- [--dry-run] [--limit=N] [--metro=<slug>]
//
// Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
// SENDER_API_KEY in .env.local.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
import type { Database } from "../lib/types/database";
import { CATEGORY_LABELS, CATEGORY_SLUGS } from "../lib/categories";
import { isJunkEmail } from "../lib/junk-email";

const SITE_URL = "https://primenearby.com";
const GROUP_TITLE = "PrimeNearby - Unclaimed Listings";
const SENDER_API = "https://api.sender.net/v2";

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const [key, value] = raw.slice(2).split("=");
    args[key] = value ?? true;
  }
  return {
    dryRun: Boolean(args["dry-run"]),
    limit: typeof args.limit === "string" ? parseInt(args.limit, 10) : undefined,
    metro: typeof args.metro === "string" ? args.metro : undefined,
  };
}

async function senderFetch(path: string, init: RequestInit, apiKey: string) {
  const res = await fetch(`${SENDER_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Sender ${init.method ?? "GET"} ${path} failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function getOrCreateGroupId(apiKey: string): Promise<string> {
  const list = await senderFetch("/groups", {}, apiKey);
  const existing = list.data?.find((g: { title: string }) => g.title === GROUP_TITLE);
  if (existing) return existing.id;

  const created = await senderFetch(
    "/groups",
    { method: "POST", body: JSON.stringify({ title: GROUP_TITLE }) },
    apiKey
  );
  return created.data.id;
}

async function main() {
  const { dryRun, limit, metro } = parseArgs(process.argv.slice(2));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const senderKey = process.env.SENDER_API_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  if (!senderKey) {
    throw new Error("Missing SENDER_API_KEY in .env.local");
  }
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  let metroId: string | undefined;
  if (metro) {
    const { data } = await supabase.from("metros").select("id").eq("slug", metro).maybeSingle();
    if (!data) throw new Error(`No metro found for slug "${metro}"`);
    metroId = data.id;
  }

  let query = supabase
    .from("businesses")
    .select("id, name, slug, city, state, category, email, metro:metros(slug)")
    .not("email", "is", null)
    .is("claimed_by", null);
  if (metroId) query = query.eq("metro_id", metroId);
  if (limit) query = query.limit(limit);

  const { data: rows, error } = await query;
  if (error) throw new Error(`Failed to load businesses: ${error.message}`);
  if (!rows?.length) {
    console.log("No unclaimed businesses with an email to sync.");
    return;
  }

  const businesses = rows.filter((b) => !isJunkEmail(b.email!));
  const skipped = rows.length - businesses.length;
  if (skipped) {
    console.log(`Skipping ${skipped} address(es) that don't look like real business emails:`);
    for (const b of rows) {
      if (isJunkEmail(b.email!)) console.log(`  - ${b.email} (${b.name})`);
    }
    console.log();
  }
  if (!businesses.length) {
    console.log("Nothing left to sync after filtering.");
    return;
  }

  console.log(`Syncing ${businesses.length} businesses to Sender.net (dryRun=${dryRun})...\n`);

  const groupId = dryRun ? null : await getOrCreateGroupId(senderKey);

  let synced = 0;
  let errored = 0;

  for (const business of businesses) {
    const metroSlug = business.metro?.slug;
    const categorySlug = CATEGORY_SLUGS[business.category];
    const listingUrl = metroSlug ? `${SITE_URL}/${metroSlug}/${categorySlug}/${business.slug}` : SITE_URL;

    if (dryRun) {
      console.log(`  + ${business.email} — ${business.name} (${listingUrl})`);
      synced++;
      continue;
    }

    try {
      await senderFetch(
        "/subscribers",
        {
          method: "POST",
          body: JSON.stringify({
            email: business.email,
            groups: [groupId],
            fields: {
              business_name: business.name,
              city: business.city,
              state: business.state,
              listing_url: listingUrl,
              category: CATEGORY_LABELS[business.category],
            },
          }),
        },
        senderKey
      );
      console.log(`  + ${business.email} — ${business.name}`);
      synced++;
    } catch (err) {
      errored++;
      console.log(`  ! ${business.email} — ${(err as Error).message}`);
    }
  }

  console.log(`\nDone. ${synced} synced, ${errored} errored (out of ${businesses.length}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
