import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { breadcrumbList, localBusinessSchema, siteUrl } from "@/lib/jsonld";
import { sortPhotos } from "@/lib/search";
import { TrustBadgePills, FinancingAndConsultChips } from "@/components/trust-badges";
import { ReviewsSection, RatingTicks, averageRating } from "@/components/reviews-section";
import { priceTier } from "@/lib/pricing";
import { CATEGORY_LABELS, CATEGORY_TAG_CLASS, categoryFromSlug } from "@/lib/categories";
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
  const tier = priceTier((business.services ?? []).map((s) => s.price_min));

  const breadcrumbJsonLd = breadcrumbList([
    { name: "Home", path: "/" },
    { name: `${metro.name}, ${metro.state}`, path: `/${metro.slug}` },
    { name: CATEGORY_LABELS[businessCategory], path: `/${metro.slug}/${categorySlug}` },
    { name: business.name, path },
  ]);
  const businessJsonLd = localBusinessSchema(
    business,
    photoUrls,
    path,
    business.services ?? [],
    reviews
  );

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

      <div className="mt-6 border border-rule-strong">
        <div className="border-b border-rule px-[26px] pt-[26px] pb-5">
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
            {business.address ? `${business.address}, ` : ""}
            {business.city}, {business.state} {business.zip}
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

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <TrustBadgePills business={business} />
            {!business.claimed_by ? (
              <Link href={`${path}/claim`} className="text-xs text-ink-soft underline">
                Claim this business
              </Link>
            ) : null}
          </div>
        </div>

        {business.services?.length ? (
          <div className="px-[26px] py-5">
            {business.services.map((service) => (
              <div
                key={service.id}
                className="flex justify-between gap-4 border-b border-rule py-2.5 text-sm last:border-0"
              >
                <span>{service.name}</span>
                {service.price_min != null ? (
                  <span className="flex-none font-mono text-ink-soft">
                    ${service.price_min}
                    {service.price_max != null && service.price_max !== service.price_min
                      ? `–$${service.price_max}`
                      : ""}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 bg-paper-raised px-[26px] py-4">
          <span className="font-mono text-xs text-ink-soft">
            {business.financing_options?.length
              ? `Financing: ${business.financing_options.join(", ")}`
              : ""}
          </span>
          <a
            href="#request-info"
            className="flex-none bg-teal px-[18px] py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink"
          >
            Request Info
          </a>
        </div>
      </div>

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

      {business.description ? (
        <p className="mt-6 text-ink">{business.description}</p>
      ) : null}

      <FinancingAndConsultChips business={business} />

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
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

      <ReviewsSection reviews={reviews} />

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
    </main>
  );
}
