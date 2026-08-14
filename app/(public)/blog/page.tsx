import type { Metadata } from "next";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Blog",
  description: `Pricing reports, new-market launches, and provider spotlights from ${SITE_NAME}.`,
  alternates: { canonical: siteUrl("/blog") },
  robots: { index: false, follow: true },
};

const PLANNED_TOPICS = [
  "What med spas actually charge, metro by metro",
  "IV therapy pricing: what's normal and what's a markup",
  "How to vet a men's health clinic before your first visit",
  "New metro launch notes",
];

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="font-mono text-[11px] tracking-wider uppercase text-teal">Blog</div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        First post is in progress
      </h1>
      <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">
        We&apos;re holding off on publishing until we have real pricing data across enough
        metros to say something useful. Subscribe below and it&apos;ll land in your inbox first.
      </p>

      <div className="mt-10 border border-rule-strong p-6">
        <h2 className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
          What we&apos;re planning to cover
        </h2>
        <ul className="mt-4 space-y-3">
          {PLANNED_TOPICS.map((topic) => (
            <li key={topic} className="border-b border-rule pb-3 text-sm text-ink-soft last:border-0 last:pb-0">
              {topic}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
