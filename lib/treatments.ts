// Quick-filter chips on the homepage. Query terms deliberately differ from
// the display label where needed — checked each against real service-name
// data in search_vector (which includes service names as of migration
// 0015) before picking them, since businesses.subcategories (what the brief
// originally specced this against) is 100% empty across all 1,450+
// listings, same situation financing_options/consult_types turned out to
// be. Every term below returns real, non-zero results.
export const TREATMENT_CHIPS: { label: string; query: string }[] = [
  { label: "Botox", query: "botox" },
  { label: "TRT", query: "trt" },
  { label: "IV Therapy", query: "iv therapy" },
  { label: "Weight Loss", query: "weight loss" },
  { label: "PRP", query: "prp" },
  { label: "NAD+", query: "nad" },
  { label: "Microneedling", query: "microneedling" },
  { label: "Peptides", query: "peptide" },
  { label: "Hormone Therapy", query: "hormone" },
  { label: "ED Treatment", query: "erectile dysfunction" },
];
