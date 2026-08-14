import { createClient } from "@/lib/supabase/server";
import { siteUrl, SITE_NAME } from "@/lib/jsonld";
import { CATEGORY_LABELS, CATEGORY_SLUGS, type BusinessCategory } from "@/lib/categories";

export async function GET() {
  const supabase = await createClient();
  const { data: metros } = await supabase.from("metros").select("slug, name, state").order("name");

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

> ${SITE_NAME} is a local business directory for the wellness & aesthetics industry — med spas, IV/infusion therapy, and men's health/TRT clinics. Every listing page is server-rendered with full details (name, address, phone, services, real pricing where available) and schema.org LocalBusiness/MedicalBusiness/MedicalClinic JSON-LD, so agents and crawlers get complete structured data without executing JavaScript.

## What this site offers

- Local business listings with verified/claimed status, trust badges (Verified, Owner Verified, Responds to Inquiries, First-Time Friendly), financing options, and consultation types
- Real per-service pricing where businesses have provided it (services table, reflected in each listing's \`priceRange\` and \`hasOfferCatalog\` JSON-LD)
- Full-text search: ${siteUrl("/search")}
- Preference-matching quiz: ${siteUrl("/get-matched")}

## Metros

${metroLines || "- (no metros live yet)"}

## Structured data

Every listing page includes \`BreadcrumbList\` and \`LocalBusiness\`/\`MedicalBusiness\`/\`MedicalClinic\` JSON-LD. A machine-readable sitemap is available at ${siteUrl("/sitemap.xml")}.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
