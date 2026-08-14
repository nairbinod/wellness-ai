import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export async function getAdminUser(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isAdmin: false as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { user, isAdmin: profile?.role === "admin" };
}
