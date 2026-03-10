import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { hasSupabaseClientEnv, supabaseConfig } from "@/lib/db/supabase/config";

export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!hasSupabaseClientEnv) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll can throw in read-only contexts, which is safe to ignore.
        }
      },
    },
  });
}
