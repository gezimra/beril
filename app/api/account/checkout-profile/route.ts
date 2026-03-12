import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedCustomerUser,
  getCheckoutProfileForAuthenticatedCustomer,
  updateCheckoutProfileForAuthenticatedCustomer,
} from "@/lib/db/customer-account";
import { phoneInputSchema } from "@/lib/validations/phone";

const updateCheckoutProfileSchema = z.object({
  customerName: z.string().trim().min(2),
  phone: phoneInputSchema,
  country: z.string().trim().min(2),
  city: z.string().trim().min(2),
  address: z.string().trim().min(4),
});

export async function GET() {
  const user = await getAuthenticatedCustomerUser();
  if (!user) {
    return NextResponse.json({ ok: true, signedIn: false });
  }

  const profile = await getCheckoutProfileForAuthenticatedCustomer();
  return NextResponse.json({
    ok: true,
    signedIn: true,
    profile,
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedCustomerUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    const json = await request.json();
    const payload = updateCheckoutProfileSchema.parse(json);

    await updateCheckoutProfileForAuthenticatedCustomer(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid profile payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update checkout profile.",
      },
      { status: 400 },
    );
  }
}
