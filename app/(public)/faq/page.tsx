import Link from "next/link";
import type { Metadata } from "next";
import { siteUrl, SITE_NAME, faqPageSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Common questions about how ${SITE_NAME} verifies listings, matches visitors, and works for providers.`,
  alternates: { canonical: siteUrl("/faq") },
};

const FAQS = [
  {
    q: "Is it free to use?",
    a: "Yes. Searching, comparing pricing, using Get Matched, and contacting a provider through a listing are all free, with no account required.",
  },
  {
    q: "What does a “Verified” badge mean?",
    a: "It means the business claimed its listing and confirmed its own details — name, contact info, and services. It isn't a paid placement; free, verified, and featured listings are visually distinct so it's always clear which is which.",
  },
  {
    q: "Is the pricing accurate?",
    a: "Pricing shown on a listing is published by the business itself, either when we import it or after they claim and edit their listing. If a price looks out of date, use the listing's contact form to ask before booking.",
  },
  {
    q: "How does Get Matched work?",
    a: "You answer a few questions — metro, category, whether you're a first-time client, financing needs, and preferred consultation type — and we rank listings in that metro against your answers, showing why each one matched.",
  },
  {
    q: "I run a business that's listed. How do I claim it?",
    a: "Find your listing and open its claim page. Claiming is free and verifies you're an authorized representative; once claimed, you can edit your description, pricing, financing options, and respond to leads from your dashboard.",
  },
  {
    q: "My business isn't listed at all — can I add it?",
    a: "Reach out through the For Providers link in the footer with your business name, city, and category, and we'll get it added to the next import for your metro.",
  },
  {
    q: "Do you sell my contact info to multiple businesses?",
    a: "No. When you submit a lead form, it goes to that one business only. See the Privacy Policy for the full detail on what we collect and how it's used.",
  },
  {
    q: "Which cities do you cover?",
    a: "We're adding metros incrementally — the current list is on the homepage under “Browse by metro.” If your city isn't there yet, use Get Matched or check back as we expand.",
  },
];

export default function FaqPage() {
  const jsonLd = faqPageSchema(FAQS);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="font-mono text-[11px] tracking-wider uppercase text-teal">FAQ</div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        Frequently asked questions
      </h1>
      <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">
        Can&apos;t find what you&apos;re after? See{" "}
        <Link href="/how-it-works" className="text-teal hover:underline">
          How It Works
        </Link>{" "}
        for the full walkthrough.
      </p>

      <div className="mt-10 border-t border-rule">
        {FAQS.map((item) => (
          <details key={item.q} className="group border-b border-rule py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold marker:content-none">
              <span>{item.q}</span>
              <span
                aria-hidden
                className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center border border-rule-strong font-mono text-xs text-ink-soft transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-soft">{item.a}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
