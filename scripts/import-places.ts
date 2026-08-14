// Google Places import pipeline — pulls businesses by metro + category into
// `businesses` + `business_photos` for the launch metros (Miami, Dallas,
// Phoenix/Scottsdale, Los Angeles, Nashville) using the Places API (New)
// Text Search endpoint. Each category runs several query variants (see
// CATEGORY_BASE_QUERIES/METRO_SUBURBS) to get past Google's 60-result cap;
// results are deduped by place id within a run.
//
// Usage:
//   npm run import:places -- [--metro=<slug>] [--category=<business_category>]
//                            [--dry-run] [--max-pages=1] [--skip-photos] [--skip-reviews]
//
// Examples:
//   npm run import:places -- --metro=miami --category=med_spa --dry-run
//   npm run import:places -- --metro=miami --category=med_spa --max-pages=1
//   npm run import:places -- --max-pages=3
//
// Requires GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, and
// SUPABASE_SERVICE_ROLE_KEY in .env.local. Each Text Search request, each
// Place Details request (for reviews), and each photo fetched costs money
// against your Google Cloud billing account — always start with --dry-run
// and a single --metro/--category before running the full matrix.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
import type { Database } from "../lib/types/database";

type BusinessCategory = Database["public"]["Enums"]["business_category"];

type Metro = {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  radius_miles: number;
};

const LAUNCH_METROS: Metro[] = [
  { slug: "miami", name: "Miami", state: "FL", lat: 25.7617, lng: -80.1918, radius_miles: 25 },
  { slug: "dallas", name: "Dallas", state: "TX", lat: 32.7767, lng: -96.797, radius_miles: 30 },
  {
    slug: "phoenix-scottsdale",
    name: "Phoenix/Scottsdale",
    state: "AZ",
    lat: 33.4942,
    lng: -111.9261,
    radius_miles: 30,
  },
  { slug: "los-angeles", name: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437, radius_miles: 35 },
  { slug: "nashville", name: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816, radius_miles: 25 },
  { slug: "austin", name: "Austin", state: "TX", lat: 30.2672, lng: -97.7431, radius_miles: 30 },
  { slug: "atlanta", name: "Atlanta", state: "GA", lat: 33.749, lng: -84.388, radius_miles: 30 },
];

// Google Places Text Search hard-caps a single query at 60 results (3 pages
// of 20), regardless of --max-pages. Running several query variants — some
// treatment-specific, some suburb-specific — surfaces businesses that don't
// rank in the top 60 for the generic query, since Google's ranking shifts
// with both wording and place names embedded in the query text. The metro's
// existing lat/lng + radius still provides location bias for every variant,
// so the suburb-flavored queries don't need their own coordinates — but the
// suburb *names* themselves are metro-specific, so they're generated per
// metro (see METRO_SUBURBS) rather than hardcoded into one global list.
const CATEGORY_BASE_QUERIES: Record<BusinessCategory, string[]> = {
  med_spa: ["med spa", "botox clinic", "laser hair removal", "medical spa aesthetics"],
  iv_therapy: ["IV therapy clinic", "mobile IV hydration", "NAD+ therapy"],
  mens_health: ["men's health clinic", "TRT testosterone clinic", "erectile dysfunction clinic"],
};

const CATEGORY_LABEL: Record<BusinessCategory, string> = {
  med_spa: "med spa",
  iv_therapy: "IV therapy",
  mens_health: "men's health clinic",
};

const METRO_SUBURBS: Record<string, string[]> = {
  dallas: ["Plano", "Frisco", "Irving", "Arlington", "McKinney"],
  austin: ["Round Rock", "Cedar Park", "Georgetown", "Pflugerville", "San Marcos"],
  atlanta: ["Marietta", "Alpharetta", "Sandy Springs", "Roswell", "Decatur"],
};

function categoryQueriesForMetro(category: BusinessCategory, metro: Metro): string[] {
  const suburbQueries = (METRO_SUBURBS[metro.slug] ?? []).map(
    (suburb) => `${CATEGORY_LABEL[category]} ${suburb}`
  );
  return [...CATEGORY_BASE_QUERIES[category], ...suburbQueries];
}

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.location",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.regularOpeningHours",
  "places.photos",
  "nextPageToken",
].join(",");

const STORAGE_BUCKET = "business-photos";
const MILES_TO_METERS = 1609.34;

type PlaceResult = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: { longText: string; shortText: string; types?: string[] }[];
  location?: { latitude: number; longitude: number };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  photos?: { name: string }[];
};

type SearchResponse = {
  places?: PlaceResult[];
  nextPageToken?: string;
};

type PlaceReview = {
  rating?: number;
  text?: { text?: string };
  authorAttribution?: { displayName?: string };
  publishTime?: string;
};

type PlaceDetailsResponse = {
  reviews?: PlaceReview[];
};

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const [key, value] = raw.slice(2).split("=");
    args[key] = value ?? true;
  }
  return {
    metro: typeof args.metro === "string" ? args.metro : undefined,
    category: typeof args.category === "string" ? (args.category as BusinessCategory) : undefined,
    dryRun: Boolean(args["dry-run"]),
    skipPhotos: Boolean(args["skip-photos"]),
    skipReviews: Boolean(args["skip-reviews"]),
    maxPages: typeof args["max-pages"] === "string" ? parseInt(args["max-pages"], 10) : 1,
  };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addressComponent(place: PlaceResult, type: string, useShort = false) {
  const match = place.addressComponents?.find((c) => c.types?.includes(type));
  return match ? (useShort ? match.shortText : match.longText) : null;
}

async function searchPlaces(apiKey: string, query: string, metro: Metro, pageToken?: string) {
  const body: Record<string, unknown> = {
    textQuery: `${query} in ${metro.name}, ${metro.state}`,
    languageCode: "en",
    pageSize: 20,
    locationBias: {
      circle: {
        center: { latitude: metro.lat, longitude: metro.lng },
        radius: metro.radius_miles * MILES_TO_METERS,
      },
    },
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Places search failed (${res.status}): ${await res.text()}`);
  }

  return (await res.json()) as SearchResponse;
}

async function fetchPhotoBytes(apiKey: string, photoName: string) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Photo fetch failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// Text Search doesn't return reviews — Google only exposes them through
// Place Details, and (a long-standing API limitation, not something we
// control) caps it at 5 reviews per place no matter what.
async function fetchPlaceReviews(apiKey: string, placeId: string) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "reviews",
    },
  });
  if (!res.ok) throw new Error(`Place details failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as PlaceDetailsResponse;
}

async function main() {
  const { metro: metroFilter, category: categoryFilter, dryRun, skipPhotos, skipReviews, maxPages } =
    parseArgs(process.argv.slice(2));

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!googleApiKey) throw new Error("Missing GOOGLE_PLACES_API_KEY in .env.local");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  const metros = LAUNCH_METROS.filter((m) => !metroFilter || m.slug === metroFilter);
  const categories = (Object.keys(CATEGORY_BASE_QUERIES) as BusinessCategory[]).filter(
    (c) => !categoryFilter || c === categoryFilter
  );

  if (metros.length === 0) throw new Error(`No launch metro matches --metro=${metroFilter}`);
  if (categories.length === 0) throw new Error(`No category matches --category=${categoryFilter}`);

  console.log(
    `Importing ${categories.join(", ")} across ${metros.map((m) => m.slug).join(", ")} ` +
      `(maxPages=${maxPages}, dryRun=${dryRun}, skipPhotos=${skipPhotos})`
  );

  if (!dryRun) {
    const { error } = await supabase.from("metros").upsert(metros, { onConflict: "slug" });
    if (error) throw new Error(`Failed to upsert metros: ${error.message}`);

    const { error: bucketError } = await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
    if (bucketError && !bucketError.message.includes("already exists")) {
      throw new Error(`Failed to create storage bucket: ${bucketError.message}`);
    }
  }

  const { data: metroRows } = dryRun
    ? { data: null }
    : await supabase.from("metros").select("id, slug").in(
        "slug",
        metros.map((m) => m.slug)
      );
  const metroIdBySlug = new Map((metroRows ?? []).map((m) => [m.slug, m.id]));

  let created = 0;
  let updated = 0;
  let photosUploaded = 0;
  let reviewsImported = 0;

  for (const metro of metros) {
    for (const category of categories) {
      console.log(`\n=== ${metro.name}, ${metro.state} — ${category} ===`);
      const seenPlaceIds = new Set<string>();

      for (const queryVariant of categoryQueriesForMetro(category, metro)) {
        console.log(`  --- query: "${queryVariant}" ---`);
        let pageToken: string | undefined;
        let page = 0;

        do {
          const result = await searchPlaces(googleApiKey, queryVariant, metro, pageToken);
          const places = result.places ?? [];
          console.log(`    page ${page + 1}: ${places.length} results`);

          for (const place of places) {
            if (seenPlaceIds.has(place.id)) {
              console.log(`    (skip, already seen this run) ${place.displayName?.text ?? place.id}`);
              continue;
            }
            seenPlaceIds.add(place.id);

            const name = place.displayName?.text ?? "Unknown";
            const city = addressComponent(place, "locality") ?? metro.name;
            const state = addressComponent(place, "administrative_area_level_1", true) ?? metro.state;
            const zip = addressComponent(place, "postal_code");
            const slug = slugify(`${name}-${city}`);

            if (dryRun) {
              console.log(`    [dry-run] would upsert: ${name} (${slug})`);
              continue;
            }

            const existing = await supabase.from("businesses").select("id").eq("slug", slug).maybeSingle();
            const isNew = !existing.data;

            const commonFields = {
              name,
              address: place.formattedAddress ?? null,
              city,
              state,
              zip,
              lat: place.location?.latitude ?? null,
              lng: place.location?.longitude ?? null,
              metro_id: metroIdBySlug.get(metro.slug) ?? null,
              phone: place.nationalPhoneNumber ?? null,
              website: place.websiteUri ?? null,
              hours: place.regularOpeningHours?.weekdayDescriptions ?? null,
              updated_at: new Date().toISOString(),
            };

            // `category` is only ever set on insert, never on update — a
            // business that matches more than one vertical's query (e.g. a
            // "wellness spa" surfacing under both a med_spa and an
            // iv_therapy variant) must keep whichever category it was first
            // classified under. Setting it on every matching run previously
            // let a later category's run silently reclassify an existing
            // business.
            const { data: upserted, error } = isNew
              ? await supabase
                  .from("businesses")
                  .insert({ ...commonFields, slug, category })
                  .select("id")
                  .single()
              : await supabase
                  .from("businesses")
                  .update(commonFields)
                  .eq("id", existing.data!.id)
                  .select("id")
                  .single();

            if (error) {
              console.error(`    ! failed to upsert ${name}: ${error.message}`);
              continue;
            }
            if (isNew) created++;
            else updated++;

            if (!skipPhotos && place.photos?.length) {
              const existingPhotos = await supabase
                .from("business_photos")
                .select("id")
                .eq("business_id", upserted.id);

              if (!existingPhotos.data?.length) {
                for (const [i, photo] of place.photos.slice(0, 3).entries()) {
                  try {
                    const bytes = await fetchPhotoBytes(googleApiKey, photo.name);
                    const path = `${slug}/${i}.jpg`;
                    const { error: uploadError } = await supabase.storage
                      .from(STORAGE_BUCKET)
                      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
                    if (uploadError) throw new Error(uploadError.message);

                    const { data: publicUrl } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
                    await supabase.from("business_photos").insert({
                      business_id: upserted.id,
                      url: publicUrl.publicUrl,
                      is_primary: i === 0,
                      sort_order: i,
                    });
                    photosUploaded++;
                  } catch (err) {
                    console.error(`    ! photo ${i} failed for ${name}: ${(err as Error).message}`);
                  }
                }
              }
            }

            if (!skipReviews) {
              try {
                const details = await fetchPlaceReviews(googleApiKey, place.id);
                const reviews = details.reviews ?? [];
                if (reviews.length) {
                  // Google returns a snapshot, not a stable id per review, so
                  // there's nothing sane to upsert against — replace the set.
                  await supabase.from("reviews").delete().eq("business_id", upserted.id);
                  const { error: reviewError } = await supabase.from("reviews").insert(
                    reviews.map((r) => ({
                      business_id: upserted.id,
                      source: "google",
                      rating: r.rating ?? null,
                      review_text: r.text?.text ?? null,
                      author_name: r.authorAttribution?.displayName ?? null,
                      review_date: r.publishTime ? r.publishTime.slice(0, 10) : null,
                    }))
                  );
                  if (reviewError) throw new Error(reviewError.message);
                  reviewsImported += reviews.length;
                }
              } catch (err) {
                console.error(`    ! reviews failed for ${name}: ${(err as Error).message}`);
              }
            }
          }

          pageToken = result.nextPageToken;
          page++;
          if (pageToken && page < maxPages) {
            // Google requires a short delay before a page token becomes valid.
            await new Promise((r) => setTimeout(r, 2000));
          }
        } while (pageToken && page < maxPages);
      }
    }
  }

  console.log(
    `\nDone. ${created} created, ${updated} updated, ${photosUploaded} photos uploaded, ${reviewsImported} reviews imported.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
