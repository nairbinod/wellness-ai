"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, notificationTable, SITE_OWNER_EMAIL } from "@/lib/email";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const MAX_SUBMISSIONS_PER_IP_PER_HOUR = 5;
const SUCCESS_STATE: ContactFormState = {
  status: "success",
  message: "Thanks — we'll get back to you soon.",
};

function clientIp(headerList: Headers) {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip");
}

async function withinRateLimit(ip: string | null) {
  if (!ip) return true;
  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("contact_submissions")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", since);
  return (count ?? 0) < MAX_SUBMISSIONS_PER_IP_PER_HOUR;
}

async function notifyContactSubmission(submission: {
  name: string;
  businessName: string | null;
  email: string;
  phone: string | null;
  message: string;
}) {
  await sendEmail({
    to: SITE_OWNER_EMAIL,
    subject: `New provider contact: ${submission.businessName || submission.name}`,
    html: notificationTable([
      ["Name", submission.name],
      ["Business", submission.businessName ?? "—"],
      ["Email", submission.email],
      ["Phone", submission.phone ?? "—"],
      ["Message", submission.message],
    ]),
  });
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Honeypot — see contact-form.tsx. Real users never see or fill this
  // field, so anything in it means a bot; report success without writing a
  // row so scripted submitters get no signal to adjust and retry.
  if (formData.get("hp_field")?.toString().trim()) {
    console.warn("Contact form honeypot triggered — submission dropped as spam.");
    return SUCCESS_STATE;
  }

  const name = formData.get("name")?.toString().trim();
  const businessName = formData.get("business_name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  if (!name || !email || !message) {
    return { status: "error", message: "Name, email, and message are required." };
  }

  const ip = clientIp(await headers());
  if (!(await withinRateLimit(ip))) {
    return {
      status: "error",
      message: "Too many requests from this connection. Please try again later.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name,
    business_name: businessName || null,
    email,
    phone: phone || null,
    message,
    ip_address: ip,
  });

  if (error) {
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  // Awaited (not fire-and-forget) — Vercel's serverless runtime can freeze
  // the function the instant the response is sent, so an un-awaited promise
  // here risks never actually completing the fetch to Resend. Still
  // best-effort in the sense that a failure here doesn't turn into a
  // user-facing error — the submission is already saved either way.
  try {
    await notifyContactSubmission({
      name,
      businessName: businessName || null,
      email,
      phone: phone || null,
      message,
    });
  } catch (err) {
    console.error("Contact notification email failed:", err);
  }

  return SUCCESS_STATE;
}
