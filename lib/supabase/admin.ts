import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Service-role client: bypasses RLS entirely. Only for trusted server-side
// contexts that don't have a user session to scope queries by — e.g. the
// Stripe webhook, which needs to write subscriptions/businesses rows on
// behalf of events Stripe sends outside any user's request.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
