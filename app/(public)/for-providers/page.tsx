import Link from "next/link";
import type { Metadata } from "next";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "For Providers",
  description: `Claim your listing on ${SITE_NAME}, the wellness & aesthetics directory for med spas, IV therapy, and men's health clinics — free to claim, $99/mo flat for Featured placement.`,
  alternates: { canonical: siteUrl("/for-providers") },
};

const sectionHeading = "text-lg font-semibold";
const sectionBody = "mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft";

export default function ForProvidersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="font-mono text-[11px] tracking-wider uppercase text-teal">For Providers</div>
      <h1 className="mt-3 max-w-[22ch] text-2xl font-semibold tracking-tight sm:text-3xl">
        Get in front of patients who are already looking for you
      </h1>
      <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">
        {SITE_NAME} only covers three verticals — med spas, IV/infusion therapy, and men&apos;s
        health &amp; TRT clinics. We&apos;re not a generic everything-directory competing for
        attention across every kind of local business; everyone who lands on a listing here
        searched specifically for a treatment in your category.
      </p>

      <section className="mt-12">
        <h2 className={sectionHeading}>This is live today, not a pitch deck</h2>
        <p className={sectionBody}>
          {SITE_NAME} is a real, indexed site right now — 1,450+ real business listings across
          Dallas, Austin, and Atlanta, with 438 of them already publishing real per-service
          pricing pulled from their own sites. Every listing page is server-rendered with
          structured data (schema.org JSON-LD) that search engines and AI assistants like ChatGPT
          and Claude can read directly — most local directories don&apos;t build for that at all.
        </p>
      </section>

      <section className="mt-8">
        <h2 className={sectionHeading}>Why claim now, not later</h2>
        <p className={sectionBody}>
          We&apos;re early, and that cuts in your favor. Search and AI-agent citation activity
          compounds slowly — it takes months of a listing being live, claimed, and accurate before
          it shows up in results consistently. Claiming and publishing real pricing now means
          you&apos;re already established in your metro by the time this market gets competitive,
          instead of catching up after it does.
        </p>
      </section>

      <section className="mt-8 border border-rule-strong p-6">
        <h2 className={sectionHeading}>Flat-rate pricing — no per-lead fees, no bidding</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
              Claimed
            </div>
            <div className="mt-1 font-mono text-2xl font-bold">Free</div>
            <p className="mt-1.5 text-sm text-ink-soft">
              Verify you&apos;re the owner, edit your info, publish real pricing, and respond to
              leads from your dashboard.
            </p>
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-wider uppercase text-teal">
              Featured
            </div>
            <div className="mt-1 font-mono text-2xl font-bold">$99/mo</div>
            <p className="mt-1.5 text-sm text-ink-soft">
              Priority placement on the homepage and in your metro&apos;s category results.
              Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className={sectionHeading}>Already listed?</h2>
        <p className={sectionBody}>
          Most businesses in a launch metro are already indexed.{" "}
          <Link href="/search" className="text-teal hover:underline">
            Search your metro and category
          </Link>{" "}
          to find your listing and claim it directly — it&apos;s faster than the form below.
        </p>
      </section>

      <section className="mt-12 border-t border-rule pt-10">
        <h2 className={sectionHeading}>Not listed yet, or have a question?</h2>
        <p className={sectionBody}>
          Tell us about your business and we&apos;ll help you get claimed and set up.
        </p>
        <div className="mt-6 max-w-md">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
