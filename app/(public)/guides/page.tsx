import type { Metadata } from "next";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";
import { CATEGORY_LABELS, CATEGORY_TAG_CLASS, type BusinessCategory } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Guides",
  description: `Buying guides for med spas, IV therapy, and men's health clinics from ${SITE_NAME}.`,
  alternates: { canonical: siteUrl("/guides") },
  robots: { index: false, follow: true },
};

const GUIDE_SUBJECTS: Record<BusinessCategory, string> = {
  med_spa: "What to ask before booking injectables, lasers, or a facial — and what fair pricing looks like.",
  iv_therapy: "Reading an IV menu: what's in a drip, which add-ons are worth it, and financing basics.",
  mens_health: "What a first consultation covers, common financing options, and questions worth asking upfront.",
};

export default function GuidesPage() {
  const categories = Object.keys(CATEGORY_LABELS) as BusinessCategory[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="font-mono text-[11px] tracking-wider uppercase text-teal">Guides</div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        One guide per vertical, coming soon
      </h1>
      <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">
        We&apos;d rather ship these once they&apos;re actually useful than publish placeholders.
        Here&apos;s what each one will cover.
      </p>

      <div className="mt-10 grid gap-[1px] border border-rule bg-rule sm:grid-cols-3">
        {categories.map((category) => {
          const tag = CATEGORY_TAG_CLASS[category];
          return (
            <div key={category} className={`border-b-[3px] bg-paper p-6 ${tag.borderBottom}`}>
              <div className={`font-mono text-[11px] tracking-wider uppercase ${tag.text}`}>
                {CATEGORY_LABELS[category]}
              </div>
              <p className="mt-2.5 text-sm text-ink-soft">{GUIDE_SUBJECTS[category]}</p>
              <div className="mt-4 font-mono text-[11px] uppercase text-ink-soft">Coming soon</div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
