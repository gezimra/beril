import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  const siteUrl = env.client.siteUrl.replace(/\/+$/, "");

  // Validate `next` is a relative path to prevent open redirects
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(`${siteUrl}${safeNext}`);
}
