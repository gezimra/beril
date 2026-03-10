import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/db/supabase/server";
import { validateCouponForOrder } from "@/lib/db/payments-promotions";

const couponBodySchema = z.object({
  code: z.string().trim().min(1),
  subtotal: z.number().nonnegative(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = couponBodySchema.parse(json);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = supabase
      ? await supabase.auth.getUser()
      : { data: { user: null } };

    const result = await validateCouponForOrder({
      code: payload.code,
      subtotal: payload.subtotal,
      email: payload.email || null,
      phone: payload.phone || null,
      customerUserId: user?.id ?? null,
    });

    if (!result.valid) {
      return NextResponse.json({
        ok: true,
        valid: false,
        message: result.reason ?? "Coupon not valid.",
      });
    }

    return NextResponse.json({
      ok: true,
      valid: true,
      couponCode: result.code ?? payload.code.toUpperCase(),
      discountAmount: result.discountAmount ?? 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, valid: false, message: "Invalid coupon request." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected coupon validation error.";
    return NextResponse.json({ ok: false, valid: false, message }, { status: 400 });
  }
}
