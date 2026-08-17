"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, notificationTable, SITE_OWNER_EMAIL } from "@/lib/email";

export type LeadFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const MAX_LEADS_PER_IP_PER_HOUR = 5;
const SUCCESS_STATE: LeadFormState = {
  status: "success",
  message: "Thanks! The business will be in touch soon.",
};

async function notifyNewLead(lead: {
  businessName: string;
  consumerName: string;
  consumerEmail: string;
  consumerPhone: string | null;
  serviceInterest: string | null;
  message: string | null;
  sourcePage: string | null;
}) {
  await sendEmail({
    to: SITE_OWNER_EMAIL,
    subject: `New lead: ${lead.businessName}`,
    html: notificationTable([
      ["Business", lead.businessName],
      ["Name", lead.consumerName],
      ["Email", lead.consumerEmail],
      ["Phone", lead.consumerPhone ?? "—"],
      ["Interested in", lead.serviceInterest ?? "—"],
      ["Message", lead.message ?? "—"],
      ["Source page", lead.sourcePage ?? "—"],
    ]),
  });
}

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
  if (formData.get("hp_field")?.toString().trim()) {
    console.warn("Lead form honeypot triggered — submission dropped as spam.");
    return SUCCESS_STATE;
  }

  const businessId = formData.get("business_id")?.toString();
  const businessName = formData.get("business_name")?.toString().trim() || "Unknown business";
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

  // Awaited (not fire-and-forget) — Vercel's serverless runtime can freeze
  // the function the instant the response is sent, so an un-awaited promise
  // here risks never actually completing the fetch to Resend. Still
  // best-effort in the sense that a failure here doesn't turn into a
  // user-facing error — the lead is already saved either way.
  try {
    await notifyNewLead({
      businessName,
      consumerName,
      consumerEmail,
      consumerPhone: consumerPhone || null,
      serviceInterest: serviceInterest || null,
      message: message || null,
      sourcePage: sourcePage || null,
    });
  } catch (err) {
    console.error("Lead notification email failed:", err);
  }

  return SUCCESS_STATE;
}
