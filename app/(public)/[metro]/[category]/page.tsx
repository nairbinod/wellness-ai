import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { breadcrumbList, siteUrl } from "@/lib/jsonld";
import { searchBusinesses, primaryPhoto } from "@/lib/search";
import { priceTier } from "@/lib/pricing";
import { ListingCard } from "@/components/listing-card";
import { Pagination, PAGE_SIZE_OPTIONS, resolvePage, resolvePageSize } from "@/components/pagination";
import { CATEGORY_LABELS, categoryFromSlug } from "@/lib/categories";
import { getMetroCategoryEditorial } from "@/lib/metro-editorial";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ metro: string; category: string }>;
}): Promise<Metadata> {
  const { metro: metroSlug, category: categorySlug } = await params;
  const category = categoryFromSlug(categorySlug);
  if (!category) return {};

  const supabase = await createClient();
  const { data: metro } = await supabase
    .from("metros")
    .select("name, state, slug")
    .eq("slug", metroSlug)
    .maybeSingle();
  if (!metro) return {};

  const label = CATEGORY_LABELS[category];
  return {
    title: `${label} in ${metro.name}, ${metro.state}`,
    description: `Compare ${label.toLowerCase()} in ${metro.name}, ${metro.state} — real pricing, verified listings, and trust badges.`,
    alternates: { canonical: siteUrl(`/${metro.slug}/${categorySlug}`) },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ metro: string; category: string }>;
  searchParams: Promise<{ q?: string; subcategory?: string; page?: string; per_page?: string }>;
}) {
  const { metro: metroSlug, category: categorySlug } = await params;
  const { q, subcategory, page: pageParam, per_page } = await searchParams;
  const category = categoryFromSlug(categorySlug);
  if (!category) notFound();

  const page = resolvePage(pageParam);
  const pageSize = resolvePageSize(per_page);

  const supabase = await createClient();

  const { data: metro } = await supabase
    .from("metros")
    .select("id, name, state, slug")
    .eq("slug", metroSlug)
    .maybeSingle();

  if (!metro) notFound();

  const { businesses, total } = await searchBusinesses(supabase, {
    q,
    subcategory,
    metroId: metro.id,
    category,
    page,
    pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const jsonLd = breadcrumbList([
    { name: "Home", path: "/" },
    { name: `${metro.name}, ${metro.state}`, path: `/${metro.slug}` },
    {
      name: CATEGORY_LABELS[category],
      path: `/${metro.slug}/${categorySlug}`,
    },
  ]);

  const editorial = getMetroCategoryEditorial(metro.slug, metro.state, category);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-sm text-ink-soft">
        <Link href="/" className="hover:text-teal">
          Home
        </Link>{" "}
        /{" "}
        <Link href={`/${metro.slug}`} className="hover:text-teal">
          {metro.name}, {metro.state}
        </Link>
      </nav>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {CATEGORY_LABELS[category]} in {metro.name}, {metro.state}
      </h1>

      {editorial.intro ? (
        <div className="mt-5 max-w-[75ch] space-y-3 text-[15px] leading-relaxed text-ink-soft">
          {editorial.intro.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {editorial.regulatory ? (
        <div className="mt-5 max-w-[75ch] border border-rule-strong bg-paper-raised p-5">
          <h2 className="font-mono text-[11px] tracking-wider uppercase text-teal">
            {editorial.regulatory.heading}
          </h2>
          <div className="mt-2.5 space-y-2.5 text-sm leading-relaxed text-ink-soft">
            {editorial.regulatory.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            General information, not legal or medical advice — regulations change and can vary by
            individual clinic and license type. When in doubt, ask the provider directly.
          </p>
        </div>
      ) : null}

      <form className="mt-6 flex flex-wrap gap-3" action={`/${metro.slug}/${categorySlug}`}>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or description…"
          className="flex-1 border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
        />
        <input
          type="text"
          name="subcategory"
          defaultValue={subcategory}
          placeholder="Subcategory"
          className="border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal sm:w-48"
        />
        <select
          name="per_page"
          defaultValue={String(pageSize)}
          className="border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-teal px-4 py-2 font-mono text-xs tracking-wider uppercase text-teal-ink"
        >
          Filter
        </button>
      </form>

      {!businesses.length ? (
        <p className="mt-8 text-ink-soft">
          No listings matched{q || subcategory ? " your filters" : " this category"}.
        </p>
      ) : (
        <>
          <p className="mt-6 font-mono text-xs text-ink-soft">
            {total} listing{total === 1 ? "" : "s"}
          </p>
          <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => {
              const photo = primaryPhoto(business.business_photos);
              const tier = priceTier(business.services?.map((s) => s.price_min) ?? []);
              return (
                <ListingCard
                  key={business.id}
                  business={business}
                  href={`/${metro.slug}/${categorySlug}/${business.slug}`}
                  photoUrl={photo?.url}
                  priceLabel={tier ?? "—"}
                  featured={business.listing_tier === "featured"}
                />
              );
            })}
          </div>
          <Pagination
            basePath={`/${metro.slug}/${categorySlug}`}
            params={{ q, subcategory, per_page: String(pageSize) }}
            page={page}
            totalPages={totalPages}
          />
        </>
      )}
    </main>
  );
}
