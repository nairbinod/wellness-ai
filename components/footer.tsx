import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME, siteUrl } from "@/lib/jsonld";
import { CATEGORY_LABELS, CATEGORY_SLUGS, type BusinessCategory } from "@/lib/categories";
import { NewsletterForm } from "@/components/newsletter-form";

const RESOURCE_LINKS = [
  { label: "Blog", href: "/blog" },
  { label: "Guides", href: "/guides" },
  { label: "FAQ", href: "/faq" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "For Providers", href: "/for-providers" },
];
const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

export async function Footer() {
  const supabase = await createClient();
  const { data: metros } = await supabase
    .from("metros")
    .select("slug, name")
    .order("name")
    .limit(6);

  const categories = Object.keys(CATEGORY_LABELS) as BusinessCategory[];

  return (
    <footer className="mt-auto border-t border-rule">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center gap-6 border border-rule-strong p-7">
          <div className="flex-1 min-w-[220px]">
            <h2 className="text-lg font-semibold">Get new metros before they&apos;re announced</h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Pricing report drops, new market launches, provider spotlights. A few sends a
              month.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-10">
        <div className="grid gap-7 border-t border-ink pt-9 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="font-mono text-base font-bold">{SITE_NAME}</div>
            <p className="mt-2.5 max-w-[26ch] text-xs leading-relaxed text-ink-soft">
              The local wellness &amp; aesthetics directory — med spas, IV therapy, and men&apos;s
              health clinics, with real pricing where providers publish it.
            </p>
            <div className="mt-3.5 font-mono text-[11px] text-ink-soft">
              Built for agents too —{" "}
              <a href={siteUrl("/llms.txt")} className="text-teal hover:underline">
                llms.txt
              </a>{" "}
              ·{" "}
              <a href={siteUrl("/sitemap.xml")} className="text-teal hover:underline">
                sitemap.xml
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
              Directory
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {metros?.map((metro) => (
                <li key={metro.slug}>
                  <Link href={`/${metro.slug}`} className="text-sm hover:text-teal hover:underline">
                    {metro.name}
                  </Link>
                </li>
              ))}
              {metros?.[0]
                ? categories.map((category) => (
                    <li key={category}>
                      <Link
                        href={`/${metros[0].slug}/${CATEGORY_SLUGS[category]}`}
                        className="text-sm hover:text-teal hover:underline"
                      >
                        {CATEGORY_LABELS[category]}
                      </Link>
                    </li>
                  ))
                : null}
              <li>
                <Link href="/get-matched" className="text-sm hover:text-teal hover:underline">
                  Get Matched
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
              Resources
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-teal hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
              Legal
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-teal hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-between gap-2.5 border-t border-rule pt-5 text-xs text-ink-soft">
          <span>
            © {new Date().getFullYear()} {SITE_NAME}
          </span>
          <span>{metros?.length ?? 0} metros · 3 verticals</span>
          <span className="font-mono">
            {process.env.NEXT_PUBLIC_BUILD_SHA} · updated{" "}
            {new Date(process.env.NEXT_PUBLIC_BUILD_TIME ?? "1970-01-01T00:00:00.000Z").toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </footer>
  );
}
