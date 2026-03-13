import { NextResponse } from "next/server";
import { z } from "zod";

import { trackGuestOrder } from "@/lib/db/orders";

const trackOrderSchema = z.object({
  orderCode: z.string().min(1),
  phoneOrEmail: z.string().min(3),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = trackOrderSchema.parse(json);
    const result = await trackGuestOrder(payload);

    if (!result) {
      return NextResponse.json(
        { ok: false, message: "Order not found. Check your order code and phone or email." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid tracking payload.", issues: error.issues },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected order tracking error.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
