import { NextResponse } from "next/server";
import { z } from "zod";

import { createOrder } from "@/lib/db/orders";
import { checkoutSchema } from "@/lib/validations/checkout";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  brand: z.string().min(1),
  category: z.enum(["watch", "eyewear"]),
  imageUrl: z.string().min(1),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(10),
  stockStatus: z.enum([
    "in_stock",
    "limited",
    "available_on_request",
    "out_of_stock",
  ]),
  ctaMode: z.enum([
    "add_to_cart",
    "reserve_in_store",
    "whatsapp_inquiry",
    "request_availability",
  ]),
});

const createOrderBodySchema = z.object({
  checkout: checkoutSchema,
  items: z.array(cartItemSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = createOrderBodySchema.parse(json);
    const order = await createOrder(payload);

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid order payload.", issues: error.issues },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected order creation error.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
