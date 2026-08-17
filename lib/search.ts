import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { distanceMiles } from "@/lib/geo";

type BusinessCategory = Database["public"]["Enums"]["business_category"];
type ListingTier = Database["public"]["Enums"]["listing_tier"];

export type BusinessSearchFilters = {
  q?: string;
  metroId?: string;
  category?: BusinessCategory;
  subcategory?: string;
  listingTier?: ListingTier;
  page?: number;
  pageSize?: number;
  // When both are present, results are sorted by distance from this point
  // instead of the default listing_tier/name order. Small enough result
  // sets per metro/category (a few hundred rows, max) that computing and
  // sorting in application code is simpler and plenty fast — no need for a
  // PostGIS-style DB-side distance query at this scale.
  nearLat?: number;
  nearLng?: number;
};

const BUSINESS_CARD_SELECT =
  "id, name, slug, city, state, lat, lng, category, verified, claimed_by, responds_to_inquiries, first_time_friendly, listing_tier, metro:metros(slug, name, state), business_photos(url, is_primary, sort_order), services(price_min)";

// PostgREST's own per-request row cap — used as the "fetch everything so we
// can sort by distance" ceiling. No metro/category combination gets close to
// this today, and if one ever does, it just falls back to only distance-
// sorting the first MAX_ROWS_FOR_DISTANCE_SORT results rather than erroring.
const MAX_ROWS_FOR_DISTANCE_SORT = 1000;

function applyFilters<T>(
  query: T,
  { q, metroId, category, subcategory, listingTier }: BusinessSearchFilters
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q_ = query as any;
  if (q?.trim()) {
    q_ = q_.textSearch("search_vector", q.trim(), { type: "websearch", config: "english" });
  }
  if (metroId) q_ = q_.eq("metro_id", metroId);
  if (category) q_ = q_.eq("category", category);
  if (subcategory?.trim()) q_ = q_.contains("subcategories", [subcategory.trim()]);
  if (listingTier) q_ = q_.eq("listing_tier", listingTier);
  return q_;
}

export async function searchBusinesses(
  supabase: SupabaseClient<Database>,
  filters: BusinessSearchFilters
) {
  const { page = 1, pageSize = 24, nearLat, nearLng } = filters;

  if (nearLat != null && nearLng != null) {
    let dataQuery = supabase.from("businesses").select(BUSINESS_CARD_SELECT).limit(MAX_ROWS_FOR_DISTANCE_SORT);
    dataQuery = applyFilters(dataQuery, filters);
    const { data, error } = await dataQuery;
    if (error) throw new Error(`Search failed: ${error.message}`);

    const withDistance = (data ?? [])
      .map((business) => ({
        ...business,
        distanceMiles:
          business.lat != null && business.lng != null
            ? distanceMiles(nearLat, nearLng, business.lat, business.lng)
            : null,
      }))
      .sort((a, b) => {
        if (a.distanceMiles == null) return 1;
        if (b.distanceMiles == null) return -1;
        return a.distanceMiles - b.distanceMiles;
      });

    const total = withDistance.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const from = (safePage - 1) * pageSize;
    const businesses = withDistance.slice(from, from + pageSize);

    return { businesses, total, page: safePage, pageSize };
  }

  let countQuery = supabase.from("businesses").select("id", { count: "exact", head: true });
  countQuery = applyFilters(countQuery, filters);

  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Search failed: ${countError.message}`);
  const total = count ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = supabase
    .from("businesses")
    .select(BUSINESS_CARD_SELECT)
    .order("listing_tier", { ascending: false })
    .order("name")
    .range(from, to);
  dataQuery = applyFilters(dataQuery, filters);

  const { data, error } = await dataQuery;
  if (error) throw new Error(`Search failed: ${error.message}`);

  // distanceMiles always present on the shape (null here) so callers don't
  // need to branch on which sort mode produced the result.
  const businesses = (data ?? []).map((business) => ({ ...business, distanceMiles: null as number | null }));

  return { businesses, total, page: safePage, pageSize };
}

export async function getFeaturedBusinesses(supabase: SupabaseClient<Database>, limit = 6) {
  const { businesses } = await searchBusinesses(supabase, { listingTier: "featured", pageSize: limit });
  return businesses;
}

export function sortPhotos<T extends { is_primary: boolean; sort_order: number }>(
  photos: T[] | null | undefined
) {
  return [...(photos ?? [])].sort(
    (a, b) => (a.is_primary ? -1 : 1) - (b.is_primary ? -1 : 1) || a.sort_order - b.sort_order
  );
}

export function primaryPhoto<T extends { is_primary: boolean; sort_order: number }>(
  photos: T[] | null | undefined
) {
  return sortPhotos(photos)[0];
}
