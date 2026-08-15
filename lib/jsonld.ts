import type { Database } from "@/lib/types/database";

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type Service = Pick<
  Database["public"]["Tables"]["services"]["Row"],
  "name" | "price_min" | "price_max" | "description"
>;

export const SITE_NAME = "PrimeNearby";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function siteUrl(path: string) {
  return `${SITE_URL}${path}`;
}

export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export function faqPageSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

// schema.org doesn't have exact types for "med spa" / "IV therapy clinic" /
// "men's health clinic" — layering LocalBusiness with the closest medical
// type as an array is valid JSON-LD and gives Rich Results the specificity
// it wants without asserting something schema.org doesn't define.
const CATEGORY_SCHEMA_TYPE: Record<Business["category"], string[]> = {
  med_spa: ["LocalBusiness", "MedicalBusiness"],
  iv_therapy: ["LocalBusiness", "MedicalClinic"],
  mens_health: ["LocalBusiness", "MedicalClinic"],
};

function priceRange(services: Service[]): string | undefined {
  const mins = services.map((s) => s.price_min).filter((v): v is number => v != null);
  const maxes = services.map((s) => s.price_max ?? s.price_min).filter((v): v is number => v != null);
  if (!mins.length || !maxes.length) return undefined;
  return `$${Math.min(...mins)}–$${Math.max(...maxes)}`;
}

function hasOfferCatalog(services: Service[], path: string) {
  if (!services.length) return undefined;
  return {
    "@type": "OfferCatalog",
    name: "Services",
    itemListElement: services.map((service, i) => ({
      "@type": "Offer",
      position: i + 1,
      itemOffered: {
        "@type": "Service",
        name: service.name,
        ...(service.description ? { description: service.description } : {}),
      },
      ...(service.price_min != null
        ? {
            priceSpecification: {
              "@type": "PriceSpecification",
              minPrice: service.price_min,
              ...(service.price_max != null ? { maxPrice: service.price_max } : {}),
              priceCurrency: "USD",
            },
          }
        : {}),
      url: siteUrl(path),
    })),
  };
}

type ReviewSummary = { rating: number | null }[];

function aggregateRating(reviews: ReviewSummary) {
  const rated = reviews.filter((r): r is { rating: number } => r.rating != null);
  if (!rated.length) return undefined;
  return {
    "@type": "AggregateRating",
    ratingValue: Number((rated.reduce((sum, r) => sum + r.rating, 0) / rated.length).toFixed(1)),
    reviewCount: rated.length,
  };
}

export function localBusinessSchema(
  business: Business,
  photoUrls: string[],
  path: string,
  services: Service[] = [],
  reviews: ReviewSummary = []
) {
  const sameAs = [
    business.website,
    business.facebook_url,
    business.instagram_url,
    business.tiktok_url,
  ].filter((url): url is string => Boolean(url));

  return {
    "@context": "https://schema.org",
    "@type": CATEGORY_SCHEMA_TYPE[business.category],
    "@id": siteUrl(path),
    name: business.name,
    url: siteUrl(path),
    ...(business.description ? { description: business.description } : {}),
    ...(photoUrls.length ? { image: photoUrls } : {}),
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    address: {
      "@type": "PostalAddress",
      ...(business.address ? { streetAddress: business.address } : {}),
      ...(business.city ? { addressLocality: business.city } : {}),
      ...(business.state ? { addressRegion: business.state } : {}),
      ...(business.zip ? { postalCode: business.zip } : {}),
      addressCountry: "US",
    },
    ...(business.lat && business.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: business.lat,
            longitude: business.lng,
          },
        }
      : {}),
    ...(priceRange(services) ? { priceRange: priceRange(services) } : {}),
    ...(hasOfferCatalog(services, path) ? { hasOfferCatalog: hasOfferCatalog(services, path) } : {}),
    ...(aggregateRating(reviews) ? { aggregateRating: aggregateRating(reviews) } : {}),
  };
}
