import { createClient } from "@/lib/supabase/server";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";
import { CATEGORY_LABELS, CATEGORY_SLUGS, type BusinessCategory } from "@/lib/categories";

export async function GET() {
  const supabase = await createClient();
  const [{ data: metros }, { count: businessCount }] = await Promise.all([
    supabase.from("metros").select("slug, name, state").order("name"),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
  ]);

  const categories = Object.keys(CATEGORY_LABELS) as BusinessCategory[];

  const metroLines = (metros ?? [])
    .map((metro) => {
      const categoryLinks = categories
        .map((c) => `[${CATEGORY_LABELS[c]}](${siteUrl(`/${metro.slug}/${CATEGORY_SLUGS[c]}`)})`)
        .join(", ");
      return `- [${metro.name}, ${metro.state}](${siteUrl(`/${metro.slug}`)}): ${categoryLinks}`;
    })
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_NAME} is a local business directory for the wellness & aesthetics industry — med spas, IV/infusion therapy, and men's health/TRT clinics. Every listing page is server-rendered with full details (name, address, phone, services, real pricing where available) and schema.org LocalBusiness/MedicalBusiness/MedicalClinic JSON-LD, so agents and crawlers get complete structured data without executing JavaScript. ${businessCount ?? "Hundreds of"} listings live across ${metros?.length ?? 0} metros as of this writing.

## What this site offers

- Local business listings with verified/claimed status, trust badges (Verified, Owner Verified, Responds to Inquiries, First-Time Friendly), financing options, and consultation types
- Real per-service pricing where businesses have provided it (services table, reflected in each listing's \`priceRange\` and \`hasOfferCatalog\` JSON-LD)
- Full-text search, including treatment-name queries (Botox, TRT, IV therapy, NAD+, etc.): ${siteUrl("/search")}
- Neighborhood/suburb search beyond the top-level metros (e.g. Frisco, Plano, Marietta) via city search
- Geolocation-based "near me" distance sorting on category and search pages
- Preference-matching quiz: ${siteUrl("/get-matched")}
- Compare Mode — side-by-side comparison of 2-4 listings on price, services, reviews, financing, distance, online booking, and credentials: ${siteUrl("/compare")}
- For businesses: claim a listing free, or upgrade to a flat $99/mo Featured tier — ${siteUrl("/for-providers")}

## Metros

${metroLines || "- (no metros live yet)"}

## Also useful

- FAQ (with FAQPage structured data): ${siteUrl("/faq")}
- How It Works: ${siteUrl("/how-it-works")}
- About: ${siteUrl("/about")}

## Structured data

Every listing page includes \`BreadcrumbList\` and \`LocalBusiness\`/\`MedicalBusiness\`/\`MedicalClinic\` JSON-LD; the FAQ page includes \`FAQPage\` JSON-LD. A machine-readable sitemap is available at ${siteUrl("/sitemap.xml")}.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
