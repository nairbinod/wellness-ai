import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

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
};

const BUSINESS_CARD_SELECT =
  "id, name, slug, city, state, category, verified, claimed_by, responds_to_inquiries, first_time_friendly, listing_tier, metro:metros(slug, name, state), business_photos(url, is_primary, sort_order), services(price_min)";

export async function searchBusinesses(
  supabase: SupabaseClient<Database>,
  { q, metroId, category, subcategory, listingTier, page = 1, pageSize = 24 }: BusinessSearchFilters
) {
  // PostgREST 416s ("Requested range not satisfiable") if the offset exceeds
  // the actual row count, so the page has to be clamped against a real
  // count *before* requesting a range — an unclamped page number (e.g. from
  // a stale bookmark or someone editing the URL) would otherwise 500.
  let countQuery = supabase.from("businesses").select("id", { count: "exact", head: true });
  if (q?.trim()) {
    countQuery = countQuery.textSearch("search_vector", q.trim(), { type: "websearch", config: "english" });
  }
  if (metroId) countQuery = countQuery.eq("metro_id", metroId);
  if (category) countQuery = countQuery.eq("category", category);
  if (subcategory?.trim()) countQuery = countQuery.contains("subcategories", [subcategory.trim()]);
  if (listingTier) countQuery = countQuery.eq("listing_tier", listingTier);

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
  if (q?.trim()) {
    dataQuery = dataQuery.textSearch("search_vector", q.trim(), { type: "websearch", config: "english" });
  }
  if (metroId) dataQuery = dataQuery.eq("metro_id", metroId);
  if (category) dataQuery = dataQuery.eq("category", category);
  if (subcategory?.trim()) dataQuery = dataQuery.contains("subcategories", [subcategory.trim()]);
  if (listingTier) dataQuery = dataQuery.eq("listing_tier", listingTier);

  const { data, error } = await dataQuery;
  if (error) throw new Error(`Search failed: ${error.message}`);

  return { businesses: data ?? [], total, page: safePage, pageSize };
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
