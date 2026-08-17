// Thin wrapper over Resend's REST API (raw fetch, no SDK dependency — same
// pattern as the Google Places import script). RESEND_API_KEY already exists
// in .env.local; it was previously only referenced by Supabase Auth's SMTP
// relay, this is the first direct app-code use of it.
const RESEND_API_URL = "https://api.resend.com/emails";

const FROM_ADDRESS = "PrimeNearby <notifications@primenearby.com>";

export const SITE_OWNER_EMAIL = "nairbinod@gmail.com";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });

  if (!res.ok) {
    throw new Error(`Resend send failed (${res.status}): ${await res.text()}`);
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function notificationTable(rows: [string, string][]) {
  return `<table>${rows
    .map(([label, value]) => `<tr><td><strong>${label}</strong></td><td>${escapeHtml(value)}</td></tr>`)
    .join("")}</table>`;
}
