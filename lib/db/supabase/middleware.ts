import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

import { hasSupabaseClientEnv, supabaseConfig } from "@/lib/db/supabase/config";

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
): SupabaseClient | null {
  if (!hasSupabaseClientEnv) {
    return null;
  }

  return createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}
