import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { breadcrumbList, siteUrl } from "@/lib/jsonld";
import { CATEGORY_LABELS, CATEGORY_SLUGS, CATEGORY_TAG_CLASS, type BusinessCategory } from "@/lib/categories";
import { UseLocationButton } from "@/components/use-location-button";

async function getMetro(metroSlug: string) {
  const supabase = await createClient();
  const { data: metro } = await supabase
    .from("metros")
    .select("id, name, state, slug")
    .eq("slug", metroSlug)
    .maybeSingle();
  return metro;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ metro: string }>;
}): Promise<Metadata> {
  const { metro: metroSlug } = await params;
  const metro = await getMetro(metroSlug);
  if (!metro) return {};

  const title = `${metro.name}, ${metro.state} Med Spas, IV Therapy & Men's Health Clinics`;
  const description = `Browse med spas, IV therapy, and men's health clinics in ${metro.name}, ${metro.state}.`;

  return {
    title,
    description,
    alternates: { canonical: siteUrl(`/${metro.slug}`) },
  };
}

export default async function MetroPage({
  params,
  searchParams,
}: {
  params: Promise<{ metro: string }>;
  searchParams: Promise<{ lat?: string; lng?: string }>;
}) {
  const { metro: metroSlug } = await params;
  const { lat, lng } = await searchParams;
  const metro = await getMetro(metroSlug);
  if (!metro) notFound();

  const locationQuery = lat && lng ? `?lat=${lat}&lng=${lng}` : "";

  const supabase = await createClient();
  const categories = Object.keys(CATEGORY_LABELS) as BusinessCategory[];
  const counts = await Promise.all(
    categories.map((category) =>
      supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("metro_id", metro.id)
        .eq("category", category)
    )
  );

  const jsonLd = breadcrumbList([
    { name: "Home", path: "/" },
    { name: `${metro.name}, ${metro.state}`, path: `/${metro.slug}` },
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-2xl font-semibold tracking-tight">
        {metro.name}, {metro.state}
      </h1>
      <p className="mt-4 text-ink-soft">
        Browse med spas, IV therapy, and men&apos;s health clinics in{" "}
        {metro.name}.
      </p>

      {!locationQuery ? (
        <div className="mt-4">
          <UseLocationButton mode="refine-page" />
          <p className="mt-1.5 text-xs text-ink-soft">
            Sort listings by distance from you once you pick a category.
          </p>
        </div>
      ) : null}
      <div className="mt-8 grid gap-[1px] border border-rule bg-rule sm:grid-cols-3">
        {categories.map((category, i) => {
          const tag = CATEGORY_TAG_CLASS[category];
          return (
            <Link
              key={category}
              href={`/${metro.slug}/${CATEGORY_SLUGS[category]}${locationQuery}`}
              className={`border-b-[3px] bg-paper p-6 hover:bg-paper-raised ${tag.borderBottom}`}
            >
              <div className={`font-mono text-[11px] tracking-wider uppercase ${tag.text}`}>
                Vertical
              </div>
              <div className="mt-2 text-lg font-semibold">{CATEGORY_LABELS[category]}</div>
              <div className="mt-2.5 font-mono text-[13px] text-ink-soft">
                {counts[i].count ?? 0} listing
                {counts[i].count === 1 ? "" : "s"}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
