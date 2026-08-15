"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type LeadFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const MAX_LEADS_PER_IP_PER_HOUR = 5;
const SUCCESS_STATE: LeadFormState = {
  status: "success",
  message: "Thanks! The business will be in touch soon.",
};

function clientIp(headerList: Headers) {
  // Vercel (and most proxies) set x-forwarded-for as "client, proxy1, proxy2…"
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip");
}

async function withinRateLimit(ip: string | null) {
  if (!ip) return true;
  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", since);
  return (count ?? 0) < MAX_LEADS_PER_IP_PER_HOUR;
}

export async function submitLead(
  _prevState: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  // Honeypot — real users never see or fill this field (see lead-form.tsx),
  // so anything in it is a bot. Report success without writing a row, so
  // scripted bots don't get a signal to adjust and retry.
  if (formData.get("company_website")?.toString().trim()) {
    return SUCCESS_STATE;
  }

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

  const ip = clientIp(await headers());
  if (!(await withinRateLimit(ip))) {
    return {
      status: "error",
      message: "Too many requests from this connection. Please try again later.",
    };
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
    ip_address: ip,
  });

  if (error) {
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  return SUCCESS_STATE;
}
