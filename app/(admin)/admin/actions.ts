"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/jsonld";
import type { Database } from "@/lib/types/database";

type ListingTier = Database["public"]["Enums"]["listing_tier"];
type BusinessCategory = Database["public"]["Enums"]["business_category"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Two businesses can legitimately share a name+city (e.g. two locations of
// the same brand, or an unrelated business with a common name) — rather
// than reject the second one on a raw unique-constraint error, disambiguate
// the slug automatically.
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string
): Promise<string> {
  let slug = base;
  for (let suffix = 2; ; suffix++) {
    const { data } = await supabase.from("businesses").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${suffix}`;
  }
}

export async function sendAdminMagicLink(formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  if (!email) {
    redirect(`/admin?error=${encodeURIComponent("Enter a valid email address.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: siteUrl(`/auth/callback?next=${encodeURIComponent("/admin")}`) },
  });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/admin?sent=${encodeURIComponent(email)}`);
}

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin");
}

export async function addMetro(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const state = formData.get("state")?.toString().trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const radiusMiles = Number(formData.get("radius_miles")) || 25;

  if (!name || !state || Number.isNaN(lat) || Number.isNaN(lng)) {
    redirect(`/admin/metros?error=${encodeURIComponent("Metro name, state, lat, lng are required.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("metros").insert({
    name,
    state,
    slug: slugify(name),
    lat,
    lng,
    radius_miles: radiusMiles,
  });

  if (error) {
    redirect(`/admin/metros?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/metros");
  redirect("/admin/metros?saved=1");
}

export async function updateBusinessModeration(businessId: string, formData: FormData) {
  const verified = formData.get("verified") === "yes";
  const listingTier = formData.get("listing_tier")?.toString() as ListingTier;

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ verified, listing_tier: listingTier, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) {
    redirect(`/admin/listings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/listings");
  redirect("/admin/listings?saved=1");
}

export async function addBusiness(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const category = formData.get("category")?.toString() as BusinessCategory;
  const metroId = formData.get("metro_id")?.toString();
  const city = formData.get("city")?.toString().trim();
  const state = formData.get("state")?.toString().trim();

  if (!name || !category || !metroId) {
    redirect(`/admin/listings?error=${encodeURIComponent("Business name, category, and metro are required.")}`);
  }

  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, slugify(`${name}-${city || "listing"}`));
  const { error } = await supabase.from("businesses").insert({
    name,
    slug,
    category,
    metro_id: metroId,
    city: city || null,
    state: state || null,
  });

  if (error) {
    redirect(`/admin/listings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/listings");
  redirect("/admin/listings?saved=1");
}

export async function updateLeadStatusAdmin(leadId: string, formData: FormData) {
  const status = formData.get("status")?.toString() as LeadStatus | undefined;
  if (!status) return;

  const supabase = await createClient();
  await supabase.from("leads").update({ status }).eq("id", leadId);

  revalidatePath("/admin/leads");
}

async function currentAdminId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function approveDocumentClaim(verificationId: string) {
  const admin = createAdminClient();
  const { data: verification } = await admin
    .from("claim_verifications")
    .select("business_id, claimant_user_id")
    .eq("id", verificationId)
    .maybeSingle();
  if (!verification) redirect(`/admin/claims?error=${encodeURIComponent("Claim not found.")}`);

  const reviewedBy = await currentAdminId();
  await admin
    .from("claim_verifications")
    .update({ status: "verified", reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", verificationId);
  await admin
    .from("businesses")
    .update({ claimed_by: verification.claimant_user_id, claim_status: "verified", updated_at: new Date().toISOString() })
    .eq("id", verification.business_id);

  revalidatePath("/admin/claims");
  redirect("/admin/claims?saved=1");
}

export async function rejectDocumentClaim(verificationId: string) {
  const admin = createAdminClient();
  const { data: verification } = await admin
    .from("claim_verifications")
    .select("business_id")
    .eq("id", verificationId)
    .maybeSingle();

  const reviewedBy = await currentAdminId();
  await admin
    .from("claim_verifications")
    .update({ status: "rejected", reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", verificationId);
  if (verification) {
    await admin
      .from("businesses")
      .update({ claim_status: "unclaimed", updated_at: new Date().toISOString() })
      .eq("id", verification.business_id);
  }

  revalidatePath("/admin/claims");
  redirect("/admin/claims?saved=1");
}

export async function approveDispute(verificationId: string) {
  const admin = createAdminClient();
  const { data: verification } = await admin
    .from("claim_verifications")
    .select("business_id, claimant_user_id")
    .eq("id", verificationId)
    .maybeSingle();
  if (!verification) redirect(`/admin/claims?error=${encodeURIComponent("Dispute not found.")}`);

  const reviewedBy = await currentAdminId();
  await admin
    .from("claim_verifications")
    .update({ status: "verified", reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", verificationId);
  // Reassigning ownership on dispute approval — the previous owner's claim
  // isn't separately tracked as a claim_verifications row (the original
  // instant-claim flow predates this table), so there's nothing else to
  // update beyond businesses.claimed_by itself.
  await admin
    .from("businesses")
    .update({ claimed_by: verification.claimant_user_id, claim_status: "verified", updated_at: new Date().toISOString() })
    .eq("id", verification.business_id);

  revalidatePath("/admin/claims");
  redirect("/admin/claims?saved=1");
}

export async function rejectDispute(verificationId: string) {
  const admin = createAdminClient();
  const reviewedBy = await currentAdminId();
  await admin
    .from("claim_verifications")
    .update({ status: "rejected", reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", verificationId);

  revalidatePath("/admin/claims");
  redirect("/admin/claims?saved=1");
}
