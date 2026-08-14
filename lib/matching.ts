import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type BusinessCategory = Database["public"]["Enums"]["business_category"];

export type MatchPreferences = {
  metroId: string;
  category: BusinessCategory;
  wantsFirstTimeFriendly?: boolean;
  wantsFinancing?: boolean;
  consultType?: string;
};

const MATCH_SELECT =
  "id, name, slug, city, state, category, verified, claimed_by, responds_to_inquiries, first_time_friendly, financing_options, consult_types, listing_tier, metro:metros(slug, name, state), business_photos(url, is_primary, sort_order)";

// Ranking is scored in application code rather than SQL: candidate pools per
// metro+category are small at MVP scale (tens, not thousands, of listings),
// so a weighted sum over a single fetched page is simpler than a bespoke
// ranking RPC and easy to tune as the preference set grows.
const TIER_WEIGHT: Record<Database["public"]["Enums"]["listing_tier"], number> = {
  featured: 30,
  verified: 15,
  free: 0,
};

export type MatchCandidate = Awaited<ReturnType<typeof fetchCandidates>>[number];

async function fetchCandidates(supabase: SupabaseClient<Database>, prefs: MatchPreferences) {
  const { data, error } = await supabase
    .from("businesses")
    .select(MATCH_SELECT)
    .eq("metro_id", prefs.metroId)
    .eq("category", prefs.category)
    .limit(100);

  if (error) throw new Error(`Match query failed: ${error.message}`);
  return data ?? [];
}

function scoreMatch(business: MatchCandidate, prefs: MatchPreferences) {
  let score = TIER_WEIGHT[business.listing_tier];
  const reasons: string[] = [];

  if (business.verified) score += 10;
  if (business.claimed_by) score += 5;
  if (business.responds_to_inquiries) {
    score += 5;
    reasons.push("Responds to inquiries");
  }
  if (prefs.wantsFirstTimeFriendly && business.first_time_friendly) {
    score += 15;
    reasons.push("First-time friendly");
  }
  if (prefs.wantsFinancing && (business.financing_options?.length ?? 0) > 0) {
    score += 15;
    reasons.push("Offers financing");
  }
  if (prefs.consultType && business.consult_types?.includes(prefs.consultType)) {
    score += 15;
    reasons.push(`Offers ${prefs.consultType.toLowerCase()}`);
  }

  return { score, reasons };
}

export async function getMatchedBusinesses(
  supabase: SupabaseClient<Database>,
  prefs: MatchPreferences,
  limit = 10
) {
  const candidates = await fetchCandidates(supabase, prefs);

  return candidates
    .map((business) => ({ business, ...scoreMatch(business, prefs) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
