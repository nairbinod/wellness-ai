import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getMatchedBusinesses } from "@/lib/matching";
import { primaryPhoto } from "@/lib/search";
import { TrustBadgePills } from "@/components/trust-badges";
import { CATEGORY_LABELS, CATEGORY_SLUGS, type BusinessCategory } from "@/lib/categories";

function isBusinessCategory(value: string): value is BusinessCategory {
  return value in CATEGORY_LABELS;
}

const CONSULT_TYPE_OPTIONS = ["In-Person Consultation", "Virtual Consultation", "Free Consultation"];

export const metadata: Metadata = {
  title: "Get Matched",
  robots: { index: false, follow: true },
};

export default async function GetMatchedPage({
  searchParams,
}: {
  searchParams: Promise<{
    metro?: string;
    category?: string;
    first_time?: string;
    financing?: string;
    consult_type?: string;
  }>;
}) {
  const {
    metro: metroSlug,
    category: categoryParam,
    first_time: firstTime,
    financing,
    consult_type: consultType,
  } = await searchParams;
  const category = categoryParam && isBusinessCategory(categoryParam) ? categoryParam : undefined;

  const supabase = await createClient();
  const { data: metros } = await supabase.from("metros").select("id, slug, name, state").order("name");
  const selectedMetro = metros?.find((m) => m.slug === metroSlug);

  const hasAnswers = Boolean(selectedMetro && category);
  const matches = hasAnswers
    ? await getMatchedBusinesses(supabase, {
        metroId: selectedMetro!.id,
        category: category!,
        wantsFirstTimeFriendly: firstTime === "yes",
        wantsFinancing: financing === "yes",
        consultType: consultType || undefined,
      })
    : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Get Matched</h1>
      <p className="mt-2 text-ink-soft">
        Answer a few questions and we&apos;ll rank the best options for you.
      </p>

      <form className="mt-8 grid gap-4 sm:grid-cols-2" action="/get-matched">
        <div>
          <label className="block text-sm font-medium" htmlFor="metro">
            Metro
          </label>
          <select
            id="metro"
            name="metro"
            required
            defaultValue={metroSlug ?? ""}
            className="mt-1 w-full border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
          >
            <option value="" disabled>
              Choose a metro…
            </option>
            {metros?.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}, {m.state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="category">
            What are you looking for?
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={category ?? ""}
            className="mt-1 w-full border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
          >
            <option value="" disabled>
              Choose a category…
            </option>
            {(Object.keys(CATEGORY_LABELS) as BusinessCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="consult_type">
            Preferred consultation
          </label>
          <select
            id="consult_type"
            name="consult_type"
            defaultValue={consultType ?? ""}
            className="mt-1 w-full border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal"
          >
            <option value="">No preference</option>
            {CONSULT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="first_time" value="yes" defaultChecked={firstTime === "yes"} />
            I&apos;m a first-time client
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="financing" value="yes" defaultChecked={financing === "yes"} />I
            need financing / payment plans
          </label>
        </div>

        <button
          type="submit"
          className="bg-teal px-5 py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink sm:col-span-2"
        >
          Find my matches
        </button>
      </form>

      {!hasAnswers ? null : matches.length === 0 ? (
        <p className="mt-10 text-ink-soft">
          No listings in {selectedMetro!.name} match yet.{" "}
          <Link href={`/${selectedMetro!.slug}/${CATEGORY_SLUGS[category!]}`} className="text-teal hover:underline">
            Browse all {CATEGORY_LABELS[category!]} in {selectedMetro!.name}
          </Link>{" "}
          instead.
        </p>
      ) : (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">
            Your top matches in {selectedMetro!.name}, {selectedMetro!.state}
          </h2>
          <ul className="mt-4 space-y-3">
            {matches.map(({ business, reasons }, i) => {
              const photo = primaryPhoto(business.business_photos);
              const metroInfo = business.metro;

              return (
                <li key={business.id}>
                  <Link
                    href={`/${metroInfo?.slug}/${CATEGORY_SLUGS[business.category]}/${business.slug}`}
                    className="flex gap-4 border border-rule-strong p-4 hover:border-ink"
                  >
                    <div className="flex h-8 w-8 flex-none items-center justify-center border border-rule-strong font-mono text-sm text-ink-soft">
                      {i + 1}
                    </div>
                    <div className="relative aspect-[4/3] w-32 flex-none border border-rule bg-paper-raised">
                      {photo ? (
                        <Image src={photo.url} alt={business.name} fill sizes="128px" className="object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <h3 className="font-semibold">{business.name}</h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        {business.city}, {business.state}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <TrustBadgePills business={business} />
                      </div>
                      {reasons.length ? (
                        <p className="mt-2 font-mono text-xs text-ink-soft">
                          Matched on: {reasons.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
