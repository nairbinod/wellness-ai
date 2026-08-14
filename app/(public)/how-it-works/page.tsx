import Link from "next/link";
import type { Metadata } from "next";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "How It Works",
  description: `How ${SITE_NAME} works for people comparing local med spas, IV therapy, and men's health clinics, and for providers claiming a listing.`,
  alternates: { canonical: siteUrl("/how-it-works") },
};

const VISITOR_STEPS = [
  {
    title: "Search or get matched",
    body: "Browse a metro and category directly, or answer a few questions on Get Matched and we'll rank listings against what you told us.",
  },
  {
    title: "Compare on real signal",
    body: "Per-service pricing where it's published, verified and featured badges, financing options, and whether a provider responds to inquiries — side by side.",
  },
  {
    title: "Contact or book directly",
    body: "Reach out through the listing's lead form or booking link. Your request goes straight to that business — we don't resell it.",
  },
];

const PROVIDER_STEPS = [
  {
    title: "Find your listing",
    body: "Most businesses in a launch metro are already indexed. Search your metro and category to find yours.",
  },
  {
    title: "Claim it — free",
    body: "Claiming verifies you're an authorized representative and unlocks editing. It doesn't cost anything and isn't a paid tier.",
  },
  {
    title: "Publish pricing & manage leads",
    body: "Add per-service pricing, financing options, and consultation types, then track and respond to leads from your dashboard.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="font-mono text-[11px] tracking-wider uppercase text-teal">How It Works</div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        Two sides, one registry
      </h1>
      <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">
        {SITE_NAME} works the same way whether you&apos;re comparing providers or you run one.
      </p>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">For visitors</h2>
        <ol className="mt-5 space-y-4">
          {VISITOR_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 border border-rule-strong p-5">
              <div className="flex h-8 w-8 flex-none items-center justify-center border border-rule-strong font-mono text-sm text-ink-soft">
                {i + 1}
              </div>
              <div>
                <div className="font-semibold">{step.title}</div>
                <p className="mt-1 text-sm text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/get-matched" className="mt-4 inline-block text-sm text-teal hover:underline">
          Try Get Matched →
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">For providers</h2>
        <ol className="mt-5 space-y-4">
          {PROVIDER_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 border border-rule-strong p-5">
              <div className="flex h-8 w-8 flex-none items-center justify-center border border-rule-strong font-mono text-sm text-ink-soft">
                {i + 1}
              </div>
              <div>
                <div className="font-semibold">{step.title}</div>
                <p className="mt-1 text-sm text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="text-lg font-semibold">Listing tiers</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex gap-3">
            <dt className="w-24 flex-none font-mono text-xs uppercase text-ink-soft">Free</dt>
            <dd className="text-ink-soft">Indexed, searchable, and claimable by default.</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 flex-none font-mono text-xs uppercase text-teal">Verified</dt>
            <dd className="text-ink-soft">Claimed and confirmed by the business.</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 flex-none font-mono text-xs uppercase text-gold">Featured</dt>
            <dd className="text-ink-soft">
              Prioritized placement in category and homepage listings.
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
