import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/db/supabase/middleware";

const SUPPORTED_LOCALES = ["sq", "en"] as const;
const DEFAULT_LOCALE = "sq";
const LOCALE_COOKIE_NAME = "locale";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function detectLocaleFromHeader(acceptLanguage: string | null): string {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, q = "q=1"] = lang.trim().split(";");
      const quality = parseFloat(q.replace("q=", ""));
      return { code: code.split("-")[0].toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { code } of languages) {
    if (SUPPORTED_LOCALES.includes(code as (typeof SUPPORTED_LOCALES)[number])) {
      return code;
    }
  }

  return DEFAULT_LOCALE;
}

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  addSecurityHeaders(response);

  const localeCookie = request.cookies.get(LOCALE_COOKIE_NAME);
  if (!localeCookie) {
    const acceptLanguage = request.headers.get("accept-language");
    const detectedLocale = detectLocaleFromHeader(acceptLanguage);
    response.cookies.set(LOCALE_COOKIE_NAME, detectedLocale, {
      maxAge: LOCALE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: false,
    });
  }

  if (!pathname.startsWith("/admin")) {
    return response;
  }

  const unauthorized = new URL("/login", request.url);
  unauthorized.searchParams.set("next", pathname);

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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
