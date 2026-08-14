import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";
import { CATEGORY_LABELS, CATEGORY_SLUGS, CATEGORY_TAG_CLASS, type BusinessCategory } from "@/lib/categories";
import { getFeaturedBusinesses, primaryPhoto } from "@/lib/search";
import { priceTier } from "@/lib/pricing";
import { ListingCard } from "@/components/listing-card";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl("/") },
};

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: metros }, { count: businessCount }, featured] = await Promise.all([
    supabase.from("metros").select("slug, name, state").order("name"),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    getFeaturedBusinesses(supabase),
  ]);

  const categories = Object.keys(CATEGORY_LABELS) as BusinessCategory[];
  const categoryCounts = await Promise.all(
    categories.map((category) =>
      supabase.from("businesses").select("id", { count: "exact", head: true }).eq("category", category)
    )
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="border border-rule bg-paper-raised px-9 py-11">
        <div className="font-mono text-[11px] tracking-wider uppercase text-teal">
          {SITE_NAME} — Local Wellness &amp; Aesthetics Registry
        </div>
        <h1 className="mt-3 max-w-[18ch] text-3xl font-semibold tracking-tight sm:text-4xl">
          Find med spas, IV therapy, and men&apos;s health clinics near you
        </h1>
        <p className="mt-3 max-w-[52ch] text-[15px] text-ink-soft">
          Real per-service pricing where providers publish it. Verified listings. Structured
          data any AI agent can read.
        </p>

        <form className="mt-7 flex max-w-[560px] border border-rule-strong bg-paper" action="/search">
          <span className="hidden items-center border-r border-rule-strong px-3.5 text-sm text-ink-soft sm:flex">
            Query
          </span>
          <input
            type="text"
            name="q"
            placeholder="med spas in Dallas"
            className="flex-1 bg-transparent px-3.5 py-3.5 text-sm outline-none"
          />
          <button
            type="submit"
            className="border-l border-rule-strong bg-teal px-6 font-mono text-xs tracking-wider uppercase text-teal-ink"
          >
            Search
          </button>
        </form>

        <p className="mt-3 text-sm text-ink-soft">
          Not sure where to start?{" "}
          <Link href="/get-matched" className="text-teal hover:underline">
            Answer a few questions and get matched
          </Link>
          .
        </p>

        <div className="mt-8 flex flex-wrap gap-8">
          <div>
            <div className="font-mono text-lg font-semibold">{metros?.length ?? 0}</div>
            <div className="text-xs text-ink-soft">Launch metros</div>
          </div>
          <div>
            <div className="font-mono text-lg font-semibold">{businessCount ?? 0}</div>
            <div className="text-xs text-ink-soft">Listings indexed</div>
          </div>
          <div>
            <div className="font-mono text-lg font-semibold">100%</div>
            <div className="text-xs text-ink-soft">Server-rendered listings</div>
          </div>
        </div>
      </div>

      {/* Category index */}
      <div className="mt-14 grid gap-[1px] border border-rule bg-rule sm:grid-cols-3">
        {categories.map((category, i) => {
          const tag = CATEGORY_TAG_CLASS[category];
          return (
            <Link
              key={category}
              href={metros?.[0] ? `/${metros[0].slug}/${CATEGORY_SLUGS[category]}` : "/search"}
              className={`border-b-[3px] bg-paper p-6 hover:bg-paper-raised ${tag.borderBottom}`}
            >
              <div className={`font-mono text-[11px] tracking-wider uppercase ${tag.text}`}>
                Vertical
              </div>
              <div className="mt-2 text-lg font-semibold">{CATEGORY_LABELS[category]}</div>
              <div className="mt-2.5 font-mono text-[13px] text-ink-soft">
                {categoryCounts[i].count ?? 0} listings
              </div>
            </Link>
          );
        })}
      </div>

      {/* Featured listings */}
      {featured.length ? (
        <div className="mt-14">
          <h2 className="text-lg font-semibold">Featured listings</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((business) => {
              const photo = primaryPhoto(business.business_photos);
              const metroSlug = business.metro?.slug;
              const tier = priceTier(business.services?.map((s) => s.price_min) ?? []);
              return (
                <ListingCard
                  key={business.id}
                  business={business}
                  href={metroSlug ? `/${metroSlug}/${CATEGORY_SLUGS[business.category]}/${business.slug}` : "#"}
                  photoUrl={photo?.url}
                  priceLabel={tier ?? "—"}
                  featured
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Browse by metro */}
      {metros?.length ? (
        <div className="mt-14">
          <h2 className="text-lg font-semibold">Browse by metro</h2>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {metros.map((metro) => (
              <li key={metro.slug}>
                <Link
                  href={`/${metro.slug}`}
                  className="block border border-rule-strong px-4 py-2 text-sm hover:border-ink"
                >
                  {metro.name}, {metro.state}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
