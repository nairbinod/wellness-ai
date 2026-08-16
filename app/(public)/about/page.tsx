import Link from "next/link";
import type { Metadata } from "next";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_NAME} is a local wellness & aesthetics directory for med spas, IV therapy, and men's health clinics, with real per-service pricing where providers publish it.`,
  alternates: { canonical: siteUrl("/about") },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="font-mono text-[11px] tracking-wider uppercase text-teal">About</div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        A directory, not a review site
      </h1>
      <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">
        Most local directories rank listings by who pays the most. {SITE_NAME} was built the
        other way around: start with what a provider actually charges, whether they&apos;re
        verified, and whether they take first-time clients — then let people compare on that.
      </p>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">What we index</h2>
        <p className="mt-2.5 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          Med spas, IV therapy clinics, and men&apos;s health clinics — three verticals where
          pricing is notoriously hard to find before you call. Where a provider publishes
          per-service pricing, we show it on the listing next to their trust badges, financing
          options, and consultation types.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Verification, not vibes</h2>
        <p className="mt-2.5 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          A <span className="font-mono text-xs text-teal">Verified</span> badge means the
          business has claimed and confirmed its listing. It is not a paid placement — free,
          verified, and featured listings are visually distinct so it&apos;s always clear which
          is which.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Built to be read by more than people</h2>
        <p className="mt-2.5 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          Every listing ships with structured data (schema.org JSON-LD), and the site publishes
          both a standard sitemap and an{" "}
          <a href={siteUrl("/llms.txt")} className="text-teal hover:underline">
            llms.txt
          </a>{" "}
          for AI agents doing research on a client&apos;s behalf. If you&apos;re a person, that
          mostly means faster, more accurate search results; if you&apos;re an agent, it means
          you don&apos;t have to guess.
        </p>
      </section>

      <section className="mt-10 border border-rule-strong p-6">
        <h2 className="text-lg font-semibold">Run a listed business?</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Claiming your listing is free — it lets you publish pricing, respond to leads, and
          control your own description.
        </p>
        <Link href="/how-it-works" className="mt-3 inline-block text-sm text-teal hover:underline">
          See how claiming works →
        </Link>
      </section>
    </main>
  );
}
