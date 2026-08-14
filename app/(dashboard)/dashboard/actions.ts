"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/jsonld";

export async function sendDashboardMagicLink(formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  if (!email) {
    redirect(`/dashboard?error=${encodeURIComponent("Enter a valid email address.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: siteUrl(`/auth/callback?next=${encodeURIComponent("/dashboard")}`) },
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/dashboard?sent=${encodeURIComponent(email)}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/dashboard");
}
