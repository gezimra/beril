import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env, hasSupabaseServiceEnv } from "@/lib/env";

let serviceClient: SupabaseClient | null = null;

export function createSupabaseServiceClient(): SupabaseClient | null {
  if (!hasSupabaseServiceEnv || !env.server.supabaseServiceRoleKey) {
    return null;
  }

  if (!serviceClient) {
    serviceClient = createClient(
      env.client.supabaseUrl ?? "",
      env.server.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return serviceClient;
}
