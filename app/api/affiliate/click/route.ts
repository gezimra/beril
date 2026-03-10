import { NextResponse } from "next/server";
import { z } from "zod";

import { trackAffiliateClick } from "@/lib/db/growth-loyalty";

const clickSchema = z.object({
  code: z.string().trim().min(2),
  source: z.string().trim().optional(),
  landingPage: z.string().trim().optional(),
  visitorId: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = clickSchema.parse(json);

    const affiliate = await trackAffiliateClick({
      code: payload.code,
      source: payload.source ?? null,
      landingPage: payload.landingPage ?? null,
      visitorId: payload.visitorId ?? null,
    });

    if (!affiliate) {
      return NextResponse.json(
        { ok: false, message: "Affiliate code not found." },
        { status: 404 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      code: affiliate.code,
      affiliateId: affiliate.id,
    });

    response.cookies.set("beril_ref", affiliate.code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid affiliate payload." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected affiliate tracking error.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

