import type { Database } from "@/lib/types/database";

export type BusinessCategory = Database["public"]["Enums"]["business_category"];

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  med_spa: "Med Spas",
  iv_therapy: "IV Therapy",
  mens_health: "Men's Health",
};

// The businesses.category enum values (med_spa, iv_therapy, mens_health) are
// the DB representation; URLs use hyphenated, pluralized slugs instead
// (med-spas, iv-therapy, mens-health) for readability and SEO.
export const CATEGORY_SLUGS: Record<BusinessCategory, string> = {
  med_spa: "med-spas",
  iv_therapy: "iv-therapy",
  mens_health: "mens-health",
};

// Registry design system: each vertical gets one quiet tag color, used as a
// small text label plus a bottom-edge "index tab" border — never a filled
// badge or rounded rail.
export const CATEGORY_TAG_CLASS: Record<
  BusinessCategory,
  { text: string; bg: string; border: string; borderBottom: string }
> = {
  med_spa: {
    text: "text-tag-medspa",
    bg: "bg-tag-medspa-bg",
    border: "border-tag-medspa",
    borderBottom: "border-b-tag-medspa",
  },
  iv_therapy: {
    text: "text-tag-iv",
    bg: "bg-tag-iv-bg",
    border: "border-tag-iv",
    borderBottom: "border-b-tag-iv",
  },
  mens_health: {
    text: "text-tag-mens",
    bg: "bg-tag-mens-bg",
    border: "border-tag-mens",
    borderBottom: "border-b-tag-mens",
  },
};

const CATEGORY_BY_SLUG: Record<string, BusinessCategory> = Object.fromEntries(
  (Object.keys(CATEGORY_SLUGS) as BusinessCategory[]).map((category) => [
    CATEGORY_SLUGS[category],
    category,
  ])
);

export function categoryFromSlug(slug: string): BusinessCategory | undefined {
  return CATEGORY_BY_SLUG[slug];
}
