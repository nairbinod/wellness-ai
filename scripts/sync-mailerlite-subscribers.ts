// Pushes unclaimed businesses with a known email address into MailerLite as
// subscribers, so the "claim your listing" newsletter can be built and sent
// from MailerLite's own editor/infrastructure — kept separate from
// primenearby.com's transactional sending domain (lead notifications, magic
// links) so a cold-outreach campaign can't damage that domain's reputation.
//
// This script only syncs subscriber data. It does not create or send a
// campaign — do that in the MailerLite dashboard once the group is
// populated, using the custom fields synced here ({$name}, {$city},
// {$listing_url}, {$category}) for personalization.
//
// Usage:
//   npm run sync:mailerlite -- [--dry-run] [--limit=N] [--metro=<slug>]
//
// Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
// MAILERLITE_API_KEY in .env.local.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
import type { Database } from "../lib/types/database";
import { CATEGORY_LABELS, CATEGORY_SLUGS } from "../lib/categories";

const SITE_URL = "https://primenearby.com";
const GROUP_NAME = "PrimeNearby - Unclaimed Listings";
const MAILERLITE_API = "https://connect.mailerlite.com/api";

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

async function mailerliteFetch(path: string, init: RequestInit, apiKey: string) {
  const res = await fetch(`${MAILERLITE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`MailerLite ${init.method ?? "GET"} ${path} failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function getOrCreateGroupId(apiKey: string): Promise<string> {
  const list = await mailerliteFetch(`/groups?filter[name]=${encodeURIComponent(GROUP_NAME)}`, {}, apiKey);
  const existing = list.data?.find((g: { name: string }) => g.name === GROUP_NAME);
  if (existing) return existing.id;

  const created = await mailerliteFetch(
    "/groups",
    { method: "POST", body: JSON.stringify({ name: GROUP_NAME }) },
    apiKey
  );
  return created.data.id;
}

async function main() {
  const { dryRun, limit, metro } = parseArgs(process.argv.slice(2));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mailerliteKey = process.env.MAILERLITE_API_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  if (!mailerliteKey) {
    throw new Error("Missing MAILERLITE_API_KEY in .env.local");
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

  const { data: businesses, error } = await query;
  if (error) throw new Error(`Failed to load businesses: ${error.message}`);
  if (!businesses?.length) {
    console.log("No unclaimed businesses with an email to sync.");
    return;
  }

  console.log(`Syncing ${businesses.length} businesses to MailerLite (dryRun=${dryRun})...\n`);

  const groupId = dryRun ? null : await getOrCreateGroupId(mailerliteKey);

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
      await mailerliteFetch(
        "/subscribers",
        {
          method: "POST",
          body: JSON.stringify({
            email: business.email,
            fields: {
              name: business.name,
              city: business.city,
              state: business.state,
              listing_url: listingUrl,
              category: CATEGORY_LABELS[business.category],
            },
            groups: [groupId],
          }),
        },
        mailerliteKey
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
