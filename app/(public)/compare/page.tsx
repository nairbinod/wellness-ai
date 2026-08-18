import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";
import { CATEGORY_LABELS, CATEGORY_SLUGS } from "@/lib/categories";
import { distanceMiles, formatDistance } from "@/lib/geo";
import { UseLocationButton } from "@/components/use-location-button";

export const metadata: Metadata = {
  title: "Compare",
  description: `Compare med spas, IV therapy, and men's health clinics side by side on ${SITE_NAME} — pricing, services, reviews, financing, and more.`,
  robots: { index: false, follow: true },
  alternates: { canonical: siteUrl("/compare") },
};

function priceRangeLabel(services: { price_min: number | null; price_max: number | null }[]) {
  const mins = services.map((s) => s.price_min).filter((v): v is number => v != null);
  const maxes = services.map((s) => s.price_max ?? s.price_min).filter((v): v is number => v != null);
  if (!mins.length) return "—";
  const lo = Math.min(...mins);
  const hi = Math.max(...maxes);
  return lo === hi ? `$${lo}` : `$${lo}–$${hi}`;
}

function ratingLabel(reviews: { rating: number | null }[]) {
  const rated = reviews.map((r) => r.rating).filter((r): r is number => r != null);
  if (!rated.length) return "No reviews yet";
  const avg = rated.reduce((sum, r) => sum + r, 0) / rated.length;
  return `${avg.toFixed(1)} / 5 (${rated.length})`;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; lat?: string; lng?: string }>;
}) {
  const { ids: idsParam, lat, lng } = await searchParams;
  const ids = (idsParam?.split(",").filter(Boolean) ?? []).slice(0, 4);

  const nearLat = lat ? Number(lat) : undefined;
  const nearLng = lng ? Number(lng) : undefined;
  const hasLocation = nearLat != null && Number.isFinite(nearLat) && nearLng != null && Number.isFinite(nearLng);

  const supabase = await createClient();

  if (!ids.length) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Compare</h1>
        <p className="mt-4 text-ink-soft">
          Nothing to compare yet. Browse listings and use the{" "}
          <span className="font-mono text-xs uppercase text-ink-soft">+ Compare</span> button on
          any card — pick 2 to 4, then compare them side by side here.
        </p>
        <Link href="/search" className="mt-4 inline-block text-teal hover:underline">
          Start browsing →
        </Link>
      </main>
    );
  }

  const [
    { data: businesses, error: businessesError },
    { data: services, error: servicesError },
    { data: reviews, error: reviewsError },
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        "id, name, slug, category, city, state, lat, lng, claimed_by, verified, financing_options, booking_url, credentials, metro:metros(slug, name, state)"
      )
      .in("id", ids),
    supabase.from("services").select("business_id, name, price_min, price_max").in("business_id", ids),
    supabase.from("reviews").select("business_id, rating").in("business_id", ids),
  ]);

  const queryError = businessesError ?? servicesError ?? reviewsError;
  if (queryError) {
    throw new Error(`Compare failed to load: ${queryError.message}`);
  }

  // Preserve the order the user selected them in, not whatever order the DB
  // returns — .in() doesn't guarantee it.
  const ordered = ids
    .map((id) => businesses?.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  if (!ordered.length) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Compare</h1>
        <p className="mt-4 text-ink-soft">
          Couldn&apos;t find those listings — they may have been removed.{" "}
          <Link href="/search" className="text-teal hover:underline">
            Start over →
          </Link>
        </p>
      </main>
    );
  }

  const rows = ordered.map((business) => {
    const businessServices = (services ?? []).filter((s) => s.business_id === business.id);
    const businessReviews = (reviews ?? []).filter((r) => r.business_id === business.id);
    const listingPath = business.metro
      ? `/${business.metro.slug}/${CATEGORY_SLUGS[business.category]}/${business.slug}`
      : null;
    return {
      business,
      listingPath,
      priceLabel: priceRangeLabel(businessServices),
      serviceNames: businessServices.map((s) => s.name),
      ratingLabel: ratingLabel(businessReviews),
      distance:
        hasLocation && business.lat != null && business.lng != null
          ? distanceMiles(nearLat!, nearLng!, business.lat, business.lng)
          : null,
    };
  });

  const cellClass = "border-t border-rule px-4 py-3 align-top text-sm";
  const labelClass = "border-t border-rule px-4 py-3 align-top font-mono text-xs uppercase tracking-wider text-ink-soft";

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Compare</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {ordered.length} listing{ordered.length === 1 ? "" : "s"} side by side.
      </p>

      {!hasLocation ? (
        <div className="mt-4">
          <UseLocationButton mode="refine-page" />
          <p className="mt-1.5 text-xs text-ink-soft">Add your location to compare distance too.</p>
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto border border-rule-strong">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="w-40 border-b border-rule-strong bg-paper-raised px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-ink-soft">
                &nbsp;
              </th>
              {rows.map(({ business, listingPath }) => (
                <th key={business.id} className="border-b border-rule-strong bg-paper-raised px-4 py-3 text-left">
                  <div className="font-semibold">{business.name}</div>
                  <div className="mt-0.5 text-xs text-ink-soft">
                    {business.city}
                    {business.state ? `, ${business.state}` : ""}
                  </div>
                  {listingPath ? (
                    <Link href={listingPath} className="mt-1.5 inline-block text-xs text-teal hover:underline">
                      View listing →
                    </Link>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={labelClass}>Category</td>
              {rows.map(({ business }) => (
                <td key={business.id} className={cellClass}>
                  {CATEGORY_LABELS[business.category]}
                </td>
              ))}
            </tr>
            <tr>
              <td className={labelClass}>Price</td>
              {rows.map(({ business, priceLabel }) => (
                <td key={business.id} className={`${cellClass} font-mono`}>
                  {priceLabel}
                </td>
              ))}
            </tr>
            <tr>
              <td className={labelClass}>Services</td>
              {rows.map(({ business, serviceNames }) => (
                <td key={business.id} className={cellClass}>
                  {serviceNames.length ? (
                    <ul className="space-y-0.5">
                      {serviceNames.slice(0, 6).map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                      {serviceNames.length > 6 ? (
                        <li className="text-xs text-ink-soft">+{serviceNames.length - 6} more</li>
                      ) : null}
                    </ul>
                  ) : (
                    "—"
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className={labelClass}>Reviews</td>
              {rows.map(({ business, ratingLabel: rating }) => (
                <td key={business.id} className={cellClass}>
                  {rating}
                </td>
              ))}
            </tr>
            <tr>
              <td className={labelClass}>Financing</td>
              {rows.map(({ business }) => (
                <td key={business.id} className={cellClass}>
                  {business.financing_options?.length ? business.financing_options.join(", ") : "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className={labelClass}>Distance</td>
              {rows.map(({ business, distance }) => (
                <td key={business.id} className={cellClass}>
                  {distance != null ? formatDistance(distance) : "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className={labelClass}>Online booking</td>
              {rows.map(({ business }) => (
                <td key={business.id} className={cellClass}>
                  {business.booking_url ? (
                    <a
                      href={business.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal hover:underline"
                    >
                      Book online →
                    </a>
                  ) : (
                    "Not listed"
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className={labelClass}>Credentials</td>
              {rows.map(({ business }) => (
                <td key={business.id} className={cellClass}>
                  {business.credentials || "Not provided"}
                </td>
              ))}
            </tr>
            <tr>
              <td className={labelClass}>Status</td>
              {rows.map(({ business }) => (
                <td key={business.id} className={cellClass}>
                  {business.claimed_by ? "Owner verified" : business.verified ? "Verified" : "Unclaimed"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
