import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Backs the homepage neighborhood/city typeahead — distinct city values
// already stored on businesses (Frisco, Plano, McKinney, etc. under Dallas),
// not a new geo dataset. No PostgREST "distinct" support via the JS client,
// so this fetches a bounded batch and dedupes in code.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ cities: [] });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("city, metro:metros(slug, name, state)")
    .ilike("city", `${q}%`)
    .not("city", "is", null)
    .limit(300);

  if (error) {
    return NextResponse.json({ cities: [] }, { status: 500 });
  }

  const seen = new Map<string, { city: string; metroSlug: string; metroName: string; state: string | null }>();
  for (const row of data ?? []) {
    if (!row.city || !row.metro) continue;
    const key = `${row.city}|${row.metro.slug}`;
    if (!seen.has(key)) {
      seen.set(key, {
        city: row.city,
        metroSlug: row.metro.slug,
        metroName: row.metro.name,
        state: row.metro.state,
      });
    }
  }

  const cities = [...seen.values()]
    .sort((a, b) => a.city.localeCompare(b.city))
    .slice(0, 8);

  return NextResponse.json({ cities });
}
