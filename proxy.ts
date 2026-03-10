import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/db/supabase/middleware";

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const unauthorized = new URL("/login", request.url);
  unauthorized.searchParams.set("next", request.nextUrl.pathname);

  const response = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(request, response);

  if (!supabase) {
    const allowDevBypass =
      process.env.NODE_ENV === "development" &&
      process.env.ALLOW_DEV_ADMIN_BYPASS === "true";
    if (allowDevBypass) {
      return response;
    }
    return NextResponse.redirect(unauthorized);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(unauthorized);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "owner") {
    return NextResponse.redirect(unauthorized);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
