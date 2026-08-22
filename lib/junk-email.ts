// Shared junk-email detection used by both the extraction pipeline
// (scripts/extract-emails.ts, filtering what gets saved to businesses.email)
// and the newsletter sync (scripts/sync-sender-subscribers.ts, filtering what
// gets pushed to an ESP — a bad address there just bounces and drags down
// sender reputation, so it's worth a second pass even on already-saved data).
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
  "mysite.com",
  "yoursite.com",
  "company.com",
  "yourcompany.com",
  "email.com",
  "test.com",
];

const JUNK_LOCAL_PREFIXES = ["noreply", "no-reply", "donotreply", "do-not-reply", "mailer-daemon", "postmaster"];

// Exact local-part matches — generic template/placeholder text that shows up
// in page boilerplate ("Contact: example@mysite.com") rather than a real
// address, distinct from JUNK_LOCAL_PREFIXES (which matches a prefix of a
// real-looking local part like "noreply-alerts@...").
const JUNK_LOCAL_EXACT = ["example", "test", "yourname", "firstname", "lastname", "first.last", "name", "someone", "sample", "user"];

// Non-email file references that regex extraction occasionally misreads as
// an email (e.g. an image srcset entry like "photo@2x.jpg", or a bundled
// asset filename sitting next to an @ in minified source).
const FILE_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".ico",
  ".css", ".js", ".json", ".woff", ".woff2", ".ttf", ".mp4", ".pdf",
];

export function isJunkEmail(email: string) {
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split("@");
  if (!local || !domain) return true;
  if (FILE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
  if (JUNK_DOMAINS.some((junk) => domain === junk || domain.endsWith(`.${junk}`))) return true;
  if (JUNK_LOCAL_PREFIXES.some((prefix) => local.startsWith(prefix))) return true;
  if (JUNK_LOCAL_EXACT.includes(local)) return true;
  // Unicode/URL-encoding artifacts left over from malformed HTML parsing
  // (e.g. "u002F@..." from a mis-decoded "/"), and stray "%"/"&" that
  // shouldn't appear in a real local part.
  if (/^u[0-9a-f]{4}$/i.test(local)) return true;
  if (/[%&]/.test(local)) return true;
  return false;
}
