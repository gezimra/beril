import { createSupabaseServerClient } from "@/lib/db/supabase/server";

export async function verifyAdminSession() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Unauthorized: auth service unavailable");
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized: not authenticated");
  }

  return user;
}

export async function checkIsAdminUser(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return false;
  }

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role === "owner";
}
