// Email extraction pipeline — visits each business's own website and pulls
// any published contact email (mailto: links, plain-text addresses), the
// same thing a third-party "email extractor" tool does, built in-house so
// it can run against every listing in one pass instead of one URL at a time
// through a web form. Pure HTTP + regex, no LLM/API cost involved.
//
// Usage:
//   npm run extract:emails -- [--dry-run] [--limit=N] [--concurrency=N] [--metro=<slug>]
//
// Examples:
//   npm run extract:emails -- --dry-run --limit=20
//   npm run extract:emails -- --metro=dallas --concurrency=15
//   npm run extract:emails
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
// .env.local. Only processes businesses that have a website and don't
// already have an email on file.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
import type { Database } from "../lib/types/database";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Junk we never want to treat as a business's contact email — CDN/analytics/
// platform boilerplate that shows up in a lot of page source, and automated
// senders that are useless for outreach even though they're real addresses.
const JUNK_DOMAINS = [
  "sentry.io",
  "wixpress.com",
  "godaddy.com",
  "example.com",
  "schema.org",
  "w3.org",
  "gstatic.com",
  "googleapis.com",
  "google.com",
  "cloudflare.com",
  "letsencrypt.org",
  "yourdomain.com",
  "domain.com",
  "sentry.wixpress.com",
  "wordpress.org",
  "godaddy.com",
];
const JUNK_LOCAL_PREFIXES = ["noreply", "no-reply", "donotreply", "do-not-reply", "mailer-daemon", "postmaster"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];

function isJunkEmail(email: string) {
  const lower = email.toLowerCase();
  const [local, domain] = lower.split("@");
  if (!domain) return true;
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
  if (JUNK_DOMAINS.some((junk) => domain === junk || domain.endsWith(`.${junk}`))) return true;
  if (JUNK_LOCAL_PREFIXES.some((prefix) => local.startsWith(prefix))) return true;
  return false;
}

function extractEmails(html: string): string[] {
  const found = new Set<string>();

  // mailto: links first — these are the most deliberately "this is our
  // contact email" signal a page can give, vs. an address that just happens
  // to appear in a tracking script or a customer testimonial.
  const mailtoMatches = html.matchAll(/mailto:([^"'?\s>]+)/gi);
  for (const m of mailtoMatches) found.add(decodeURIComponent(m[1]));

  const plainMatches = html.match(EMAIL_REGEX) ?? [];
  for (const m of plainMatches) found.add(m);

  return [...found].filter((e) => !isJunkEmail(e));
}

function hostOf(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

// Prefer an address on the business's own domain over a third-party one
// (embedded chat widgets, ad pixels, etc. can leave stray addresses behind)
// — but plenty of small businesses just use a personal Gmail, so fall back
// to the first real match rather than requiring a domain match.
function pickBestEmail(emails: string[], websiteHost: string | null): string | null {
  if (!emails.length) return null;
  if (websiteHost) {
    const sameDomain = emails.find((e) => e.toLowerCase().endsWith(`@${websiteHost}`));
    if (sameDomain) return sameDomain;
  }
  return emails[0];
}

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PrimeNearbyBot/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function runPool<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function runNext(): Promise<void> {
    const i = next++;
    if (i >= items.length) return;
    results[i] = await worker(items[i]);
    return runNext();
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runNext));
  return results;
}

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
    concurrency: typeof args.concurrency === "string" ? parseInt(args.concurrency, 10) : 15,
    metro: typeof args.metro === "string" ? args.metro : undefined,
  };
}

async function main() {
  const { dryRun, limit, concurrency, metro } = parseArgs(process.argv.slice(2));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
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
    .select("id, name, website")
    .not("website", "is", null)
    .is("email", null);
  if (metroId) query = query.eq("metro_id", metroId);
  if (limit) query = query.limit(limit);

  const { data: businesses, error } = await query;
  if (error) throw new Error(`Failed to load businesses: ${error.message}`);
  if (!businesses?.length) {
    console.log("No businesses need email extraction (all have one, or none have a website).");
    return;
  }

  console.log(
    `Processing ${businesses.length} businesses (concurrency=${concurrency}, dryRun=${dryRun})...\n`
  );

  let found = 0;
  let notFound = 0;
  let errored = 0;

  await runPool(businesses, concurrency, async (business) => {
    try {
      const html = await fetchWithTimeout(business.website!, 10000);
      const emails = extractEmails(html);
      const best = pickBestEmail(emails, hostOf(business.website!));

      if (!best) {
        notFound++;
        console.log(`  - ${business.name}: no email found`);
        return;
      }

      found++;
      console.log(`  + ${business.name}: ${best}`);
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from("businesses")
          .update({ email: best })
          .eq("id", business.id);
        if (updateError) console.error(`    ! failed to save for ${business.name}: ${updateError.message}`);
      }
    } catch (err) {
      errored++;
      console.log(`  ! ${business.name}: ${(err as Error).message}`);
    }
  });

  console.log(
    `\nDone. ${found} emails found, ${notFound} not found, ${errored} errored (out of ${businesses.length}).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
