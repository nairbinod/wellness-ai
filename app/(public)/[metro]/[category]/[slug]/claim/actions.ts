"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/jsonld";

const MAX_ATTEMPTS_PER_DAY = 3;
const STORAGE_BUCKET = "claim-documents";

export async function sendClaimMagicLink(claimPath: string, formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  if (!email) {
    redirect(`${claimPath}?error=${encodeURIComponent("Enter a valid email address.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: siteUrl(`/auth/callback?next=${encodeURIComponent(claimPath)}`),
    },
  });

  if (error) {
    redirect(`${claimPath}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`${claimPath}?sent=${encodeURIComponent(email)}`);
}

async function requireUser(claimPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(claimPath);
  return user;
}

// Per business, not per user — a coordinated code-guessing or dispute-spam
// attempt against one listing is what this guards against, matching the
// brief's "3/day per listing" framing.
async function withinRateLimit(businessId: string) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("claim_verifications")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", since);
  return (count ?? 0) < MAX_ATTEMPTS_PER_DAY;
}

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

async function finalizeClaim(businessId: string, userId: string) {
  const admin = createAdminClient();
  await admin
    .from("businesses")
    .update({ claimed_by: userId, claim_status: "verified", updated_at: new Date().toISOString() })
    .eq("id", businessId);
}

export async function verifyByEmailDomain(businessId: string, listingPath: string) {
  const claimPath = `${listingPath}/claim`;
  const user = await requireUser(claimPath);

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("website, claimed_by")
    .eq("id", businessId)
    .maybeSingle();
  if (!business) redirect(claimPath);
  if (business.claimed_by) {
    redirect(`${claimPath}?error=${encodeURIComponent("This listing is already claimed.")}`);
  }

  const emailHost = user.email ? emailDomain(user.email) : null;
  const siteHost = websiteDomain(business.website);
  if (!emailHost || !siteHost || emailHost !== siteHost) {
    redirect(
      `${claimPath}?error=${encodeURIComponent("Your email domain doesn't match this business's website.")}`
    );
  }

  if (!(await withinRateLimit(businessId))) {
    redirect(
      `${claimPath}?error=${encodeURIComponent("Too many claim attempts on this listing today. Try again tomorrow.")}`
    );
  }

  await admin.from("claim_verifications").insert({
    business_id: businessId,
    claimant_user_id: user.id,
    method: "email_domain",
    status: "verified",
    reviewed_at: new Date().toISOString(),
  });
  await finalizeClaim(businessId, user.id);

  revalidatePath(listingPath);
  redirect(`${listingPath}?claimed=1`);
}

export async function submitDocumentClaim(businessId: string, listingPath: string, formData: FormData) {
  const claimPath = `${listingPath}/claim`;
  const user = await requireUser(claimPath);

  const file = formData.get("document") as File | null;
  if (!file || file.size === 0) {
    redirect(`${claimPath}?error=${encodeURIComponent("Choose a file to upload.")}`);
  }
  if (file.size > 10 * 1024 * 1024) {
    redirect(`${claimPath}?error=${encodeURIComponent("File is too large (10MB max).")}`);
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("claimed_by")
    .eq("id", businessId)
    .maybeSingle();
  if (!business) redirect(claimPath);
  if (business.claimed_by) {
    redirect(`${claimPath}?error=${encodeURIComponent("This listing is already claimed.")}`);
  }

  if (!(await withinRateLimit(businessId))) {
    redirect(
      `${claimPath}?error=${encodeURIComponent("Too many claim attempts on this listing today. Try again tomorrow.")}`
    );
  }

  const ext = file.name.split(".").pop() || "bin";
  const path = `${businessId}/${user.id}-${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type || "application/octet-stream" });
  if (uploadError) {
    redirect(`${claimPath}?error=${encodeURIComponent("Upload failed. Try again.")}`);
  }

  await admin.from("claim_verifications").insert({
    business_id: businessId,
    claimant_user_id: user.id,
    method: "document",
    status: "pending",
    document_url: path,
  });
  await admin
    .from("businesses")
    .update({ claim_status: "pending_verification", updated_at: new Date().toISOString() })
    .eq("id", businessId);

  revalidatePath(claimPath);
  redirect(`${claimPath}?doc_submitted=1`);
}

// No dedicated "dispute" method — a dispute is a claim_verifications row
// whose *status* is disputed, filed against a listing someone else already
// holds. `document` is used as the method placeholder since a dispute
// always ends up needing the same admin review as a document submission.
export async function fileDispute(businessId: string, listingPath: string) {
  const claimPath = `${listingPath}/claim`;
  const user = await requireUser(claimPath);

  if (!(await withinRateLimit(businessId))) {
    redirect(
      `${claimPath}?error=${encodeURIComponent("Too many attempts on this listing today. Try again tomorrow.")}`
    );
  }

  const admin = createAdminClient();
  await admin.from("claim_verifications").insert({
    business_id: businessId,
    claimant_user_id: user.id,
    method: "document",
    status: "disputed",
  });

  revalidatePath(claimPath);
  redirect(`${claimPath}?disputed=1`);
}
