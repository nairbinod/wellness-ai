// Thin wrapper over Resend's REST API (raw fetch, no SDK dependency — same
// pattern as the Google Places import script). RESEND_API_KEY already exists
// in .env.local; it was previously only referenced by Supabase Auth's SMTP
// relay, this is the first direct app-code use of it.
const RESEND_API_URL = "https://api.resend.com/emails";

// resend.dev's shared sender only delivers to the Resend account's own
// verified email — fine here since the only recipient is the site owner.
// Swap to a verified custom-domain sender once one exists.
const FROM_ADDRESS = "PrimeNearby <onboarding@resend.dev>";

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
