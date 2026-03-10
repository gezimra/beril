"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { hasSupabaseClientEnv, supabaseConfig } from "@/lib/db/supabase/config";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient | null {
  if (!hasSupabaseClientEnv) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
    );
  }

  return browserClient;
}
