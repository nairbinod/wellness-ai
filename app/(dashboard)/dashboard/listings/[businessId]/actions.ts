"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type LeadStatus = Database["public"]["Enums"]["lead_status"];

function parseList(value: FormDataEntryValue | null) {
  return (value?.toString() ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function updateListing(businessId: string, formData: FormData) {
  const supabase = await createClient();

  // RLS ("owner update own business") independently enforces that this only
  // ever affects a business the signed-in user has claimed — this update
  // will simply affect 0 rows for anyone else, but we still scope the query
  // to businessId so a failed match doesn't silently touch another row.
  const name = formData.get("name")?.toString().trim();
  if (!name) {
    redirect(`/dashboard/listings/${businessId}?error=${encodeURIComponent("Business name is required.")}`);
  }

  const hours = formData
    .get("hours")
    ?.toString()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("businesses")
    .update({
      name: name!,
      address: formData.get("address")?.toString().trim() || null,
      city: formData.get("city")?.toString().trim() || null,
      state: formData.get("state")?.toString().trim() || null,
      zip: formData.get("zip")?.toString().trim() || null,
      hours: hours?.length ? hours : null,
      description: formData.get("description")?.toString().trim() || null,
      phone: formData.get("phone")?.toString().trim() || null,
      website: formData.get("website")?.toString().trim() || null,
      booking_url: formData.get("booking_url")?.toString().trim() || null,
      facebook_url: formData.get("facebook_url")?.toString().trim() || null,
      instagram_url: formData.get("instagram_url")?.toString().trim() || null,
      tiktok_url: formData.get("tiktok_url")?.toString().trim() || null,
      financing_options: parseList(formData.get("financing_options")),
      consult_types: parseList(formData.get("consult_types")),
      credentials: formData.get("credentials")?.toString().trim() || null,
      current_special: formData.get("current_special")?.toString().trim() || null,
      first_time_friendly: formData.get("first_time_friendly") === "yes",
      responds_to_inquiries: formData.get("responds_to_inquiries") === "yes",
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) {
    redirect(`/dashboard/listings/${businessId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/dashboard/listings/${businessId}`);
  redirect(`/dashboard/listings/${businessId}?saved=1`);
}

export async function updateLeadStatus(businessId: string, leadId: string, formData: FormData) {
  const status = formData.get("status")?.toString() as LeadStatus | undefined;
  if (!status) return;

  const supabase = await createClient();
  await supabase.from("leads").update({ status }).eq("id", leadId);

  revalidatePath(`/dashboard/listings/${businessId}`);
}

function parsePrice(value: FormDataEntryValue | null) {
  if (!value) return null;
  const n = Number(value.toString());
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function addService(businessId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name")?.toString().trim();
  if (!name) {
    redirect(`/dashboard/listings/${businessId}?error=${encodeURIComponent("Service name is required.")}`);
  }

  const priceMin = parsePrice(formData.get("price_min"));
  const priceMax = parsePrice(formData.get("price_max"));
  const duration = formData.get("duration_minutes")?.toString().trim();

  // RLS ("owner manage own services") independently enforces that this only
  // ever inserts against a business the signed-in user has claimed.
  const { error } = await supabase.from("services").insert({
    business_id: businessId,
    name: name!,
    category: formData.get("category")?.toString().trim() || null,
    price_min: priceMin,
    price_max: priceMax ?? priceMin,
    duration_minutes: duration ? Number(duration) || null : null,
    description: formData.get("description")?.toString().trim() || null,
  });

  if (error) {
    redirect(`/dashboard/listings/${businessId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/dashboard/listings/${businessId}`);
  redirect(`/dashboard/listings/${businessId}?saved=1`);
}

export async function deleteService(businessId: string, serviceId: string) {
  const supabase = await createClient();
  await supabase.from("services").delete().eq("id", serviceId);
  revalidatePath(`/dashboard/listings/${businessId}`);
}
