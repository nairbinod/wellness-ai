import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/jsonld";
import { CATEGORY_SLUGS, type BusinessCategory } from "@/lib/categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: metros }, { data: businesses }] = await Promise.all([
    supabase.from("metros").select("slug, created_at"),
    supabase.from("businesses").select("slug, category, metro:metros(slug), updated_at"),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), changeFrequency: "daily", priority: 1 },
    // Static content pages — not query-generated, so listed directly rather
    // than derived. Blog/Guides are deliberately excluded: both are
    // `noindex` (no real content yet), so listing them would just be noise.
    { url: siteUrl("/about"), changeFrequency: "monthly", priority: 0.3 },
    { url: siteUrl("/how-it-works"), changeFrequency: "monthly", priority: 0.3 },
    { url: siteUrl("/faq"), changeFrequency: "monthly", priority: 0.3 },
    { url: siteUrl("/privacy"), changeFrequency: "yearly", priority: 0.1 },
    { url: siteUrl("/terms"), changeFrequency: "yearly", priority: 0.1 },
    { url: siteUrl("/cookie-policy"), changeFrequency: "yearly", priority: 0.1 },
  ];

  for (const metro of metros ?? []) {
    entries.push({
      url: siteUrl(`/${metro.slug}`),
      lastModified: metro.created_at,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Only list metro/category combinations that actually have listings —
  // an empty category page is thin content and shouldn't be crawled as if
  // it were canonical.
  const populatedCategories = new Set<string>();
  for (const business of businesses ?? []) {
    if (business.metro) populatedCategories.add(`${business.metro.slug}/${business.category}`);
  }
  for (const key of populatedCategories) {
    const [metroSlug, category] = key.split("/") as [string, BusinessCategory];
    entries.push({
      url: siteUrl(`/${metroSlug}/${CATEGORY_SLUGS[category]}`),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  for (const business of businesses ?? []) {
    if (!business.metro) continue;
    entries.push({
      url: siteUrl(`/${business.metro.slug}/${CATEGORY_SLUGS[business.category]}/${business.slug}`),
      lastModified: business.updated_at,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
