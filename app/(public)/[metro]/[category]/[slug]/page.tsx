import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { breadcrumbList, localBusinessSchema, siteUrl } from "@/lib/jsonld";
import { sortPhotos, primaryPhoto } from "@/lib/search";
import { TrustBadgePills, FinancingAndConsultChips } from "@/components/trust-badges";
import { ReviewsSection, RatingTicks, averageRating } from "@/components/reviews-section";
import { ListingCard } from "@/components/listing-card";
import { priceTier } from "@/lib/pricing";
import { distanceMiles } from "@/lib/geo";
import {
  CATEGORY_LABELS,
  CATEGORY_TAG_CLASS,
  categoryFromSlug,
  type BusinessCategory,
} from "@/lib/categories";
import { LeadForm } from "./lead-form";

async function getListing(metroSlug: string, categorySlug: string, slug: string) {
  const category = categoryFromSlug(categorySlug);
  if (!category) return null;

  const supabase = await createClient();

  const { data: metro } = await supabase
    .from("metros")
    .select("id, name, state, slug")
    .eq("slug", metroSlug)
    .maybeSingle();

  if (!metro) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "*, business_photos(url, is_primary, sort_order), services(id, name, category, price_min, price_max, duration_minutes, description), reviews(id, author_name, rating, review_text, review_date, source)"
    )
    .eq("metro_id", metro.id)
    .eq("category", category)
    .eq("slug", slug)
    .maybeSingle();

  if (!business) return null;

  return { metro, business, category };
}

async function getNearbyAlternatives(
  metroId: string,
  category: BusinessCategory,
  excludeId: string,
  origin: { lat: number | null; lng: number | null }
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, city, state, lat, lng, category, verified, claimed_by, responds_to_inquiries, first_time_friendly, business_photos(url, is_primary, sort_order), services(price_min)"
    )
    .eq("metro_id", metroId)
    .eq("category", category)
    .neq("id", excludeId)
    .order("name")
    .limit(8);

  const alternatives = data ?? [];

  // Sort by real distance between listings when we have coordinates for
  // both — otherwise fall back to the name order already applied above.
  if (origin.lat != null && origin.lng != null) {
    alternatives.sort((a, b) => {
      const da = a.lat != null && a.lng != null ? distanceMiles(origin.lat!, origin.lng!, a.lat, a.lng) : Infinity;
      const db = b.lat != null && b.lng != null ? distanceMiles(origin.lat!, origin.lng!, b.lat, b.lng) : Infinity;
      return da - db;
    });
  }

  return alternatives.slice(0, 3);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ metro: string; category: string; slug: string }>;
}): Promise<Metadata> {
  const { metro: metroSlug, category: categorySlug, slug } = await params;
  const listing = await getListing(metroSlug, categorySlug, slug);
  if (!listing) return {};

  const { business, metro } = listing;
  const title = `${business.name} — ${business.city}, ${business.state}`;
  const description =
    business.description ??
    `${business.name} — ${CATEGORY_LABELS[listing.category]} in ${metro.name}, ${metro.state}.`;
  const path = `/${metro.slug}/${categorySlug}/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: siteUrl(path) },
  };
}

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const FULL_DATE = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ metro: string; category: string; slug: string }>;
  searchParams: Promise<{ utm_source?: string; utm_medium?: string; claimed?: string }>;
}) {
  const { metro: metroSlug, category: categorySlug, slug } = await params;
  const { utm_source: utmSource, utm_medium: utmMedium, claimed } = await searchParams;
  const listing = await getListing(metroSlug, categorySlug, slug);
  if (!listing) notFound();

  const { metro, business, category: businessCategory } = listing;
  const path = `/${metro.slug}/${categorySlug}/${slug}`;
  const referrer = (await headers()).get("referer") ?? undefined;
  const tag = CATEGORY_TAG_CLASS[businessCategory];

  const photos = sortPhotos(business.business_photos);
  const photoUrls = photos.map((p) => p.url);
  const hours = Array.isArray(business.hours) ? (business.hours as string[]) : null;
  const reviews = business.reviews ?? [];
  const avgRating = averageRating(reviews);
  const services = business.services ?? [];
  const tier = priceTier(services.map((s) => s.price_min));

  const alternatives = await getNearbyAlternatives(metro.id, businessCategory, business.id, {
    lat: business.lat,
    lng: business.lng,
  });

  const directionsHref = business.lat != null && business.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${business.lat},${business.lng}`
    : business.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${business.address}, ${business.city ?? ""} ${business.state ?? ""}`
        )}`
      : null;

  const breadcrumbJsonLd = breadcrumbList([
    { name: "Home", path: "/" },
    { name: `${metro.name}, ${metro.state}`, path: `/${metro.slug}` },
    { name: CATEGORY_LABELS[businessCategory], path: `/${metro.slug}/${categorySlug}` },
    { name: business.name, path },
  ]);
  const businessJsonLd = localBusinessSchema(business, photoUrls, path, services, reviews);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />

      <nav className="text-sm text-ink-soft">
        <Link href="/" className="hover:text-teal">
          Home
        </Link>{" "}
        /{" "}
        <Link href={`/${metro.slug}`} className="hover:text-teal">
          {metro.name}, {metro.state}
        </Link>{" "}
        /{" "}
        <Link href={`/${metro.slug}/${categorySlug}`} className="hover:text-teal">
          {CATEGORY_LABELS[businessCategory]}
        </Link>
      </nav>

      {claimed ? (
        <div className="mt-4 border border-teal px-4 py-3 text-sm text-teal">
          You&apos;ve claimed this listing.
        </div>
      ) : null}

      {/* Header */}
      <div className="mt-6 border border-rule-strong px-[26px] pt-[26px] pb-6">
        <span
          className={`inline-block font-mono text-[10px] tracking-wider uppercase px-2 py-1 border border-rule-strong ${tag.text}`}
        >
          {CATEGORY_LABELS[businessCategory]}
        </span>
        {tier ? (
          <span className="ml-2 inline-block font-mono text-[10px] tracking-wider uppercase px-2 py-1 border border-rule-strong text-ink-soft">
            {tier}
          </span>
        ) : null}
        <h1 className="mt-2.5 text-2xl font-semibold tracking-tight">{business.name}</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          {business.address || `${business.city}, ${business.state} ${business.zip}`}
          {directionsHref ? (
            <>
              {" · "}
              <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="text-teal underline">
                Get directions
              </a>
            </>
          ) : null}
        </p>

        {avgRating != null ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[15px] font-bold">{avgRating.toFixed(1)}</span>
            <RatingTicks rating={avgRating} />
            <span className="font-mono text-xs text-ink-soft">
              ({reviews.length} review{reviews.length === 1 ? "" : "s"}
              {reviews[0]?.source
                ? ` · ${reviews[0].source.charAt(0).toUpperCase()}${reviews[0].source.slice(1)}`
                : ""}
              )
            </span>
          </div>
        ) : null}

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <TrustBadgePills business={business} />
            {business.claimed_by && business.verified_at ? (
              <span className="font-mono text-[10px] tracking-wider uppercase px-[7px] py-1 border border-rule-strong text-ink-soft">
                Verified {MONTH_YEAR.format(new Date(business.verified_at))}
              </span>
            ) : null}
            {!business.claimed_by ? (
              <Link href={`${path}/claim`} className="text-xs text-ink-soft underline">
                Claim this business
              </Link>
            ) : null}
          </div>
          <a
            href="#request-info"
            className="flex-none bg-teal px-[18px] py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink"
          >
            Request Info
          </a>
        </div>
      </div>

      {business.current_special ? (
        <div className="mt-4 border border-gold bg-paper-raised px-[26px] py-4">
          <span className="font-mono text-[10px] tracking-wider uppercase text-gold">
            Current special
          </span>
          <p className="mt-1 text-sm font-medium text-ink">{business.current_special}</p>
        </div>
      ) : null}

      {photoUrls.length > 0 ? (
        <div className="mt-8 grid grid-cols-3 gap-2">
          {photoUrls.map((url, i) => (
            <div key={url} className="relative aspect-square border border-rule bg-paper-raised">
              <Image
                src={url}
                alt={`${business.name} photo ${i + 1}`}
                fill
                sizes="33vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      ) : null}

      {services.length ? (
        <div className="mt-10">
          <h2 className="font-semibold">Services &amp; pricing</h2>
          <div className="mt-3 border border-rule-strong">
            <div className="flex justify-between gap-4 border-b border-rule-strong bg-paper-raised px-4 py-2 font-mono text-[10px] tracking-wider uppercase text-ink-soft">
              <span>Treatment</span>
              <span>Starting price</span>
            </div>
            {services.map((service) => (
              <div
                key={service.id}
                className="flex justify-between gap-4 border-b border-rule px-4 py-2.5 text-sm last:border-0"
              >
                <span>{service.name}</span>
                {service.price_min != null ? (
                  <span className="flex-none font-mono text-ink-soft">
                    ${service.price_min}
                    {service.price_max != null && service.price_max !== service.price_min
                      ? `–$${service.price_max}`
                      : ""}
                  </span>
                ) : (
                  <span className="flex-none font-mono text-ink-soft">Call for pricing</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <FinancingAndConsultChips business={business} />

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold">Contact</h2>
          <dl className="mt-2 space-y-1 text-sm text-ink-soft">
            {business.phone ? (
              <div>
                <dt className="inline font-medium text-ink">Phone: </dt>
                <dd className="inline">{business.phone}</dd>
              </div>
            ) : null}
            {business.website ? (
              <div>
                <dt className="inline font-medium text-ink">Website: </dt>
                <dd className="inline">
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-teal underline">
                    {business.website}
                  </a>
                </dd>
              </div>
            ) : null}
            {business.booking_url ? (
              <div>
                <dt className="inline font-medium text-ink">Book: </dt>
                <dd className="inline">
                  <a href={business.booking_url} target="_blank" rel="noopener noreferrer" className="text-teal underline">
                    {business.booking_url}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          {business.facebook_url || business.instagram_url || business.tiktok_url ? (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {business.facebook_url ? (
                <a
                  href={business.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal underline"
                >
                  Facebook
                </a>
              ) : null}
              {business.instagram_url ? (
                <a
                  href={business.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal underline"
                >
                  Instagram
                </a>
              ) : null}
              {business.tiktok_url ? (
                <a
                  href={business.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal underline"
                >
                  TikTok
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {hours?.length ? (
          <div>
            <h2 className="font-semibold">Hours</h2>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {hours.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {business.description ? (
        <div className="mt-10">
          <h2 className="font-semibold">About this provider</h2>
          <p className="mt-2 text-ink">{business.description}</p>
        </div>
      ) : null}

      <ReviewsSection reviews={reviews} />

      {alternatives.length ? (
        <div className="mt-10">
          <h2 className="font-semibold">Nearby alternatives</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {alternatives.map((alt) => {
              const altTier = priceTier((alt.services ?? []).map((s) => s.price_min));
              const altDistance =
                business.lat != null && business.lng != null && alt.lat != null && alt.lng != null
                  ? distanceMiles(business.lat, business.lng, alt.lat, alt.lng)
                  : null;
              return (
                <ListingCard
                  key={alt.id}
                  business={alt}
                  href={`/${metro.slug}/${categorySlug}/${alt.slug}`}
                  photoUrl={primaryPhoto(alt.business_photos)?.url}
                  priceLabel={altTier ?? "—"}
                  distanceMiles={altDistance}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      <div id="request-info" className="mt-12 max-w-md scroll-mt-8 border border-rule-strong p-6">
        <h2 className="font-semibold">Request Information</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Send a message to {business.name} — they&apos;ll get back to you directly.
        </p>
        <div className="mt-4">
          <LeadForm
            businessId={business.id}
            businessName={business.name}
            sourcePage={path}
            utmSource={utmSource}
            utmMedium={utmMedium}
            referrer={referrer}
          />
        </div>
      </div>

      {business.claimed_by && business.verified_at ? (
        <p className="mt-10 font-mono text-xs text-ink-soft">
          Last verified {FULL_DATE.format(new Date(business.verified_at))}
        </p>
      ) : null}
    </main>
  );
}
