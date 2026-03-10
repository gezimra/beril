import { env, hasSupabaseClientEnv } from "@/lib/env";

export const supabaseConfig = {
  url: env.client.supabaseUrl ?? "",
  anonKey: env.client.supabaseAnonKey ?? "",
};

export { hasSupabaseClientEnv };
