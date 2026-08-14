"use server";

import { createClient } from "@/lib/supabase/server";

export type LeadFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function submitLead(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const businessId = formData.get("business_id")?.toString();
  const consumerName = formData.get("consumer_name")?.toString().trim();
  const consumerEmail = formData.get("consumer_email")?.toString().trim();
  const consumerPhone = formData.get("consumer_phone")?.toString().trim();
  const serviceInterest = formData.get("service_interest")?.toString().trim();
  const message = formData.get("message")?.toString().trim();
  const sourcePage = formData.get("source_page")?.toString();
  const utmSource = formData.get("utm_source")?.toString();
  const utmMedium = formData.get("utm_medium")?.toString();
  const referrer = formData.get("referrer")?.toString();

  if (!businessId || !consumerName || !consumerEmail) {
    return { status: "error", message: "Name and email are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    business_id: businessId,
    consumer_name: consumerName,
    consumer_email: consumerEmail,
    consumer_phone: consumerPhone || null,
    service_interest: serviceInterest || null,
    message: message || null,
    source_page: sourcePage || null,
    utm_source: utmSource || null,
    utm_medium: utmMedium || null,
    referrer: referrer || null,
  });

  if (error) {
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  return {
    status: "success",
    message: "Thanks! The business will be in touch soon.",
  };
}
