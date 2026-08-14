import type { Metadata } from "next";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that govern use of ${SITE_NAME}.`,
  alternates: { canonical: siteUrl("/terms") },
};

const h2 = "mt-8 text-lg font-semibold";
const p = "mt-2.5 max-w-[65ch] text-sm leading-relaxed text-ink-soft";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="font-mono text-[11px] tracking-wider uppercase text-teal">Legal</div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Terms of Service</h1>
      <p className="mt-2 font-mono text-xs text-ink-soft">Effective August 12, 2026</p>

      <p className={p}>
        These terms govern your use of {SITE_NAME}. By using the site, you agree to them. If you
        don&apos;t agree, please don&apos;t use the site.
      </p>

      <h2 className={h2}>What {SITE_NAME} is</h2>
      <p className={p}>
        {SITE_NAME} is a directory of med spa, IV therapy, and men&apos;s health businesses. We
        aggregate and, where claimed, publish information provided by those businesses. We are
        not a party to any transaction between you and a listed business, and we don&apos;t
        provide medical advice — content on the site is informational, not a substitute for
        professional judgment.
      </p>

      <h2 className={h2}>Using the site</h2>
      <p className={p}>
        You agree not to scrape the site at abusive volume, attempt to bypass access controls,
        submit false information through contact forms or the claim flow, or use listed
        businesses&apos; contact details for unsolicited bulk outreach.
      </p>

      <h2 className={h2}>Claiming a listing</h2>
      <p className={p}>
        By claiming a listing, you represent that you&apos;re authorized to act on that
        business&apos;s behalf and that the information you submit is accurate. We may remove or
        revert a claim we believe to be false or unauthorized.
      </p>

      <h2 className={h2}>Listing accuracy</h2>
      <p className={p}>
        We make a reasonable effort to keep listing information current, but pricing, hours, and
        availability are ultimately set by each business and can change without notice. Confirm
        details directly with a business before booking.
      </p>

      <h2 className={h2}>Disclaimer &amp; limitation of liability</h2>
      <p className={p}>
        The site is provided &quot;as is&quot; without warranties of any kind. To the extent
        permitted by law, {SITE_NAME} isn&apos;t liable for damages arising from your use of the
        site or your dealings with any listed business.
      </p>

      <h2 className={h2}>Changes</h2>
      <p className={p}>
        We may update these terms as the product changes. Material changes will update the
        effective date above.
      </p>

      <h2 className={h2}>Contact</h2>
      <p className={p}>
        Questions about these terms —{" "}
        <a href="mailto:legal@primenearby.com" className="text-teal hover:underline">
          legal@primenearby.com
        </a>
        .
      </p>
    </main>
  );
}
