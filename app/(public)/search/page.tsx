import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchBusinesses, primaryPhoto } from "@/lib/search";
import { priceTier } from "@/lib/pricing";
import { ListingCard } from "@/components/listing-card";
import { Pagination, PAGE_SIZE_OPTIONS, resolvePage, resolvePageSize } from "@/components/pagination";
import { CATEGORY_LABELS, CATEGORY_SLUGS, type BusinessCategory } from "@/lib/categories";
import { UseLocationButton } from "@/components/use-location-button";

function isBusinessCategory(value: string): value is BusinessCategory {
  return value in CATEGORY_LABELS;
}

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    metro?: string;
    category?: string;
    subcategory?: string;
    page?: string;
    per_page?: string;
    lat?: string;
    lng?: string;
  }>;
}) {
  const {
    q,
    metro: metroSlug,
    category: categoryParam,
    subcategory,
    page: pageParam,
    per_page,
    lat,
    lng,
  } = await searchParams;
  const category = categoryParam && isBusinessCategory(categoryParam) ? categoryParam : undefined;
  const page = resolvePage(pageParam);
  const pageSize = resolvePageSize(per_page);

  const nearLat = lat ? Number(lat) : undefined;
  const nearLng = lng ? Number(lng) : undefined;
  const hasLocation = nearLat != null && Number.isFinite(nearLat) && nearLng != null && Number.isFinite(nearLng);

  const supabase = await createClient();

  const { data: metros } = await supabase.from("metros").select("id, slug, name, state").order("name");
  const selectedMetro = metros?.find((m) => m.slug === metroSlug);

  const hasFilters = Boolean(q || metroSlug || category || subcategory || hasLocation);
  const { businesses: results, total } = hasFilters
    ? await searchBusinesses(supabase, {
        q,
        metroId: selectedMetro?.id,
        category,
        subcategory,
        page,
        pageSize,
        ...(hasLocation ? { nearLat, nearLng } : {}),
      })
    : { businesses: [], total: 0 };
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <div className="mt-4">
        {hasLocation ? (
          <p className="text-xs text-ink-soft">
            Sorted by distance from your location —{" "}
            <Link href="/search" className="text-teal hover:underline">
              clear
            </Link>
          </p>
        ) : (
          <UseLocationButton mode="refine-page" />
        )}
      </div>

      <form className="mt-4 grid gap-3 sm:grid-cols-4" action="/search">
        {hasLocation ? (
          <>
            <input type="hidden" name="lat" value={lat} />
            <input type="hidden" name="lng" value={lng} />
          </>
        ) : null}
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or description…"
          className="border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal sm:col-span-2"
        />
        <select
          name="metro"
          defaultValue={metroSlug ?? ""}
          className="border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
        >
          <option value="">All metros</option>
          {metros?.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name}, {m.state}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={category ?? ""}
          className="border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
        >
          <option value="">All categories</option>
          {(Object.keys(CATEGORY_LABELS) as BusinessCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="subcategory"
          defaultValue={subcategory}
          placeholder="Subcategory (e.g. botox)"
          className="border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
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
          className="bg-teal px-4 py-2 font-mono text-xs tracking-wider uppercase text-teal-ink sm:col-start-4"
        >
          Search
        </button>
      </form>

      {!hasFilters ? (
        <p className="mt-8 text-ink-soft">Enter a search term or pick a filter to see results.</p>
      ) : results.length === 0 ? (
        <p className="mt-8 text-ink-soft">No listings matched your search.</p>
      ) : (
        <>
          <p className="mt-6 font-mono text-xs text-ink-soft">
            {total} listing{total === 1 ? "" : "s"}
          </p>
          <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((business) => {
              const photo = primaryPhoto(business.business_photos);
              const metroInfo = business.metro;
              const tier = priceTier(business.services?.map((s) => s.price_min) ?? []);
              return (
                <ListingCard
                  key={business.id}
                  business={business}
                  href={`/${metroInfo?.slug}/${CATEGORY_SLUGS[business.category]}/${business.slug}`}
                  photoUrl={photo?.url}
                  priceLabel={tier ?? "—"}
                  featured={business.listing_tier === "featured"}
                  distanceMiles={business.distanceMiles}
                />
              );
            })}
          </div>
          <Pagination
            basePath="/search"
            params={{
              q,
              metro: metroSlug,
              category,
              subcategory,
              per_page: String(pageSize),
              lat,
              lng,
            }}
            page={page}
            totalPages={totalPages}
          />
        </>
      )}
    </main>
  );
}
