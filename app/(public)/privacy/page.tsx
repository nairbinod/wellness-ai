import type { Metadata } from "next";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses, and protects your information.`,
  alternates: { canonical: siteUrl("/privacy") },
};

const h2 = "mt-8 text-lg font-semibold";
const p = "mt-2.5 max-w-[65ch] text-sm leading-relaxed text-ink-soft";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="font-mono text-[11px] tracking-wider uppercase text-teal">Legal</div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Privacy Policy</h1>
      <p className="mt-2 font-mono text-xs text-ink-soft">Effective August 12, 2026</p>

      <p className={p}>
        This policy explains what {SITE_NAME} collects, why, and who it&apos;s shared with. It
        applies to everyone who uses the site, whether or not you create an account.
      </p>

      <h2 className={h2}>Information we collect</h2>
      <p className={p}>
        <span className="font-medium text-ink">Contact form submissions.</span> When you send a
        lead to a listed business, we collect your name, email, phone number (if provided), and
        message, and store which business it was sent to.
      </p>
      <p className={p}>
        <span className="font-medium text-ink">Newsletter subscriptions.</span> Just your email
        address, stored until you unsubscribe.
      </p>
      <p className={p}>
        <span className="font-medium text-ink">Account &amp; claim data.</span> If you claim a
        business listing, we collect the email you sign in with and associate it with that
        listing so you can manage it.
      </p>
      <p className={p}>
        <span className="font-medium text-ink">Usage data.</span> Standard server logs (IP
        address, user agent, pages requested) for security and reliability — we don&apos;t run
        third-party ad trackers.
      </p>

      <h2 className={h2}>How we use it</h2>
      <p className={p}>
        Contact form submissions are forwarded only to the specific business you contacted —
        never sold or shared with other businesses. Newsletter emails are used solely to send
        the updates you signed up for. Account data is used to authenticate you and scope what
        you can edit.
      </p>

      <h2 className={h2}>Who we share it with</h2>
      <p className={p}>
        We use Supabase for database hosting, authentication, and file storage, and Google
        Places to source initial listing data. These providers process data on our behalf under
        their own security commitments; we don&apos;t sell personal information to data
        brokers or advertisers.
      </p>

      <h2 className={h2}>Your choices</h2>
      <p className={p}>
        Unsubscribe from the newsletter at any time using the link in any email. To access,
        correct, or delete personal information we hold about you, contact us using the details
        below.
      </p>

      <h2 className={h2}>Changes to this policy</h2>
      <p className={p}>
        If this policy changes materially, we&apos;ll update the effective date above.
        Continued use of the site after a change means you accept the updated policy.
      </p>

      <h2 className={h2}>Contact</h2>
      <p className={p}>
        Questions about this policy or your data —{" "}
        <a href="mailto:privacy@primenearby.com" className="text-teal hover:underline">
          privacy@primenearby.com
        </a>
        .
      </p>
    </main>
  );
}
