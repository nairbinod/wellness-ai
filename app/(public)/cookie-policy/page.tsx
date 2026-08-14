import type { Metadata } from "next";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `How ${SITE_NAME} uses cookies.`,
  alternates: { canonical: siteUrl("/cookie-policy") },
};

const h2 = "mt-8 text-lg font-semibold";
const p = "mt-2.5 max-w-[65ch] text-sm leading-relaxed text-ink-soft";

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="font-mono text-[11px] tracking-wider uppercase text-teal">Legal</div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Cookie Policy</h1>
      <p className="mt-2 font-mono text-xs text-ink-soft">Effective August 12, 2026</p>

      <p className={p}>
        {SITE_NAME} keeps cookies to the minimum needed to run the site. We don&apos;t use
        advertising or cross-site tracking cookies.
      </p>

      <h2 className={h2}>Essential cookies</h2>
      <p className={p}>
        Used to keep you signed in to your dashboard or admin session (via Supabase Auth) and to
        protect forms from cross-site request forgery. These are required for the site to
        function and can&apos;t be disabled without breaking sign-in.
      </p>

      <h2 className={h2}>What we don&apos;t use</h2>
      <p className={p}>
        No third-party advertising cookies, no cross-site behavioral tracking, and no sale of
        cookie-derived data to third parties.
      </p>

      <h2 className={h2}>Managing cookies</h2>
      <p className={p}>
        Most browsers let you block or delete cookies in their settings. Blocking essential
        cookies will prevent signed-in features like the business dashboard and admin panel from
        working.
      </p>

      <h2 className={h2}>Contact</h2>
      <p className={p}>
        Questions about this policy —{" "}
        <a href="mailto:privacy@primenearby.com" className="text-teal hover:underline">
          privacy@primenearby.com
        </a>
        .
      </p>
    </main>
  );
}
