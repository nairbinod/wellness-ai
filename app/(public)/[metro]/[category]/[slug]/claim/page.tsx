import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categoryFromSlug } from "@/lib/categories";
import { sendClaimMagicLink, verifyByEmailDomain, submitDocumentClaim, fileDispute } from "./actions";

const inputClass = "border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal";

function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase();
}

function websiteDomain(website: string | null) {
  if (!website) return null;
  try {
    const host = new URL(website).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ metro: string; category: string; slug: string }>;
  searchParams: Promise<{
    error?: string;
    sent?: string;
    doc_submitted?: string;
    disputed?: string;
  }>;
}) {
  const { metro: metroSlug, category: categorySlug, slug } = await params;
  const { error, sent, doc_submitted: docSubmitted, disputed } = await searchParams;
  const category = categoryFromSlug(categorySlug);
  if (!category) notFound();

  const supabase = await createClient();

  const { data: metro } = await supabase
    .from("metros")
    .select("id, slug, name, state")
    .eq("slug", metroSlug)
    .maybeSingle();
  if (!metro) notFound();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, website, claimed_by, claim_status")
    .eq("metro_id", metro.id)
    .eq("category", category)
    .eq("slug", slug)
    .maybeSingle();
  if (!business) notFound();

  const listingPath = `/${metro.slug}/${categorySlug}/${slug}`;
  const claimPath = `${listingPath}/claim`;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myDispute: { status: string } | null = null;

  if (user) {
    const { data: attempts } = await supabase
      .from("claim_verifications")
      .select("status")
      .eq("business_id", business.id)
      .eq("claimant_user_id", user.id)
      .eq("status", "disputed")
      .limit(1);

    myDispute = attempts?.[0] ?? null;
  }

  const alreadyClaimedByMe = business.claimed_by && business.claimed_by === user?.id;
  const claimedBySomeoneElse = business.claimed_by && business.claimed_by !== user?.id;

  const emailMatches =
    user?.email && websiteDomain(business.website) && emailDomain(user.email) === websiteDomain(business.website);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <nav className="text-sm text-ink-soft">
        <Link href={listingPath} className="hover:text-teal">
          ← Back to {business.name}
        </Link>
      </nav>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Claim this business</h1>

      {alreadyClaimedByMe ? (
        <p className="mt-6 text-ink-soft">
          You&apos;ve already claimed {business.name}.{" "}
          <Link href="/dashboard" className="text-teal underline">
            Go to your dashboard
          </Link>
          .
        </p>
      ) : claimedBySomeoneElse ? (
        <div className="mt-6">
          <p className="text-ink-soft">{business.name} has already been claimed by its owner.</p>
          {!user ? (
            <p className="mt-2 text-sm text-ink-soft">Sign in below if you believe this is an error.</p>
          ) : myDispute ? (
            <p className="mt-4 border border-gold px-3 py-2 text-sm text-gold">
              Your dispute has been filed and is awaiting admin review.
            </p>
          ) : (
            <form action={fileDispute.bind(null, business.id, listingPath)} className="mt-4">
              <p className="text-sm text-ink-soft">
                Believe this is wrong — a franchise conflict, an ownership change, or someone else
                incorrectly claimed it? File a dispute for admin review.
              </p>
              <button
                type="submit"
                className="mt-3 border border-rule-strong px-5 py-2.5 font-mono text-xs tracking-wider uppercase hover:border-ink"
              >
                File a dispute
              </button>
            </form>
          )}
        </div>
      ) : !user ? (
        <>
          <p className="mt-6 text-ink-soft">
            Enter the email address associated with {business.name} and we&apos;ll send you a
            sign-in link to verify ownership.
          </p>
          <form action={sendClaimMagicLink.bind(null, claimPath)} className="mt-4 flex gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="you@business.com"
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="submit"
              className="bg-teal px-5 py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink"
            >
              Send link
            </button>
          </form>
          {sent ? <p className="mt-3 text-sm text-teal">Check {sent} for a sign-in link.</p> : null}
        </>
      ) : docSubmitted ? (
        <p className="mt-6 border border-gold px-3 py-2 text-sm text-gold">
          Document received — an admin will review it and you&apos;ll gain access once approved.
        </p>
      ) : disputed ? (
        <p className="mt-6 border border-gold px-3 py-2 text-sm text-gold">
          Your dispute has been filed and is awaiting admin review.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          <p className="text-ink-soft">
            Signed in as <strong className="text-ink">{user.email}</strong>. Pick a way to verify
            you own or manage {business.name}.
          </p>

          {emailMatches ? (
            <div className="border border-teal p-4">
              <div className="font-mono text-[11px] tracking-wider uppercase text-teal">
                Fastest — email domain match
              </div>
              <p className="mt-1.5 text-sm text-ink-soft">
                Your sign-in email matches this business&apos;s own website domain.
              </p>
              <form action={verifyByEmailDomain.bind(null, business.id, listingPath)} className="mt-3">
                <button
                  type="submit"
                  className="bg-teal px-5 py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink"
                >
                  Verify instantly
                </button>
              </form>
            </div>
          ) : null}

          <div className="border border-rule-strong p-4">
            <div className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
              Document upload
            </div>
            <p className="mt-1.5 text-sm text-ink-soft">
              No matching email on file? Upload a business license, EIN letter, or utility bill
              matching the listed address — reviewed by an admin.
            </p>
            <form
              action={submitDocumentClaim.bind(null, business.id, listingPath)}
              className="mt-3 flex flex-col gap-2"
            >
              <input
                type="file"
                name="document"
                required
                accept=".pdf,.png,.jpg,.jpeg"
                className="text-sm"
              />
              <button
                type="submit"
                className="self-start border border-rule-strong px-5 py-2.5 font-mono text-xs tracking-wider uppercase hover:border-ink"
              >
                Submit for review
              </button>
            </form>
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-4 border border-red-400 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </main>
  );
}
